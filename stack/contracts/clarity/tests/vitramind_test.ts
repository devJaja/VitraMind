import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
const HASH_A    = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const HASH_B    = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

// ── profile-anchor ────────────────────────────────────────────────────────────

Clarinet.test({
  name: "profile-anchor: anchor and read back",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("profile-anchor", "anchor-profile", [types.buff(HASH_A)], wallet1.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const hash = chain.callReadOnlyFn("profile-anchor", "get-profile-hash", [types.principal(wallet1.address)], wallet1.address);
    hash.result.expectSome().expectBuff(HASH_A);

    const has = chain.callReadOnlyFn("profile-anchor", "has-profile", [types.principal(wallet1.address)], wallet1.address);
    has.result.expectBool(true);
  },
});

Clarinet.test({
  name: "profile-anchor: rejects zero hash",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("profile-anchor", "anchor-profile", [types.buff(ZERO_HASH)], wallet1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(1);
  },
});

// ── proof-registry ────────────────────────────────────────────────────────────

Clarinet.test({
  name: "proof-registry: submit and retrieve proof",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("proof-registry", "submit-proof", [types.buff(HASH_A), types.uint(0)], wallet1.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(0);

    const count = chain.callReadOnlyFn("proof-registry", "get-proof-count", [types.principal(wallet1.address)], wallet1.address);
    count.result.expectUint(1);

    const proof = chain.callReadOnlyFn("proof-registry", "get-proof", [types.principal(wallet1.address), types.uint(0)], wallet1.address);
    const p = proof.result.expectSome().expectTuple();
    assertEquals(p["proof-type"], types.uint(0));

    const verified = chain.callReadOnlyFn("proof-registry", "verify-proof", [types.principal(wallet1.address), types.buff(HASH_A)], wallet1.address);
    verified.result.expectBool(true);
  },
});

Clarinet.test({
  name: "proof-registry: rejects duplicate hash",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("proof-registry", "submit-proof", [types.buff(HASH_A), types.uint(0)], wallet1.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("proof-registry", "submit-proof", [types.buff(HASH_A), types.uint(0)], wallet1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(2); // ERR-DUPLICATE
  },
});

Clarinet.test({
  name: "proof-registry: rejects invalid proof type",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("proof-registry", "submit-proof", [types.buff(HASH_A), types.uint(4)], wallet1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(4); // ERR-INVALID-TYPE
  },
});

// ── streak-verifier ───────────────────────────────────────────────────────────

Clarinet.test({
  name: "streak-verifier: oracle anchors streak",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1  = accounts.get("wallet_1")!;

    const block = chain.mineBlock([
      Tx.contractCall("streak-verifier", "anchor-streak",
        [types.principal(wallet1.address), types.buff(HASH_A), types.uint(3)],
        deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(0);

    const count = chain.callReadOnlyFn("streak-verifier", "get-streak-count", [types.principal(wallet1.address)], wallet1.address);
    count.result.expectUint(1);

    const latest = chain.callReadOnlyFn("streak-verifier", "latest-streak", [types.principal(wallet1.address)], wallet1.address);
    const entry = latest.result.expectOk().expectSome().expectTuple();
    assertEquals(entry["current-streak"], types.uint(3));
  },
});

Clarinet.test({
  name: "streak-verifier: non-oracle is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("streak-verifier", "anchor-streak",
        [types.principal(wallet1.address), types.buff(HASH_A), types.uint(1)],
        wallet1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(1); // ERR-NOT-ORACLE
  },
});

Clarinet.test({
  name: "streak-verifier: cooldown enforced",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1  = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("streak-verifier", "anchor-streak",
        [types.principal(wallet1.address), types.buff(HASH_A), types.uint(1)],
        deployer.address),
    ]);
    // Second call in same block — cooldown not elapsed
    const block = chain.mineBlock([
      Tx.contractCall("streak-verifier", "anchor-streak",
        [types.principal(wallet1.address), types.buff(HASH_B), types.uint(2)],
        deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(5); // ERR-COOLDOWN
  },
});

// ── analytics-registry ────────────────────────────────────────────────────────

Clarinet.test({
  name: "analytics-registry: oracle anchors snapshot",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1  = accounts.get("wallet_1")!;

    const block = chain.mineBlock([
      Tx.contractCall("analytics-registry", "anchor-snapshot",
        [types.principal(wallet1.address), types.buff(HASH_A), types.uint(0)],
        deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(0);

    const latest = chain.callReadOnlyFn("analytics-registry", "latest-snapshot",
      [types.principal(wallet1.address), types.uint(0)], wallet1.address);
    const snap = latest.result.expectOk().expectSome().expectTuple();
    assertEquals(snap["period"], types.uint(0));
  },
});

Clarinet.test({
  name: "analytics-registry: rejects invalid period",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1  = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("analytics-registry", "anchor-snapshot",
        [types.principal(wallet1.address), types.buff(HASH_A), types.uint(2)],
        deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(3); // ERR-INVALID-PERIOD
  },
});

// ── ipfs-export-registry ──────────────────────────────────────────────────────

Clarinet.test({
  name: "ipfs-export-registry: anchor and retrieve export",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("ipfs-export-registry", "anchor-export",
        [types.ascii("QmTestCID123"), types.buff(HASH_A), types.uint(0)],
        wallet1.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(0);

    const latest = chain.callReadOnlyFn("ipfs-export-registry", "latest-export",
      [types.principal(wallet1.address)], wallet1.address);
    const exp = latest.result.expectOk().expectSome().expectTuple();
    assertEquals(exp["cid"], types.ascii("QmTestCID123"));

    const verified = chain.callReadOnlyFn("ipfs-export-registry", "verify-export",
      [types.principal(wallet1.address), types.buff(HASH_A)], wallet1.address);
    verified.result.expectBool(true);
  },
});

Clarinet.test({
  name: "ipfs-export-registry: rejects empty CID",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("ipfs-export-registry", "anchor-export",
        [types.ascii(""), types.buff(HASH_A), types.uint(0)],
        wallet1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(1); // ERR-EMPTY-CID
  },
});

// ── growth-identity ───────────────────────────────────────────────────────────

Clarinet.test({
  name: "growth-identity: publish and read identity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("growth-identity", "publish-identity",
        [types.buff(HASH_A), types.uint(42)],
        wallet1.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const id = chain.callReadOnlyFn("growth-identity", "get-identity",
      [types.principal(wallet1.address)], wallet1.address);
    const entry = id.result.expectSome().expectTuple();
    assertEquals(entry["growth-level"], types.uint(42));
    assertEquals(entry["active"], types.bool(true));

    const active = chain.callReadOnlyFn("growth-identity", "has-active-identity",
      [types.principal(wallet1.address)], wallet1.address);
    active.result.expectBool(true);
  },
});

Clarinet.test({
  name: "growth-identity: rejects level out of range",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const block = chain.mineBlock([
      Tx.contractCall("growth-identity", "publish-identity",
        [types.buff(HASH_A), types.uint(101)],
        wallet1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(3); // ERR-INVALID-LEVEL
  },
});

Clarinet.test({
  name: "growth-identity: deactivate identity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("growth-identity", "publish-identity",
        [types.buff(HASH_A), types.uint(10)],
        wallet1.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("growth-identity", "deactivate-identity", [], wallet1.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const active = chain.callReadOnlyFn("growth-identity", "has-active-identity",
      [types.principal(wallet1.address)], wallet1.address);
    active.result.expectBool(false);
  },
});

// ── wellness-protocol ─────────────────────────────────────────────────────────

Clarinet.test({
  name: "wellness-protocol: register, opt-in, commit progress",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    // Register protocol
    let block = chain.mineBlock([
      Tx.contractCall("wellness-protocol", "register-protocol",
        [types.ascii("Daily Meditation"), types.ascii("QmSchemaCID")],
        wallet1.address),
    ]);
    block.receipts[0].result.expectOk().expectUint(0);

    // Opt in
    block = chain.mineBlock([
      Tx.contractCall("wellness-protocol", "opt-in", [types.uint(0)], wallet2.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const optedIn = chain.callReadOnlyFn("wellness-protocol", "is-opted-in",
      [types.uint(0), types.principal(wallet2.address)], wallet2.address);
    optedIn.result.expectBool(true);

    // Commit progress
    block = chain.mineBlock([
      Tx.contractCall("wellness-protocol", "commit-progress",
        [types.uint(0), types.buff(HASH_A)],
        wallet2.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const progress = chain.callReadOnlyFn("wellness-protocol", "get-progress",
      [types.uint(0), types.principal(wallet2.address)], wallet2.address);
    progress.result.expectSome().expectTuple();
  },
});

Clarinet.test({
  name: "wellness-protocol: cannot opt-in twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("wellness-protocol", "register-protocol",
        [types.ascii("Yoga"), types.ascii("QmCID")],
        wallet1.address),
      Tx.contractCall("wellness-protocol", "opt-in", [types.uint(0)], wallet1.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("wellness-protocol", "opt-in", [types.uint(0)], wallet1.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(8); // ERR-ALREADY-OPTED-IN
  },
});

Clarinet.test({
  name: "wellness-protocol: deactivate protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("wellness-protocol", "register-protocol",
        [types.ascii("Running"), types.ascii("QmCID")],
        wallet1.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("wellness-protocol", "deactivate-protocol", [types.uint(0)], wallet1.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const p = chain.callReadOnlyFn("wellness-protocol", "get-protocol", [types.uint(0)], wallet1.address);
    const proto = p.result.expectSome().expectTuple();
    assertEquals(proto["active"], types.bool(false));
  },
});
