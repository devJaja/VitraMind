import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { initSimnet } from "@hirosystems/clarinet-sdk";

const simnet = await initSimnet();
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1  = accounts.get("wallet_1")!;

describe("goal-tracker", () => {
  it("commits a goal and returns id 0", () => {
    const commitment = new Uint8Array(32).fill(1);
    const { result } = simnet.callPublicFn(
      "goal-tracker", "commit-goal",
      [Cl.buffer(commitment)], wallet1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("increments goal count", () => {
    const { result } = simnet.callReadOnlyFn(
      "goal-tracker", "get-goal-count",
      [Cl.principal(wallet1)], wallet1
    );
    expect(result).toBeUint(1);
  });

  it("updates goal status to completed", () => {
    const { result } = simnet.callPublicFn(
      "goal-tracker", "update-goal-status",
      [Cl.uint(0), Cl.uint(1)], wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("rejects invalid status > 2", () => {
    const { result } = simnet.callPublicFn(
      "goal-tracker", "update-goal-status",
      [Cl.uint(0), Cl.uint(5)], wallet1
    );
    expect(result).toBeErr(Cl.uint(400));
  });

  it("recommits goal with new hash", () => {
    const newHash = new Uint8Array(32).fill(2);
    const { result } = simnet.callPublicFn(
      "goal-tracker", "recommit-goal",
      [Cl.uint(0), Cl.buffer(newHash)], wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("returns ERR-NOT-FOUND for non-existent goal", () => {
    const { result } = simnet.callPublicFn(
      "goal-tracker", "update-goal-status",
      [Cl.uint(99), Cl.uint(1)], wallet1
    );
    expect(result).toBeErr(Cl.uint(404));
  });
});

describe("leaderboard", () => {
  it("publishes a score entry", () => {
    const { result } = simnet.callPublicFn(
      "leaderboard", "publish-score",
      [Cl.stringAscii("GrowthHero"), Cl.uint(14), Cl.uint(500)], wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("reads back the entry", () => {
    const { result } = simnet.callReadOnlyFn(
      "leaderboard", "get-entry",
      [Cl.principal(wallet1)], wallet1
    );
    expect(result).toBeSome();
  });

  it("removes entry", () => {
    const { result } = simnet.callPublicFn(
      "leaderboard", "remove-entry", [], wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
    const { result: after } = simnet.callReadOnlyFn(
      "leaderboard", "get-entry",
      [Cl.principal(wallet1)], wallet1
    );
    expect(after).toBeNone();
  });

  it("rejects alias longer than 24 chars", () => {
    const { result } = simnet.callPublicFn(
      "leaderboard", "publish-score",
      [Cl.stringAscii("ThisAliasIsWayTooLongForTheLimit"), Cl.uint(1), Cl.uint(0)], wallet1
    );
    expect(result).toBeErr(Cl.uint(400));
  });
});
