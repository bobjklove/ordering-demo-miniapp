import type { Catalog, DemoState, Product, Sellable } from "./types";

export function toSellable(products: Product[], state: DemoState): Sellable[] {
  return products.map((product) => {
    const override = state.productOverrides[product.id] ?? {};
    const deltas = state.specDeltas[product.id] ?? {};
    return {
      ...product,
      price: override.price ?? product.price,
      onShelf: override.onShelf !== false,
      soldOut: override.soldOut === true,
      specs: product.specs.map((group) => ({
        ...group,
        options: group.options.map((option) => ({
          ...option,
          priceDelta: deltas[option.id] ?? option.priceDelta,
        })),
      })),
    };
  });
}

export function makeCatalog(products: Product[], state: DemoState): Catalog {
  const success = state.groups.some(
    (group) => group.status === "success" && group.campaignId === state.groupCampaign.id,
  );
  return {
    products: toSellable(products, state),
    levels: state.levels,
    pointsRule: state.pointsRule,
    deliveryFee: state.deliveryFee,
    group: state.groupCampaign.active
      ? { productId: state.groupCampaign.productId, price: state.groupCampaign.price, unlocked: success }
      : null,
    flash: state.flash.active
      ? {
          productId: state.flash.productId,
          price: state.flash.price,
          active: true,
          stockLeft: state.flash.stockLeft,
        }
      : null,
  };
}

export function visibleProducts(products: Sellable[]): Sellable[] {
  return products.filter((product) => product.onShelf);
}
