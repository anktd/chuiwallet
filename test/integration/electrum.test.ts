import {
  getFullWalletBalance,
  getFullWalletHistory,
  broadcastTransaction,
} from "../../src/electrum/electrumClient";

describe("Electrum Client Tests", () => {
  it("fails to broadcast invalid tx", async () => {
    await expect(broadcastTransaction("00ABCD")).rejects.toThrow();
  });

  // For real usage, you need a funded test wallet.
  // If you have a known walletId with UTXOs, you can test getFullWalletBalance, getFullWalletHistory, etc.
});
