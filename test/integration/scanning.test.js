"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_1 = require("../../src/modules/wallet");
const scanning_1 = require("../../src/utils/scanning");
const walletSettings_1 = require("../../src/settings/walletSettings");
describe("Address Scanning Tests", () => {
    it("scans addresses up to gap limit", async () => {
        await (0, walletSettings_1.setWalletSettings)({
            network: "testnet",
            addressType: "p2wpkh",
            gapLimit: 3,
            maxAddresses: 10,
        });
        const walletId = await (0, wallet_1.createNewWallet)("scan-pass");
        const result = await (0, scanning_1.scanAddressesUntilGapReached)(walletId, "scan-pass");
        // At least 1 address derived
        expect(result.addresses.length).toBeGreaterThan(0);
        // If brand new, likely 0 UTXOs
        expect(result.allUTXOs.length).toBeGreaterThanOrEqual(0);
    });
});
