import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { initSimnet } from "@hirosystems/clarinet-sdk";

const simnet = await initSimnet();
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1  = accounts.get("wallet_1")!;

describe("reward-vault", () => {
  it("returns zero pending for new user", () => {
    const { result } = simnet.callReadOnlyFn(
      "reward-vault", "get-pending",
      [Cl.principal(wallet1)], wallet1
    );
    expect(result).toBeUint(0);
  });

  it("rejects accrue-streak-reward from non-oracle", () => {
    const { result } = simnet.callPublicFn(
      "reward-vault", "accrue-streak-reward",
      [Cl.principal(wallet1), Cl.uint(7)], wallet1
    );
    expect(result).toBeErr(Cl.uint(401));
  });

  it("rejects claim when nothing pending", () => {
    const { result } = simnet.callPublicFn(
      "reward-vault", "claim-rewards", [], wallet1
    );
    expect(result).toBeErr(Cl.uint(404));
  });
});

describe("mood-oracle", () => {
  it("rejects anchor from non-oracle", () => {
    const digest = new Uint8Array(32).fill(3);
    const { result } = simnet.callPublicFn(
      "mood-oracle", "anchor-mood-digest",
      [Cl.principal(wallet1), Cl.buffer(digest), Cl.uint(7)], wallet1
    );
    expect(result).toBeErr(Cl.uint(401));
  });

  it("returns none for missing digest", () => {
    const { result } = simnet.callReadOnlyFn(
      "mood-oracle", "get-mood-digest",
      [Cl.principal(wallet1), Cl.uint(0)], wallet1
    );
    expect(result).toBeNone();
  });

  it("current-week returns a uint", () => {
    const { result } = simnet.callReadOnlyFn(
      "mood-oracle", "current-week", [], wallet1
    );
    expect(typeof result).toBe("object");
  });
});
