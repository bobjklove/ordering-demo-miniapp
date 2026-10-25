export type Locale = "zh" | "en";

export interface Localized {
  zh: string;
  en: string;
}

export interface SpecOption {
  id: string;
  name: Localized;
  priceDelta: number;
}

export interface SpecGroup {
  id: string;
  name: Localized;
  required: boolean;
  options: SpecOption[];
}

export interface Addon {
  id: string;
  name: Localized;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: Localized;
  desc: Localized;
  price: number;
  emoji: string;
  tone: string;
  specs: SpecGroup[];
  addons: Addon[];
  badges?: Array<"hot" | "new" | "flash" | "group">;
}

export interface Sellable extends Product {
  onShelf: boolean;
  soldOut: boolean;
}

export interface Category {
  id: string;
  name: Localized;
}

export type PricingMode = "regular" | "flash" | "group";

export interface CartLine {
  lineId: string;
  productId: string;
  qty: number;
  specIds: Record<string, string>;
  addonIds: string[];
  pricing: PricingMode;
}

export interface PricedLine extends CartLine {
  name: Localized;
  unitPrice: number;
  lineTotal: number;
  specSummary: Localized;
  addonSummary: Localized;
}

export type CouponKind = "newcomer" | "threshold" | "birthday" | "share" | "manual";

export interface Coupon {
  id: string;
  templateId: string;
  name: Localized;
  kind: CouponKind;
  amountOff: number;
  minSpend: number;
  expiresAt: number;
  used: boolean;
  memberId: string;
}

export interface CouponTemplate {
  id: string;
  kind: CouponKind;
  name: Localized;
  amountOff: number;
  minSpend: number;
  daysValid: number;
}

export interface PointsRule {
  /** Points earned per 1.00 of currency, before the level multiplier. */
  pointsPerUnit: number;
  /** Points consumed per redemption block. */
  redeemPoints: number;
  /** Cents credited per redemption block. */
  redeemCents: number;
  /** Cap on redemption value, as a fraction of the post-coupon subtotal. */
  maxRedeemRatio: number;
}

export interface Level {
  id: string;
  name: Localized;
  minPoints: number;
  multiplier: number;
}

export interface ReceiptInfo {
  kind: "personal" | "business";
  title: string;
  name: string;
  email: string;
  taxId: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  points: number;
  lifetimePoints: number;
  lifetimeSpend: number;
  walletBalance: number;
  ordersCount: number;
  registered: boolean;
  receipt: ReceiptInfo | null;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  phone: string;
  points: number;
  lifetimePoints: number;
  ordersCount: number;
  note: Localized;
}

export type Fulfillment = "pickup" | "dinein" | "delivery";
export type PayMethod = "mock-wechat" | "wallet" | "mixed";
export type OrderStatus = "placed" | "preparing" | "ready" | "completed" | "cancelled";
export type OrderAction = "accept" | "ready" | "complete" | "cancel";

export interface Order {
  id: string;
  pickupNo: string;
  createdAt: number;
  status: OrderStatus;
  fulfillment: Fulfillment;
  tableCode: string;
  deliveryAddress: string;
  note: string;
  pickupTime: string;
  lines: PricedLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponId: string;
  pointsRedeemed: number;
  pointsValue: number;
  walletApplied: number;
  payable: number;
  payMethod: PayMethod;
  pointsEarned: number;
  levelBefore: string;
  levelAfter: string;
  memberId: string;
  receipt: ReceiptInfo | null;
}

export interface GroupCampaign {
  id: string;
  productId: string;
  price: number;
  need: number;
  active: boolean;
}

export interface GroupInstance {
  id: string;
  campaignId: string;
  productId: string;
  need: number;
  joined: number;
  status: "open" | "success";
  price: number;
  createdAt: number;
}

export interface FlashCampaign {
  id: string;
  productId: string;
  price: number;
  stockLeft: number;
  active: boolean;
  endsAt: number;
}

export interface ProductOverride {
  price?: number;
  onShelf?: boolean;
  soldOut?: boolean;
}

export interface WalletTier {
  pay: number;
  bonus: number;
}

export interface DemoState {
  version: 1;
  cart: CartLine[];
  productOverrides: Record<string, ProductOverride>;
  specDeltas: Record<string, Record<string, number>>;
  member: Member;
  directory: DirectoryEntry[];
  coupons: Coupon[];
  orders: Order[];
  groups: GroupInstance[];
  groupCampaign: GroupCampaign;
  flash: FlashCampaign;
  pointsRule: PointsRule;
  levels: Level[];
  nextPickup: number;
  pendingTable: string;
  shareClaimed: boolean;
  deliveryFee: number;
  pickupPrefix: string;
}

export interface Catalog {
  products: Sellable[];
  levels: Level[];
  pointsRule: PointsRule;
  deliveryFee: number;
  group: { productId: string; price: number; unlocked: boolean } | null;
  flash: { productId: string; price: number; active: boolean; stockLeft: number } | null;
}

export interface Quote {
  lines: PricedLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponId: string;
  pointsRedeemed: number;
  pointsValue: number;
  walletApplied: number;
  payable: number;
  payMethod: PayMethod;
  pointsEarn: number;
  levelId: string;
}

export interface CheckoutInput {
  fulfillment: Fulfillment;
  tableCode: string;
  deliveryAddress: string;
  note: string;
  pickupTime: string;
  couponId: string;
  redeemPoints: number;
  useWallet: boolean;
  receipt: ReceiptInfo | null;
}

export interface DashboardBaseline {
  todayOrders: number;
  todayRevenue: number;
  repurchaseRate: number;
  hot: Array<{ productId: string; count: number }>;
}

export interface DashboardSummary {
  orders: number;
  revenue: number;
  repurchaseRate: number;
  pending: number;
  hot: Array<{ productId: string; count: number }>;
  liveOrders: number;
  liveRevenue: number;
}
