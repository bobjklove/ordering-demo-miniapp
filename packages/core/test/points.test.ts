import { describe, expect, it } from "vitest";
import { clampRedeem, levelFor, levelProgress, pointsEarned } from "../src/points";
import { levels, rule } from "./fixture";

describe("points calculation", () => {
  it("earns 1 point per currency unit, times the level multiplier, floored", () => {
    expect(pointsEarned(4600, rule, 1)).toBe(46);
    expect(pointsEarned(4600, rule, 1.2)).toBe(55);
    expect(pointsEarned(4600, rule, 1.5)).toBe(69);
    expect(pointsEarned(50, rule, 1.2)).toBe(0);
    expect(pointsEarned(0, rule, 1.2)).toBe(0);
  });

  it("redeems 100 points as 1.00 and caps at half the post-coupon amount", () => {
    expect(clampRedeem(100, 400, 4700, rule)).toEqual({ points: 100, value: 100 });
    expect(clampRedeem(10_000, 400, 4700, rule)).toEqual({ points: 400, value: 400 });
    expect(clampRedeem(10_000, 5000, 4700, rule)).toEqual({ points: 2350, value: 2350 });
    expect(clampRedeem(100, 400, 0, rule)).toEqual({ points: 0, value: 0 });
  });

  it("picks the member level from lifetime points", () => {
    expect(levelFor(0, levels).id).toBe("sprout");
    expect(levelFor(299, levels).id).toBe("sprout");
    expect(levelFor(300, levels).id).toBe("regular");
    expect(levelFor(1160, levels).id).toBe("regular");
    expect(levelFor(1199, levels).id).toBe("regular");
    expect(levelFor(1200, levels).id).toBe("house");
    const progress = levelProgress(1160, levels);
    expect(progress.next?.id).toBe("house");
    expect(progress.remaining).toBe(40);
  });
});
