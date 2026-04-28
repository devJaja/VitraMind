/**
 * Client-side cryptographic utilities.
 * All hashing happens locally — nothing sensitive leaves the device.
 */

import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

/** SHA-256 hash a string, returns hex */
export function hashString(input: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(input)));
}

/** SHA-256 hash a string, returns Uint8Array */
export function hashBytes(input: string): Uint8Array {
  return sha256(new TextEncoder().encode(input));
}

/** Build a deterministic log commitment from user address + log fields */
export function buildLogCommitment(
  address: string,
  mood: number,
  habits: string,
  reflection: string,
  timestamp: number
): string {
  return hashString(`${address}:${mood}:${habits}:${reflection}:${timestamp}`);
}

/** Build a deterministic insight commitment */
export function buildInsightCommitment(address: string, insight: string): string {
  return hashString(`${address}:${insight}`);
}

/** Build a deterministic profile commitment */
export function buildProfileCommitment(address: string, bio: string): string {
  return hashString(`${address}:${bio}:${Date.now()}`);
}

/** Build a deterministic goal commitment */
export function buildGoalCommitment(address: string, goalText: string): string {
  return hashString(`${address}:${goalText}:${Date.now()}`);
}

/** Build a deterministic streak proof hash */
export function buildStreakProof(address: string, streak: number): string {
  return hashString(`${address}:streak:${streak}:${Date.now()}`);
}

/** Build a deterministic analytics digest from an array of mood values */
export function buildAnalyticsDigest(address: string, moods: number[], period: "weekly" | "monthly"): string {
  return hashString(`${address}:${period}:${moods.join(",")}`);
}
