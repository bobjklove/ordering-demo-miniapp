import type { Level, PointsRule } from "./types";

export function levelFor(lifetimePoints: number, levels: Level[]): Level {
  const sorted = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  const first = sorted[0];
  if (!first) {
    return { id: "base", name: { zh: "会员", en: "Member" }, minPoints: 0, multiplier: 1 };
  }
  let current = first;
  for (const level of sorted) {
    if (lifetimePoints >= level.minPoints) current = level;
  }
  return current;
}

export function levelProgress(lifetimePoints: number, levels: Level[]): {
  current: Level;
  next: Level | null;
  ratio: number;
  remaining: number;
} {
  const sorted = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  const current = levelFor(lifetimePoints, sorted);
  const index = sorted.findIndex((level) => level.id === current.id);
  const next = sorted[index + 1] ?? null;
  if (!next) return { current, next: null, ratio: 1, remaining: 0 };
  const span = next.minPoints - current.minPoints;
  const gained = lifetimePoints - current.minPoints;
  const ratio = span <= 0 ? 1 : Math.min(1, Math.max(0, gained / span));
  return { current, next, ratio, remaining: Math.max(0, next.minPoints - lifetimePoints) };
}

/** Points earned on the amount settled with money or stored value, after coupons and point redemption. */
export function pointsEarned(basisCents: number, rule: PointsRule, multiplier: number): number {
  if (basisCents <= 0 || rule.pointsPerUnit <= 0 || multiplier <= 0) return 0;
  const units = Math.floor(basisCents / 100);
  return Math.floor(units * rule.pointsPerUnit * multiplier);
}

export function clampRedeem(
  requested: number,
  balance: number,
  afterCoupon: number,
  rule: PointsRule,
): { points: number; value: number } {
  const want = Math.max(0, Math.floor(requested));
  if (afterCoupon <= 0 || rule.redeemPoints <= 0 || rule.redeemCents <= 0 || rule.maxRedeemRatio <= 0) {
    return { points: 0, value: 0 };
  }
  const centsPerPoint = rule.redeemCents / rule.redeemPoints;
  const maxValue = Math.floor(afterCoupon * rule.maxRedeemRatio);
  const maxByRule = Math.floor(maxValue / centsPerPoint);
  const points = Math.min(Math.max(0, balance), want, Math.max(0, maxByRule));
  const value = Math.min(afterCoupon, Math.floor(points * centsPerPoint));
  return { points, value };
}
