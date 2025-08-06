import * as bitcoin from 'bitcoinjs-lib';

/**
 * Convert bitcoin address to an Electrum script hash.
 */
export async function addressToScriptHash(address: string, network: bitcoin.Network): Promise<string> {
  // Convert the address to its corresponding output script.
  const outputScript = bitcoin.address.toOutputScript(address, network);
  // Compute SHA-256 hash of the output script.
  const hash = await sha256(outputScript);
  // Reverse the hash and return its hex string.
  const reversedHash = Buffer.from(hash).reverse();

  return reversedHash.toString('hex');
}

/**
 * Compute SHA-256 hash.
 */
export async function sha256(data: Buffer): Promise<Buffer> {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Buffer.from(new Uint8Array(hashBuffer));
}
