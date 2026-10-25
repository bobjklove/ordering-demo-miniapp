import { shop } from "@demo/shop";

export function statusPad(): string {
  try {
    const height = uni.getSystemInfoSync().statusBarHeight || 0;
    return `${height + 8}px`;
  } catch {
    return "12px";
  }
}

export function go(url: string): void {
  uni.navigateTo({ url });
}

export function tab(url: string): void {
  uni.reLaunch({ url });
}

export function goBack(): void {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.reLaunch({ url: "/pages/home/index" });
}

export function callShop(): void {
  uni.makePhoneCall({ phoneNumber: shop.phoneDial });
}

export function openShopMap(): void {
  if (typeof window !== "undefined" && typeof window.open === "function" && typeof localStorage !== "undefined") {
    const { lat, lng } = shop.geo;
    window.open(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
      "_blank",
      "noopener,noreferrer",
    );
    return;
  }
  uni.openLocation({
    latitude: shop.geo.lat,
    longitude: shop.geo.lng,
    name: shop.name.zh,
    address: shop.address.zh,
    scale: 16,
  });
}

export function openAdmin(): void {
  // #ifdef H5
  window.location.assign("/admin/#/orders");
  // #endif
}
