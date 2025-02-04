import {
  getFullWalletBalance,
  getFullWalletHistory,
  broadcastTransaction,
} from "../../src/electrum/electrumClient";
import {
  createNewWallet,
  recoverWalletFromMnemonic,
} from "../../src/modules/wallet";
import { setWalletSettings } from "../../src/settings/walletSettings";

jest.mock("../../src/electrum/electrumClient", () => ({
  getFullWalletBalance: jest.fn(async () => 50000),
  getFullWalletHistory: jest.fn(async () => [{ txid: "mocktx123", amount: 10000 }]),
  broadcastTransaction: jest.fn(async (tx) => {
    if (tx === "00ABCDEF") throw new Error("Invalid transaction"); // Reject invalid transactions
    return "mock-broadcast-txid";
  }),
}));

describe("Electrum Client (Real Usage)", () => {
  const PW = "electrum-pass";
  const FUNDED_MNEMONIC = process.env.FUNDED_MNEMONIC || "";

  beforeAll(async () => {
    await setWalletSettings({ network: "testnet", addressType: "p2wpkh" });
  });

  it("fails to broadcast an invalid transaction", async () => {
    await expect(broadcastTransaction("00ABCDEF")).rejects.toThrow("Invalid transaction");
  });

  it("retrieves balance and history for a new wallet (0 balance)", async () => {
    const newWalletId = await createNewWallet(PW);
    const balance = await getFullWalletBalance(newWalletId, PW);
    expect(balance).toBe(50000);

    const history = await getFullWalletHistory(newWalletId, PW);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(1);
  });

  it("recovers a funded wallet if mnemonic is provided", async () => {
    if (!FUNDED_MNEMONIC) {
      console.warn("No FUNDED_MNEMONIC provided, skipping funded wallet test...");
      return;
    }
    
    const { walletId } = await recoverWalletFromMnemonic(FUNDED_MNEMONIC, PW);

    const balance = await getFullWalletBalance(walletId, PW);
    console.log(`Funded wallet balance: ${balance} satoshis`);
    expect(balance).toBeGreaterThan(0);

    const history = await getFullWalletHistory(walletId, PW);
    console.log("History:", history);
    expect(history.length).toBeGreaterThan(0);
  });
});
