import { createNewWallet } from "../../src/modules/wallet";
import { setWalletSettings } from "../../src/settings/walletSettings";
import { sendBitcoin } from "../../src/modules/transactions/send";
import { getFeeEstimates } from "../../src/modules/transactions/fees";

describe("Transactions (Send) Tests", () => {
  it("fails to send if no UTXOs", async () => {
    await setWalletSettings({ network: "testnet", addressType: "p2wpkh" });
    const wId = await createNewWallet("txpass");
    const fees = await getFeeEstimates();

    // Attempt to send 5000 sats
    await expect(
      sendBitcoin(wId, "txpass", "tb1qSomeRecipient", 5000, fees.mediumFeeRate)
    ).rejects.toThrow("Not enough funds");
  });

  // If you have a known funded wallet, you can do a real send test.
});
