/**
 * Stacks Connect configuration.
 * Replaces wagmi — Stacks uses @stacks/connect for wallet interactions.
 */

export const APP_DETAILS = {
  name: "VitraMind",
  icon: typeof window !== "undefined" ? `${window.location.origin}/icon-192.png` : "/icon-192.png",
};

export const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet";
