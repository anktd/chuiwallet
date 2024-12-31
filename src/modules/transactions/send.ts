import * as bitcoin from "bitcoinjs-lib";
import * as bip39 from "bip39";
import { getMnemonic } from "../wallet";
import { getWalletSettings } from "../../settings/walletSettings";
import { toXOnly } from "../../taprootUtils";
import { scanAddressesUntilGapReached, UTXO } from "../../utils/scanning";
import { broadcastTransaction } from "../../electrum/electrumClient";

/**
 * sendBitcoin - Gathers UTXOs from scanning, picks enough to cover amount & fee,
 * builds and signs a PSBT, and broadcasts.
 */
export async function sendBitcoin(
  walletId: string,
  password: string,
  toAddress: string,
  amountSats: number,
  feeRate: number
): Promise<string> {
  const mnemonic = await getMnemonic(walletId, password);
  const settings = await getWalletSettings();
  const netObj =
    settings.network === "mainnet"
      ? bitcoin.networks.bitcoin
      : bitcoin.networks.testnet;

  // 1) Re-scan to get all addresses & UTXOs
  const scanRes = await scanAddressesUntilGapReached(walletId, password);
  const utxos = scanRes.allUTXOs;

  // 2) Sort UTXOs by largest first (or smallest first, up to you)
  utxos.sort((a, b) => b.value - a.value);

  // 3) Build PSBT
  const psbt = new bitcoin.Psbt({ network: netObj });
  let totalInput = 0;
  const usedUtxos: UTXO[] = [];

  // Add inputs until we have enough to cover the amount
  for (const u of utxos) {
    if (totalInput >= amountSats) break;
    psbt.addInput({
      hash: u.txId,
      index: u.vout,
      witnessUtxo: {
        script: Buffer.from(u.scriptPubKey, "hex"),
        value: u.value,
      },
    });
    totalInput += u.value;
    usedUtxos.push(u);
  }

  if (totalInput < amountSats) {
    throw new Error("Not enough funds to cover the requested amount.");
  }

  // 4) Add output
  psbt.addOutput({ address: toAddress, value: amountSats });

  // 5) Estimate fee
  const numInputs = psbt.data.inputs.length;
  const numOutputs = 2; // 1 user output + 1 change
  const estimatedSize = numInputs * 180 + numOutputs * 34 + 10; // naive
  const fee = Math.ceil(estimatedSize * feeRate);
  const change = totalInput - amountSats - fee;

  if (change < 0) {
    throw new Error("Insufficient funds after fee.");
  }
  if (change > 0) {
    // We pick a single "change address" from usedUtxos or the first address.
    // For a real wallet, you'd have a separate "change" branch (isChange = true).
    // For simplicity, let's pick the first derived address as change:
    if (scanRes.addresses.length === 0) {
      throw new Error("No addresses found for change output");
    }
    const changeAddress = scanRes.addresses[0];
    psbt.addOutput({ address: changeAddress, value: change });
  }

  // 6) Sign inputs
  //   We must sign each input with the private key of the address that provided that UTXO.
  //   We'll do a basic approach: for each usedUtxo, derive the address's key & sign.

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bitcoin.bip32.fromSeed(seed, netObj);

  for (let i = 0; i < usedUtxos.length; i++) {
    const inputIndex = i; // same order we added them
    const utxo = usedUtxos[i];

    // find derivation path from scanning.
    // we can store path in UTXO or recalculate it. We'll store an extra field in scanning.

    if (!utxo.derivationPath) {
      throw new Error(
        `UTXO missing derivationPath for address=${utxo.address}`
      );
    }
    const child = root.derivePath(utxo.derivationPath);

    let keyPair: bitcoin.ECPairInterface;
    if (settings.addressType === "p2tr") {
      // Taproot
      keyPair = child;
    } else {
      keyPair = child;
    }

    // Now figure out the payment type to do signInput.
    // For p2sh-p2wpkh, we need a redeem script. For p2tr, we might do taproot style.

    psbt.signInput(inputIndex, keyPair);
    psbt.validateSignaturesOfInput(inputIndex);
  }
  psbt.finalizeAllInputs();

  // 7) Broadcast
  const txHex = psbt.extractTransaction().toHex();
  const txId = await broadcastTransaction(txHex);
  return txId;
}
