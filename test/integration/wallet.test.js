"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_1 = require("../../src/modules/wallet");
const bip39 = __importStar(require("bip39"));
describe("Wallet Module Tests", () => {
    const PW = "test";
    it("creates a new wallet", async () => {
        const walletId = await (0, wallet_1.createNewWallet)(PW);
        expect(typeof walletId).toBe("string");
        const wallets = await (0, wallet_1.listWallets)();
        const found = wallets.find((w) => w.walletId === walletId);
        expect(found).toBeDefined();
    });
    it("recovers from valid mnemonic", async () => {
        const mnemonic = bip39.generateMnemonic(256);
        const { walletId } = await (0, wallet_1.recoverWalletFromMnemonic)(mnemonic, PW);
        const saved = await (0, wallet_1.getMnemonic)(walletId, PW);
        expect(saved).toBe(mnemonic);
    });
    it("throws error on invalid mnemonic", async () => {
        await expect((0, wallet_1.recoverWalletFromMnemonic)("not valid words", PW)).rejects.toThrow("Invalid mnemonic");
    });
});
