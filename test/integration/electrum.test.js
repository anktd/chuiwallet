"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electrumClient_1 = require("../../src/electrum/electrumClient");
const wallet_1 = require("../../src/modules/wallet");
const walletSettings_1 = require("../../src/settings/walletSettings");
describe("Electrum Client (Real Usage)", () => {
    const PW = "electrum-pass";
    // Option A) Put a known funded mnemonic in an env var, or directly in test for convenience
    const FUNDED_MNEMONIC = process.env.FUNDED_MNEMONIC || "";
    let fundedWalletId;
    beforeAll(async () => {
        // set to testnet
        await (0, walletSettings_1.setWalletSettings)({ network: "testnet", addressType: "p2wpkh" });
    });
    it("fails to broadcast invalid tx", async () => {
        await expect((0, electrumClient_1.broadcastTransaction)("00ABCDEF")).rejects.toThrow();
    });
    it("can get balance and history for a brand new wallet (0 balance)", async () => {
        const newWalletId = await (0, wallet_1.createNewWallet)(PW);
        const balance = await (0, electrumClient_1.getFullWalletBalance)(newWalletId, PW);
        expect(balance).toBe(0);
        const history = await (0, electrumClient_1.getFullWalletHistory)(newWalletId, PW);
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBe(0);
    });
    it("recovers a funded wallet if mnemonic is provided", async () => {
        if (!FUNDED_MNEMONIC) {
            console.warn("No FUNDED_MNEMONIC provided, skipping funded wallet test...");
            return;
        }
        // recover funded wallet
        const { walletId } = await (0, wallet_1.recoverWalletFromMnemonic)(FUNDED_MNEMONIC, PW);
        fundedWalletId = walletId;
        const balance = await (0, electrumClient_1.getFullWalletBalance)(walletId, PW);
        console.log(`Funded wallet balance: ${balance} satoshis`);
        expect(balance).toBeGreaterThan(0);
        const history = await (0, electrumClient_1.getFullWalletHistory)(walletId, PW);
        console.log("History:", history);
        expect(history.length).toBeGreaterThan(0);
    });
});
