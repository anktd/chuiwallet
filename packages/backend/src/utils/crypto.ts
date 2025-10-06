import type { BIP32Interface } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import { Network } from '../types/electrum';
import { Buffer } from 'buffer';
import { ScriptType } from '../types/wallet';
import type { HDSigner } from 'bitcoinjs-lib';

/**
 * Convert bitcoin address to an Electrum script hash.
 */
export function addressToScriptHash(address: string, network: bitcoin.Network): string {
  // Convert the address to its corresponding output script.
  const outputScript = bitcoin.address.toOutputScript(address, network);
  // Compute SHA-256 hash of the output script.
  const hash = bitcoin.crypto.sha256(outputScript);
  // Reverse the hash and return its hex string.
  const reversedHash = Buffer.from(hash).reverse();

  return reversedHash.toString('hex');
}

export function addressToScriptPubKey(address: string, network: bitcoin.Network) {
  return bitcoin.address.toOutputScript(address, network).toString('hex');
}

/**
 * Convert Network type to Bitcoin networks
 * @param network
 */
export function toBitcoinNetwork(network: Network) {
  return network == Network.Mainnet ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
}

/**
 * Determine script type from address.
 * @param addr
 */
export function scriptTypeFromAddress(addr: string): ScriptType {
  const a = addr.toLowerCase();
  if (hasPrefix(a, 'bc1p', 'tb1p', 'bcrt1p')) return ScriptType.P2TR; // Taproot
  if (hasPrefix(a, 'bc1q', 'tb1q', 'bcrt1q')) return ScriptType.P2WPKH; // Bech32 v0
  if (hasPrefix(a, '3', '2')) return ScriptType.P2SH_P2WPKH; // generic P2SH
  if (hasPrefix(a, '1', 'm', 'n')) return ScriptType.P2PKH; // legacy
  return ScriptType.P2PKH; // sensible fallback
}

const hasPrefix = (s: string, ...prefixes: string[]) => prefixes.some(p => s.startsWith(p));

export function purposeFromScriptType(scriptType: ScriptType) {
  let purpose: number;
  switch (scriptType) {
    case ScriptType.P2PKH:
      purpose = 44;
      break;
    case ScriptType.P2SH_P2WPKH:
      purpose = 49;
      break;
    case ScriptType.P2TR:
      purpose = 86;
      break;
    case ScriptType.P2WPKH:
      purpose = 84;
      break;
    default:
      throw new Error('Unknown script type');
  }

  return purpose;
}

/**
 * Computes the 32-bit BIP32 fingerprint for a given node as a **number**.
 *
 * Per BIP32, a node’s fingerprint is the first 4 bytes of
 * `HASH160(compressed public key)` interpreted as an unsigned big-endian integer.
 *
 * This helper first tries to use `node.fingerprint` if the implementation already
 * provides it (as a number or Buffer). Otherwise, it computes the value from the
 * node’s public key.
 **/
export function fingerprintNumber(node: BIP32Interface): number {
  const fpUnknown = (node as { fingerprint: unknown }).fingerprint;

  if (typeof fpUnknown === 'number') return fpUnknown >>> 0;
  if (Buffer.isBuffer(fpUnknown) && fpUnknown.length >= 4) return fpUnknown.readUInt32BE(0);

  const pubkeyBuf = Buffer.isBuffer(node.publicKey) ? node.publicKey : Buffer.from(node.publicKey);
  const h160 = bitcoin.crypto.hash160(pubkeyBuf);
  return h160.readUInt32BE(0) >>> 0;
}

/**
 * Computes the 32-bit BIP32 fingerprint for a given node as a **4-byte Buffer**.
 *
 * This is the same value as {@link fingerprintNumber}, but returned in the form
 * expected by PSBT (BIP174) for `bip32Derivation.masterFingerprint`.
 **/
export function fingerprintBuffer(node: BIP32Interface): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(fingerprintNumber(node), 0);
  return buf;
}

/**
 * Convert a BIP32 node to an HDSigner acceptable by bitcoinjs-lib PSBT.
 * This fixes TypeScript’s type mismatch while keeping runtime behavior correct.
 */
export function toHdSigner(node: BIP32Interface): bitcoin.Signer & HDSigner {
  const pubkey = asBuffer(node.publicKey);
  return {
    publicKey: pubkey,
    sign: (hash: Buffer): Buffer => {
      if (!node.sign) throw new Error('Node cannot sign');
      const sig = node.sign(hash); // may return Uint8Array
      return asBuffer(sig); // ensure Buffer
    },
    // (Add signSchnorr for Taproot if needed)
  } as unknown as bitcoin.Signer & { publicKey: Buffer } as HDSigner;
}

export function asBuffer(x: Buffer | Uint8Array) {
  return Buffer.isBuffer(x) ? x : Buffer.from(x);
}
