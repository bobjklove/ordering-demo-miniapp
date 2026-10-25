import { addToCart, priceLine, subtotalOf } from "./cart";
import { fail } from "./errors";
import { formatPickup, normalizeTable, transition } from "./order";
import { clampRedeem, levelFor, pointsEarned } from "./points";
import type {
  CartLine,
  Catalog,
  CheckoutInput,
  Coupon,
  CouponTemplate,
  DashboardBaseline,
  DashboardSummary,
  DemoState,
  GroupCampaign,
  Order,
  PointsRule,
  Product,
  WalletTier,
} from "./types";
import { makeCatalog } from "./catalog";

export interface PlaceIds {
  orderId: string;
}

function resolveCoupon(state: DemoState, couponId: string, subtotal: number, now: number): Coupon | null {
  if (!couponId) return null;
  const coupon = state.coupons.find((item) => item.id === couponId && item.memberId === state.member.id);
  if (!coupon || coupon.used || coupon.expiresAt <= now || subtotal < coupon.minSpend) fail("coupon_invalid");
  return coupon;
}

export function quoteCheckout(
  state: DemoState,
  products: Product[],
  input: Pick<CheckoutInput, "fulfillment" | "couponId" | "redeemPoints" | "useWallet"> & { lines: CartLine[] },
  now: number,
): { catalog: Catalog; coupon: Coupon | null; quote: ReturnType<typeof buildQuote> } {
  const catalog = makeCatalog(products, state);
  if (input.lines.length === 0) fail("empty_cart");
  const priced = input.lines.map((line) => priceLine(catalog, line));
  const subtotal = subtotalOf(priced);
  const deliveryFee = input.fulfillment === "delivery" ? state.deliveryFee : 0;
  const coupon = resolveCoupon(state, input.couponId, subtotal, now);
  const quote = buildQuote({
    state,
    catalog,
    lines: priced,
    subtotal,
    deliveryFee,
    coupon,
    redeemPoints: input.redeemPoints,
    useWallet: input.useWallet,
  });
  return { catalog, coupon, quote };
}

function buildQuote(args: {
  state: DemoState;
  catalog: Catalog;
  lines: ReturnType<typeof priceLine>[];
  subtotal: number;
  deliveryFee: number;
  coupon: Coupon | null;
  redeemPoints: number;
  useWallet: boolean;
}) {
  const discount = args.coupon ? Math.min(args.coupon.amountOff, args.subtotal) : 0;
  const afterCoupon = args.subtotal + args.deliveryFee - discount;
  const redeem = clampRedeem(args.redeemPoints, args.state.member.points, afterCoupon, args.state.pointsRule);
  const afterPoints = afterCoupon - redeem.value;
  const walletApplied = args.useWallet ? Math.min(args.state.member.walletBalance, afterPoints) : 0;
  const payable = afterPoints - walletApplied;
  const level = levelFor(args.state.member.lifetimePoints, args.state.levels);
  const pointsEarn = pointsEarned(afterPoints, args.state.pointsRule, level.multiplier);
  let payMethod: "mock-wechat" | "wallet" | "mixed" = "mock-wechat";
  if (walletApplied > 0 && payable === 0) payMethod = "wallet";
  else if (walletApplied > 0) payMethod = "mixed";
  return {
    lines: args.lines,
    subtotal: args.subtotal,
    deliveryFee: args.deliveryFee,
    discount,
    couponId: args.coupon?.id ?? "",
    pointsRedeemed: redeem.points,
    pointsValue: redeem.value,
    walletApplied,
    payable,
    payMethod,
    pointsEarn,
    levelId: level.id,
  };
}

export function placePaidOrder(
  state: DemoState,
  products: Product[],
  input: CheckoutInput & { lines: CartLine[] },
  now: number,
  ids: PlaceIds,
): { state: DemoState; order: Order } {
  if (!state.member.registered) fail("need_member");
  if (input.fulfillment === "dinein") {
    if (!normalizeTable(input.tableCode)) fail("need_table");
  }
  if (input.fulfillment === "delivery" && input.deliveryAddress.trim().length < 4) fail("need_address");
  if (!input.pickupTime.trim()) fail("need_time");
  const { catalog, quote } = quoteCheckout(state, products, input, now);
  const flashQty = quote.lines.filter((line) => line.pricing === "flash").reduce((sum, line) => sum + line.qty, 0);
  if (flashQty > 0) {
    if (!catalog.flash || catalog.flash.stockLeft < flashQty) fail("flash_stock");
  }
  const before = levelFor(state.member.lifetimePoints, state.levels);
  const lifetimePoints = state.member.lifetimePoints + quote.pointsEarn;
  const after = levelFor(lifetimePoints, state.levels);
  const order: Order = {
    id: ids.orderId,
    pickupNo: formatPickup(state.nextPickup, state.pickupPrefix),
    createdAt: now,
    status: "placed",
    fulfillment: input.fulfillment,
    tableCode: input.fulfillment === "dinein" ? normalizeTable(input.tableCode) ?? "" : "",
    deliveryAddress: input.fulfillment === "delivery" ? input.deliveryAddress.trim() : "",
    note: input.note.trim().slice(0, 80),
    pickupTime: input.pickupTime.trim(),
    lines: quote.lines,
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee,
    discount: quote.discount,
    couponId: quote.couponId,
    pointsRedeemed: quote.pointsRedeemed,
    pointsValue: quote.pointsValue,
    walletApplied: quote.walletApplied,
    payable: quote.payable,
    payMethod: quote.payMethod,
    pointsEarned: quote.pointsEarn,
    levelBefore: before.id,
    levelAfter: after.id,
    memberId: state.member.id,
    receipt: input.receipt,
  };
  const next: DemoState = {
    ...state,
    cart: [],
    nextPickup: state.nextPickup + 1,
    coupons: state.coupons.map((coupon) => (coupon.id === order.couponId ? { ...coupon, used: true } : coupon)),
    flash: flashQty > 0 ? { ...state.flash, stockLeft: state.flash.stockLeft - flashQty } : state.flash,
    orders: [order, ...state.orders],
    member: {
      ...state.member,
      points: state.member.points - quote.pointsRedeemed + quote.pointsEarn,
      lifetimePoints,
      lifetimeSpend: state.member.lifetimeSpend + quote.payable + quote.walletApplied,
      walletBalance: state.member.walletBalance - quote.walletApplied,
      ordersCount: state.member.ordersCount + 1,
      receipt: input.receipt ?? state.member.receipt,
    },
  };
  return { state: next, order };
}

export function applyOrderAction(state: DemoState, orderId: string, action: "accept" | "ready" | "complete"): DemoState {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) fail("missing_order");
  const status = transition(order.status, action);
  return {
    ...state,
    orders: state.orders.map((item) => (item.id === orderId ? { ...item, status } : item)),
  };
}

export function cancelOrder(state: DemoState, orderId: string): DemoState {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) fail("missing_order");
  const status = transition(order.status, "cancel");
  const flashQty = order.lines.filter((line) => line.pricing === "flash").reduce((sum, line) => sum + line.qty, 0);
  return {
    ...state,
    coupons: state.coupons.map((coupon) => (coupon.id && coupon.id === order.couponId ? { ...coupon, used: false } : coupon)),
    flash: flashQty > 0 ? { ...state.flash, stockLeft: state.flash.stockLeft + flashQty } : state.flash,
    orders: state.orders.map((item) => (item.id === orderId ? { ...item, status } : item)),
    member: {
      ...state.member,
      points: Math.max(0, state.member.points + order.pointsRedeemed - order.pointsEarned),
      lifetimePoints: Math.max(0, state.member.lifetimePoints - order.pointsEarned),
      walletBalance: state.member.walletBalance + order.walletApplied,
      lifetimeSpend: Math.max(0, state.member.lifetimeSpend - (order.payable + order.walletApplied)),
      ordersCount: Math.max(0, state.member.ordersCount - 1),
    },
  };
}

export function linesFromOrder(order: Order): CartLine[] {
  return order.lines.map((line) => ({
    lineId: line.lineId,
    productId: line.productId,
    qty: line.qty,
    specIds: { ...line.specIds },
    addonIds: [...line.addonIds],
    pricing: "regular" as const,
  }));
}

export function reorderIntoCart(state: DemoState, products: Product[], order: Order): { state: DemoState; skipped: string[] } {
  const catalog = makeCatalog(products, state);
  const skipped: string[] = [];
  let cart = state.cart;
  for (const line of linesFromOrder(order)) {
    const product = catalog.products.find((item) => item.id === line.productId);
    if (!product || !product.onShelf || product.soldOut) {
      skipped.push(line.productId);
      continue;
    }
    cart = addToCart(cart, line);
  }
  return { state: { ...state, cart }, skipped };
}

export function issueCoupon(state: DemoState, template: CouponTemplate, now: number, id: string): DemoState {
  const coupon: Coupon = {
    id,
    templateId: template.id,
    name: template.name,
    kind: template.kind,
    amountOff: template.amountOff,
    minSpend: template.minSpend,
    expiresAt: now + template.daysValid * 86_400_000,
    used: false,
    memberId: state.member.id,
  };
  return { ...state, coupons: [coupon, ...state.coupons] };
}

export function claimShare(state: DemoState, template: CouponTemplate, now: number, id: string): DemoState {
  if (state.shareClaimed) return state;
  return { ...issueCoupon(state, template, now, id), shareClaimed: true };
}

export function registerMember(
  state: DemoState,
  profile: { name: string; phone: string },
  newcomer: CouponTemplate | null,
  now: number,
  couponId: string,
): DemoState {
  const member = { ...state.member, name: profile.name.trim() || state.member.name, phone: profile.phone.trim(), registered: true };
  let next: DemoState = { ...state, member };
  const already = next.coupons.some((coupon) => coupon.templateId === newcomer?.id && !coupon.used);
  if (newcomer && next.member.ordersCount === 0 && !already) {
    next = issueCoupon(next, newcomer, now, couponId);
  }
  return next;
}

export function signOutMember(state: DemoState): DemoState {
  return { ...state, member: { ...state.member, registered: false } };
}

export function topUp(state: DemoState, tier: WalletTier): DemoState {
  if (!Number.isInteger(tier.pay) || tier.pay <= 0 || !Number.isInteger(tier.bonus) || tier.bonus < 0) fail("bad_price");
  return {
    ...state,
    member: { ...state.member, walletBalance: state.member.walletBalance + tier.pay + tier.bonus },
  };
}

export function saveReceipt(state: DemoState, receipt: DemoState["member"]["receipt"]): DemoState {
  return { ...state, member: { ...state.member, receipt } };
}

export function setPendingTable(state: DemoState, code: string): DemoState {
  const normalized = normalizeTable(code);
  if (!normalized) return state;
  return { ...state, pendingTable: normalized };
}

export function withCart(state: DemoState, cart: CartLine[]): DemoState {
  return { ...state, cart };
}

export function setShelf(state: DemoState, productId: string, onShelf: boolean): DemoState {
  return {
    ...state,
    productOverrides: {
      ...state.productOverrides,
      [productId]: { ...state.productOverrides[productId], onShelf },
    },
  };
}

export function setSoldOut(state: DemoState, productId: string, soldOut: boolean): DemoState {
  return {
    ...state,
    productOverrides: {
      ...state.productOverrides,
      [productId]: { ...state.productOverrides[productId], soldOut },
    },
  };
}

export function setPrice(state: DemoState, productId: string, price: number): DemoState {
  if (!Number.isInteger(price) || price < 0) fail("bad_price");
  return {
    ...state,
    productOverrides: {
      ...state.productOverrides,
      [productId]: { ...state.productOverrides[productId], price },
    },
  };
}

export function setSpecDelta(state: DemoState, productId: string, optionId: string, delta: number): DemoState {
  if (!Number.isInteger(delta)) fail("bad_price");
  return {
    ...state,
    specDeltas: {
      ...state.specDeltas,
      [productId]: { ...(state.specDeltas[productId] ?? {}), [optionId]: delta },
    },
  };
}

export function setPointsRule(state: DemoState, rule: PointsRule): DemoState {
  if (rule.pointsPerUnit < 0 || rule.redeemPoints <= 0 || rule.redeemCents <= 0) fail("bad_rule");
  if (rule.maxRedeemRatio < 0 || rule.maxRedeemRatio > 1) fail("bad_rule");
  return { ...state, pointsRule: { ...rule } };
}

export function setLevels(state: DemoState, levels: DemoState["levels"]): DemoState {
  if (levels.length === 0) fail("bad_rule");
  return { ...state, levels: levels.map((level) => ({ ...level, name: { ...level.name } })) };
}

export function setGroupCampaign(state: DemoState, patch: Partial<GroupCampaign>): DemoState {
  const groupCampaign: GroupCampaign = { ...state.groupCampaign, ...patch };
  if (!Number.isInteger(groupCampaign.price) || groupCampaign.price < 0) fail("bad_price");
  if (!Number.isInteger(groupCampaign.need) || groupCampaign.need < 2) fail("bad_rule");
  return {
    ...state,
    groupCampaign,
    groups: state.groups.map((group) =>
      group.status === "open" ? { ...group, need: groupCampaign.need, price: groupCampaign.price } : group,
    ),
  };
}

export function startGroup(state: DemoState, now: number, id: string): DemoState {
  if (!state.groupCampaign.active) fail("group_inactive");
  if (state.groups.some((group) => group.campaignId === state.groupCampaign.id && (group.status === "open" || group.status === "success"))) {
    return state;
  }
  return {
    ...state,
    groups: [
      ...state.groups,
      {
        id,
        campaignId: state.groupCampaign.id,
        productId: state.groupCampaign.productId,
        need: state.groupCampaign.need,
        joined: 1,
        status: "open",
        price: state.groupCampaign.price,
        createdAt: now,
      },
    ],
  };
}

export function mockFriendJoin(state: DemoState, groupId: string): DemoState {
  return {
    ...state,
    groups: state.groups.map((group) => {
      if (group.id !== groupId || group.status !== "open") return group;
      const joined = group.joined + 1;
      return { ...group, joined, status: joined >= group.need ? "success" : "open" };
    }),
  };
}

export function clearGroups(state: DemoState): DemoState {
  return { ...state, groups: [] };
}

export function setFlash(state: DemoState, patch: Partial<DemoState["flash"]>): DemoState {
  const flash = { ...state.flash, ...patch };
  if (!Number.isInteger(flash.price) || flash.price < 0 || !Number.isInteger(flash.stockLeft) || flash.stockLeft < 0) {
    fail("bad_price");
  }
  return { ...state, flash };
}

export function extendFlashIfExpired(state: DemoState, now: number, durationMs: number): DemoState {
  if (!state.flash.active || state.flash.endsAt > now) return state;
  return { ...state, flash: { ...state.flash, endsAt: now + durationMs } };
}

export function liveDashboard(baseline: DashboardBaseline, orders: Order[], now: number): DashboardSummary {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const todays = orders.filter((order) => order.createdAt >= start.getTime() && order.status !== "cancelled");
  const liveRevenue = todays.reduce((sum, order) => sum + order.payable + order.walletApplied, 0);
  const hot = new Map(baseline.hot.map((item) => [item.productId, item.count]));
  for (const order of todays) {
    for (const line of order.lines) hot.set(line.productId, (hot.get(line.productId) ?? 0) + line.qty);
  }
  return {
    orders: baseline.todayOrders + todays.length,
    revenue: baseline.todayRevenue + liveRevenue,
    repurchaseRate: baseline.repurchaseRate,
    pending: orders.filter((order) => order.status === "placed" || order.status === "preparing").length,
    hot: [...hot.entries()]
      .map(([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count),
    liveOrders: todays.length,
    liveRevenue,
  };
}
