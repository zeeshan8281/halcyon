#!/usr/bin/env node
// Generate a fresh agent keypair for use as HL_AGENT_PRIVATE_KEY.
// The address it prints is what you pass to approveAgent() from your master.
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const pk = generatePrivateKey();
const acc = privateKeyToAccount(pk);

console.log("");
console.log("AGENT KEYPAIR (store the private key in HL_AGENT_PRIVATE_KEY):");
console.log("");
console.log("  HL_AGENT_PRIVATE_KEY=" + pk);
console.log("  agent address       =" + acc.address);
console.log("");
console.log("Next: from your master wallet, call approveAgent on Hyperliquid");
console.log("authorizing", acc.address, "to trade on your behalf.");
console.log("");
