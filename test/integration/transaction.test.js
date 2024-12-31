"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_1 = require("../../src/modules/wallet");
const walletSettings_1 = require("../../src/settings/walletSettings");
const fees_1 = require("../../src/modules/transactions/fees");
const send_1 = require("../../src/modules/transactions/send");
describe("Transactions (Send) - Real Tests", () => {
    const PW = "tx-pass";
    const FUNDED_MNEMONIC = process.env.FUNDED_MNEMONIC || "";
    beforeAll(async () => {
        await (0, walletSettings_1.setWalletSettings)({ network: "testnet", addressType: "p2wpkh" });
    });
    it("fails to send if no UTXOs on brand new wallet", async () => {
        const wId = await (0, wallet_1.createNewWallet)(PW);
        const fees = await (0, fees_1.getFeeEstimates)();
        // attempt to send 5000 sats
        await expect((0, send_1.sendBitcoin)(wId, PW, "2N3oefVeg6stiTb5Kh3ozCSkaqmx91FDbsm", 5000, fees.mediumFeeRate)).rejects.toThrow("Not enough funds");
    });
    it("sends real transaction if FUNDED_MNEMONIC is provided", async () => {
        if (!FUNDED_MNEMONIC) {
            console.warn("No FUNDED_MNEMONIC for real TX test. Skipping...");
            return;
        }
        // 1) recover funded wallet
        const { walletId } = await (0, wallet_1.recoverWalletFromMnemonic)(FUNDED_MNEMONIC, PW);
        // 2) get fee
        const fees = await (0, fees_1.getFeeEstimates)();
        // 3) choose a random testnet receiving address (or your other test wallet)
        const RECIPIENT_ADDR = "2N3oefVeg6stiTb5Kh3ozCSkaqmx91FDbsm.";
        // 4) attempt to send
        const txId = await (0, send_1.sendBitcoin)(walletId, PW, RECIPIENT_ADDR, 1000, fees.mediumFeeRate);
        console.log("Successfully broadcasted TX:", txId);
        // If broadcast is successful, we expect a 64-char hex string
        expect(txId).toMatch(/^[0-9a-f]{64}$/);
    });
});
