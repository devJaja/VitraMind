import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { initSimnet } from "@hirosystems/clarinet-sdk";

const simnet = await initSimnet();
const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;

describe("habit-commitment", () => {
  it("commits a habit and returns id 0", () => {
    const commitment = new Uint8Array(32).fill(5);
    const { result } = simnet.callPublicFn(
      "habit-commitment", "commit-habit",
      [Cl.buffer(commitment), Cl.uint(3), Cl.uint(1008)], wallet1
    );
    expect(result).toBeOk(Cl.uint(0));
  });

  it("increments habit count", () => {
    const { result } = simnet.callReadOnlyFn(
      "habit-commitment", "get-habit-count",
      [Cl.principal(wallet1)], wallet1
    );
    expect(result).toBeUint(1);
  });

  it("check-in increments counter", () => {
    const { result } = simnet.callPublicFn(
      "habit-commitment", "check-in",
      [Cl.uint(0)], wallet1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("rejects invalid frequency 0", () => {
    const commitment = new Uint8Array(32).fill(6);
    const { result } = simnet.callPublicFn(
      "habit-commitment", "commit-habit",
      [Cl.buffer(commitment), Cl.uint(0), Cl.uint(1008)], wallet1
    );
    expect(result).toBeErr(Cl.uint(400));
  });

  it("rejects invalid frequency > 7", () => {
    const commitment = new Uint8Array(32).fill(7);
    const { result } = simnet.callPublicFn(
      "habit-commitment", "commit-habit",
      [Cl.buffer(commitment), Cl.uint(8), Cl.uint(1008)], wallet1
    );
    expect(result).toBeErr(Cl.uint(400));
  });

  it("returns completion-rate", () => {
    const { result } = simnet.callReadOnlyFn(
      "habit-commitment", "completion-rate",
      [Cl.principal(wallet1), Cl.uint(0)], wallet1
    );
    expect(result).toBeSome();
  });
});

describe("notification-registry", () => {
  it("returns default preferences", () => {
    const { result } = simnet.callReadOnlyFn(
      "notification-registry", "get-preferences",
      [Cl.principal(wallet1)], wallet1
    );
    expect(result).toBeTuple();
  });

  it("sets custom preferences", () => {
    const { result } = simnet.callPublicFn(
      "notification-registry", "set-preferences",
      [Cl.bool(true), Cl.bool(false), Cl.bool(true), Cl.bool(false)], wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("rejects record-milestone from non-oracle", () => {
    const { result } = simnet.callPublicFn(
      "notification-registry", "record-milestone",
      [Cl.principal(wallet1), Cl.uint(0)], wallet1
    );
    expect(result).toBeErr(Cl.uint(401));
  });
});
