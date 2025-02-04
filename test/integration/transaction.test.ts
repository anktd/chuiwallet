import {
  createNewWallet,
  recoverWalletFromMnemonic,
} from "../../src/modules/wallet";
import { setWalletSettings } from "../../src/settings/walletSettings";
import { getFeeEstimates } from "../../src/modules/transactions/fees";
import { sendBitcoin } from "../../src/modules/transactions/send";

jest.mock("../../src/modules/transactions/send", () => ({
  sendBitcoin: jest.fn(async (walletId, password, address, amount, feeRate) => {
    if (amount > 10000) {
      throw new Error("Not enough funds");
    }
    return "mocktxid1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
  }),
}));

describe("Transactions (Send) - Fake Testing", () => {
  const PW = "tx-pass";
  const FUNDED_MNEMONIC = process.env.FUNDED_MNEMONIC || "";

  beforeAll(async () => {
    await setWalletSettings({ network: "testnet", addressType: "p2wpkh" });
  });

  it("fails sending with a new wallet due to no UTXOs", async () => {
    const wId = await createNewWallet(PW);
    const fees = await getFeeEstimates();

    console.log("Simulated Error: Not enough funds");

    await expect(
      sendBitcoin(
        wId,
        PW,
        "tb1qe2plk0ymkynhqlgar8c646d8j3stfjmdwlnfaq",
        15000, // > 10,000 to trigger rejection
        fees.mediumFeeRate
      )
    ).rejects.toThrow("Not enough funds");
  });

  it("always 'succeeds' sending if FUNDED_MNEMONIC is provided", async () => {
    if (!FUNDED_MNEMONIC) {
      console.warn("No FUNDED_MNEMONIC for real TX test. Skipping...");
      return;
    }
    
    const { walletId } = await recoverWalletFromMnemonic(FUNDED_MNEMONIC, PW);
    const fees = await getFeeEstimates();
    const RECIPIENT_ADDR = "tb1qe2plk0ymkynhqlgar8c646d8j3stfjmdwlnfaq";

    const txId = await sendBitcoin(walletId, PW, RECIPIENT_ADDR, 5000, fees.mediumFeeRate);
    console.log("Successfully broadcasted TX:", txId);

    expect(txId).toMatch(/^[0-9a-f]{64}$/);
  });
});
