import { bech32, bech32m } from 'bech32';
import { crypto, networks, opcodes, address as btcAddress } from 'bitcoinjs-lib';

/**
 * Converts a Bitcoin address into the scripthash required by Electrum.
 *
 * Supports:
 * - Taproot (P2TR) addresses (starting with bc1p/tb1p) using bech32m.
 * - Native Segwit (P2WPKH) addresses (starting with bc1q/tb1q) using bech32.
 * - Legacy (P2PKH) addresses (starting with 1 on mainnet, or m/n on testnet) using bitcoinjs-lib's toOutputScript.
 *
 * @param address - The Bitcoin address.
 * @param network - The bitcoinjs-lib network (default: bitcoin mainnet).
 * @returns The reversed SHA256 hash (scripthash) of the output script.
 * @throws If the address type is unsupported or invalid.
 */
export function addressToScripthash(address: string, network = networks.bitcoin): string {
  address = address.trim();
  let outputScript: Buffer;
  // Auto-detect HRP from address: "bc" if starts with bc1, "tb" if starts with tb1.
  const hrp = address.startsWith('tb1') ? 'tb' : address.startsWith('bc1') ? 'bc' : network.bech32;
  console.log('Converting address:', address, 'with hrp:', hrp);

  if (address.startsWith(`${hrp}1p`)) {
    // Taproot address (P2TR)
    const decoded = bech32m.decode(address, 90);
    // Remove the witness version (first word)
    const witnessWords = decoded.words.slice(1);
    let witnessProgram = Buffer.from(bech32m.fromWords(witnessWords));
    // If witness program length is 33 and first byte is zero, trim it.
    if (witnessProgram.length === 33 && witnessProgram[0] === 0) {
      witnessProgram = witnessProgram.slice(1);
    }
    if (witnessProgram.length !== 32) {
      throw new Error('Invalid taproot witness program length');
    }
    // P2TR output script: OP_1 (0x51) + push 32 (0x20) + witness program.
    outputScript = Buffer.concat([Buffer.from([opcodes.OP_1, 0x20]), witnessProgram]);
  } else if (address.startsWith(`${hrp}1q`)) {
    // Native Segwit (P2WPKH) address
    const decoded = bech32.decode(address, 90);
    const witnessWords = decoded.words.slice(1);
    const witnessProgram = Buffer.from(bech32.fromWords(witnessWords));
    if (witnessProgram.length !== 20) {
      throw new Error('Invalid p2wpkh witness program length');
    }
    // P2WPKH output script: OP_0 (0x00) + push 20 (0x14) + witness program.
    outputScript = Buffer.concat([Buffer.from([0x00, 0x14]), witnessProgram]);
  } else if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
    // Legacy P2PKH address
    try {
      outputScript = btcAddress.toOutputScript(address, network);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new Error('Invalid legacy address');
    }
  } else {
    throw new Error('Unsupported address type for scripthash conversion');
  }

  const hash = crypto.sha256(outputScript);
  return Buffer.from(hash).reverse().toString('hex');
}
