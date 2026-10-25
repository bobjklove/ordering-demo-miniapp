export interface NotifyOrder {
  id: string;
  status: string;
}

/**
 * Placed orders the shop has not been told about yet.
 * Already-known ids and orders past "placed" stay quiet.
 */
export function incomingPlacedOrders(knownIds: ReadonlySet<string>, orders: readonly NotifyOrder[]): string[] {
  const fresh: string[] = [];
  for (const order of orders) {
    if (knownIds.has(order.id)) continue;
    if (order.status === "placed") fresh.push(order.id);
  }
  return fresh;
}
