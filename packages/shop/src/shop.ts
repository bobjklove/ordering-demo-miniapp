import type { Addon, Category, CouponTemplate, DashboardBaseline, Level, Localized, PointsRule, Product, SpecGroup, WalletTier } from "@demo/core";

/**
 * RE-SKIN THIS FILE for a new merchant.
 * 换一家店时改这里：店名、印章字、主题色、地址电话、菜单、券和活动。
 * Every name in this file is fictional. Do not paste a real shop, brand, or person.
 */

const size = (): SpecGroup => ({
  id: "size",
  name: { zh: "杯型", en: "Size" },
  required: true,
  options: [
    { id: "m", name: { zh: "中杯", en: "Medium" }, priceDelta: 0 },
    { id: "l", name: { zh: "大杯", en: "Large" }, priceDelta: 300 },
  ],
});

const sweet = (): SpecGroup => ({
  id: "sweet",
  name: { zh: "甜度", en: "Sweetness" },
  required: true,
  options: [
    { id: "0", name: { zh: "无糖", en: "No sugar" }, priceDelta: 0 },
    { id: "30", name: { zh: "三分糖", en: "30% sugar" }, priceDelta: 0 },
    { id: "50", name: { zh: "五分糖", en: "50% sugar" }, priceDelta: 0 },
    { id: "70", name: { zh: "七分糖", en: "70% sugar" }, priceDelta: 0 },
    { id: "100", name: { zh: "全糖", en: "Full sugar" }, priceDelta: 0 },
  ],
});

const ice = (): SpecGroup => ({
  id: "ice",
  name: { zh: "冰度", en: "Ice" },
  required: true,
  options: [
    { id: "none", name: { zh: "去冰", en: "No ice" }, priceDelta: 0 },
    { id: "less", name: { zh: "少冰", en: "Less ice" }, priceDelta: 0 },
    { id: "normal", name: { zh: "正常冰", en: "Regular ice" }, priceDelta: 0 },
    { id: "extra", name: { zh: "多冰", en: "Extra ice" }, priceDelta: 0 },
  ],
});

const spice = (): SpecGroup => ({
  id: "spice",
  name: { zh: "辣度", en: "Spice" },
  required: true,
  options: [
    { id: "none", name: { zh: "不辣", en: "No spice" }, priceDelta: 0 },
    { id: "mild", name: { zh: "微辣", en: "Mild" }, priceDelta: 0 },
    { id: "medium", name: { zh: "中辣", en: "Medium" }, priceDelta: 0 },
  ],
});

const heat = (): SpecGroup => ({
  id: "heat",
  name: { zh: "温度", en: "Serve" },
  required: true,
  options: [
    { id: "room", name: { zh: "常温", en: "Room temp" }, priceDelta: 0 },
    { id: "warm", name: { zh: "加热", en: "Warmed" }, priceDelta: 0 },
  ],
});

const tapioca: Addon = { id: "pearl", name: { zh: "珍珠", en: "Tapioca" }, price: 200 };
const jelly: Addon = { id: "jelly", name: { zh: "椰果", en: "Coconut jelly" }, price: 200 };
const foam: Addon = { id: "foam", name: { zh: "奶盖", en: "Cheese foam" }, price: 400 };
const taro: Addon = { id: "taro", name: { zh: "芋圆", en: "Taro balls" }, price: 300 };
const drinkAddons = [tapioca, jelly, foam, taro];

export const shop = {
  id: "nanfeng",
  name: { zh: "南风茶食", en: "Nanfeng Tea & Bites" } as Localized,
  slogan: { zh: "一口南风，半日从容", en: "A south wind, and a slower hour" } as Localized,
  logoText: "南",
  regionLabel: { zh: "虚构演示店 · 示范港", en: "Fictional demo shop · Sample Harbour" } as Localized,
  phoneDisplay: "+1 555-0100",
  phoneDial: "+15550100",
  address: { zh: "示范港海港巷 18 号", en: "18 Harbour Lane, Sample Harbour" } as Localized,
  hours: { zh: "每日 11:00–21:30", en: "Daily 11:00–21:30" } as Localized,
  notice: {
    zh: "外送由本店自己送。堂食请填桌牌上的桌码。",
    en: "The shop delivers the order. For dine-in, enter the code on the table card.",
  } as Localized,
  /** Fictional pin so the map button has somewhere to open. Not a real shop. */
  geo: { lat: 49.25, lng: -123.12 },
  currencySymbol: "$",
  currencyCode: "CAD",
  theme: {
    primary: "#C4522A",
    primaryDark: "#8C3418",
    ink: "#2A2118",
    paper: "#F6F0E6",
    card: "#FFFBF5",
    accent: "#E3B15A",
    leaf: "#2F6A4A",
    muted: "#8A7664",
  },
  storageKey: "nf-demo:nanfeng:v1",
  channelName: "nf-demo:nanfeng",
  pickupPrefix: "A",
  deliveryFee: 0,
  flashDurationMs: 2 * 60 * 60 * 1000,
  tableCodes: ["T1", "T2", "T3", "T8", "T12"],
  adminUser: "demo",
  adminPassword: "nanfeng",
  banners: [
    {
      id: "flash",
      kicker: { zh: "限时", en: "For a while" },
      title: { zh: "桂花酿奶茶", en: "Osmanthus milk tea" },
      subtitle: { zh: "秒杀价 $13.00", en: "Flash price $13.00" },
      tone: "#C4522A",
    },
    {
      id: "set",
      kicker: { zh: "套餐", en: "Set" },
      title: { zh: "南风双人套", en: "Nanfeng set for two" },
      subtitle: { zh: "茶点一起带走", en: "Tea and bites, together" },
      tone: "#2F6A4A",
    },
    {
      id: "wallet",
      kicker: { zh: "储值", en: "Stored value" },
      title: { zh: "存 $100 送 $8", en: "Add $100, get $8" },
      subtitle: { zh: "演示充值，不会真实扣款", en: "Demo top-up, nothing is charged" },
      tone: "#3E4C6A",
    },
  ],
  categories: [
    { id: "tea", name: { zh: "招牌茶饮", en: "Tea" } },
    { id: "bake", name: { zh: "烘焙", en: "Bakery" } },
    { id: "bites", name: { zh: "小食", en: "Small plates" } },
    { id: "sets", name: { zh: "套餐", en: "Sets" } },
  ] as Category[],
  products: [
    {
      id: "osmanthus",
      categoryId: "tea",
      name: { zh: "桂花酿奶茶", en: "Osmanthus milk tea" },
      desc: { zh: "酒酿的淡甜，配烘过的桂花", en: "Fermented rice, toasted osmanthus" },
      price: 1800,
      emoji: "🌼",
      tone: "#F3D7A1",
      specs: [size(), sweet(), ice()],
      addons: drinkAddons,
      badges: ["flash", "new"],
    },
    {
      id: "oolong",
      categoryId: "tea",
      name: { zh: "烤糯乌龙", en: "Roasted oolong latte" },
      desc: { zh: "焙火乌龙，奶香收口", en: "Roasted oolong, milky finish" },
      price: 1600,
      emoji: "🍵",
      tone: "#E7CDB4",
      specs: [size(), sweet(), ice()],
      addons: drinkAddons,
      badges: ["hot"],
    },
    {
      id: "jasmine",
      categoryId: "tea",
      name: { zh: "茉莉绿茶", en: "Jasmine green" },
      desc: { zh: "清口，适合配酥点", en: "A clean cup beside pastry" },
      price: 1200,
      emoji: "🍃",
      tone: "#D7E4C8",
      specs: [size(), sweet(), ice()],
      addons: drinkAddons,
    },
    {
      id: "pearl",
      categoryId: "tea",
      name: { zh: "黑糖珍珠鲜奶", en: "Brown-sugar pearl milk" },
      desc: { zh: "鲜奶打底，珍珠另算可再加", en: "Fresh milk; tapioca is extra" },
      price: 1700,
      emoji: "🧋",
      tone: "#E8C4A4",
      specs: [size(), sweet(), ice()],
      addons: drinkAddons,
      badges: ["hot"],
    },
    {
      id: "yolk",
      categoryId: "bake",
      name: { zh: "蛋黄酥", en: "Salted-yolk pastry" },
      desc: { zh: "一口酥壳，咸甜蛋黄", en: "Flaky shell, salted yolk" },
      price: 900,
      emoji: "🥮",
      tone: "#F0D2A0",
      specs: [heat()],
      addons: [],
      badges: ["new"],
    },
    {
      id: "pancake",
      categoryId: "bake",
      name: { zh: "红豆松饼", en: "Red-bean pancake" },
      desc: { zh: "松软饼底，红豆偏甜", en: "Soft pancake, sweet red bean" },
      price: 2200,
      emoji: "🥞",
      tone: "#E7B7A2",
      specs: [heat()],
      addons: [],
      badges: ["group"],
    },
    {
      id: "scallion",
      categoryId: "bites",
      name: { zh: "葱油饼", en: "Scallion flatbread" },
      desc: { zh: "外脆，葱香重一点", en: "Crisp edges, plenty of scallion" },
      price: 800,
      emoji: "🫓",
      tone: "#E6D3A3",
      specs: [spice()],
      addons: [],
    },
    {
      id: "wonton",
      categoryId: "bites",
      name: { zh: "鲜虾云吞", en: "Shrimp wonton" },
      desc: { zh: "清汤，六只", en: "Clear broth, six pieces" },
      price: 1900,
      emoji: "🥟",
      tone: "#F0E2C8",
      specs: [spice()],
      addons: [],
    },
    {
      id: "chasiu",
      categoryId: "bites",
      name: { zh: "叉烧饭盒", en: "Char siu rice box" },
      desc: { zh: "叉烧、时蔬、米饭", en: "Char siu, greens, rice" },
      price: 2400,
      emoji: "🍚",
      tone: "#E8B89A",
      specs: [spice()],
      addons: [],
      badges: ["hot"],
    },
    {
      id: "set-two",
      categoryId: "sets",
      name: { zh: "南风双人套", en: "Nanfeng set for two" },
      desc: { zh: "两杯中杯茶 + 蛋黄酥两只", en: "Two medium teas and two pastries" },
      price: 4600,
      emoji: "🧺",
      tone: "#E3B15A",
      specs: [],
      addons: [],
      badges: ["hot"],
    },
  ] as Product[],
  levels: [
    { id: "sprout", name: { zh: "茶芽", en: "Sprout" }, minPoints: 0, multiplier: 1 },
    { id: "regular", name: { zh: "常客", en: "Regular" }, minPoints: 300, multiplier: 1.2 },
    { id: "house", name: { zh: "南风卡", en: "House card" }, minPoints: 1200, multiplier: 1.5 },
  ] as Level[],
  pointsRule: {
    pointsPerUnit: 1,
    redeemPoints: 100,
    redeemCents: 100,
    maxRedeemRatio: 0.5,
  } as PointsRule,
  walletTiers: [
    { pay: 5000, bonus: 300 },
    { pay: 10000, bonus: 800 },
    { pay: 20000, bonus: 2000 },
  ] as WalletTier[],
  couponTemplates: [
    { id: "newcomer", kind: "newcomer", name: { zh: "新客券", en: "New-guest coupon" }, amountOff: 300, minSpend: 0, daysValid: 30 },
    { id: "threshold", kind: "threshold", name: { zh: "满减券", en: "Spend-and-save" }, amountOff: 500, minSpend: 3000, daysValid: 30 },
    { id: "birthday", kind: "birthday", name: { zh: "生日券", en: "Birthday coupon" }, amountOff: 800, minSpend: 0, daysValid: 30 },
    { id: "share", kind: "share", name: { zh: "分享券", en: "Share coupon" }, amountOff: 200, minSpend: 1500, daysValid: 14 },
    { id: "manual", kind: "manual", name: { zh: "店主赠券", en: "Shop gift" }, amountOff: 400, minSpend: 2000, daysValid: 14 },
  ] as CouponTemplate[],
  groupCampaign: {
    id: "group-pancake",
    productId: "pancake",
    price: 1600,
    need: 2,
    active: true,
  },
  flash: {
    id: "flash-osmanthus",
    productId: "osmanthus",
    price: 1300,
    stock: 20,
  },
  dashboard: {
    todayOrders: 36,
    todayRevenue: 128400,
    repurchaseRate: 0.37,
    hot: [
      { productId: "osmanthus", count: 22 },
      { productId: "pearl", count: 18 },
      { productId: "chasiu", count: 11 },
      { productId: "yolk", count: 9 },
    ],
  } as DashboardBaseline,
  demoMember: {
    id: "m-ahe",
    name: "林阿禾",
    phone: "555-****-0101",
    birthday: "03-18",
    points: 400,
    lifetimePoints: 1160,
    lifetimeSpend: 28600,
    walletBalance: 2500,
    ordersCount: 1,
  },
  directory: [
    {
      id: "m-xiaoman",
      name: "周小满",
      phone: "555-****-0102",
      points: 860,
      lifetimePoints: 860,
      ordersCount: 9,
      note: { zh: "演示名册，不会登录点单", en: "Directory only — cannot sign in" },
    },
    {
      id: "m-beibei",
      name: "梁北北",
      phone: "555-****-0103",
      points: 40,
      lifetimePoints: 40,
      ordersCount: 1,
      note: { zh: "演示名册，不会登录点单", en: "Directory only — cannot sign in" },
    },
  ],
  seedReceipt: {
    kind: "personal" as const,
    title: "个人",
    name: "林阿禾",
    email: "ahe@example.com",
    taxId: "",
  },
};

export type Shop = typeof shop;
