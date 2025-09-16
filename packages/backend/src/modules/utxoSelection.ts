import type { ScriptType } from '../types/wallet';
import type { ChangeType } from '../types/cache';
import type { FeeSizer } from './feeService';

export type SpendableUtxo = {
  txid: string;
  vout: number;
  value: number; // sats
  height: number; // 0 if unconfirmed
  confirmations: number; // derive when reading cache
  address: string; // derived address
  index: number; // HD index
  chain: ChangeType; // receive/change
  scriptType: ScriptType; // account’s script type
};

export type utxoSelectionResult = {
  inputs: SpendableUtxo[];
  change: number;
  fee: number;
};

/**
 * Fee-aware greedy selector.
 * Todo: Optimise coin selection
 */
export function selectUtxo(
  utxos: SpendableUtxo[],
  targetSats: number,
  feeSizer: FeeSizer,
  changeDustThreshold: number,
): utxoSelectionResult {
  const sorted = [...utxos].sort((a, b) => b.value - a.value);
  const selected: SpendableUtxo[] = [];
  let total = 0;
  for (const u of sorted) {
    selected.push(u);
    total += u.value;
    const fee = feeSizer(selected.length, true);
    if (total >= targetSats + fee) break;
  }
  if (selected.length === 0) throw new Error('Insufficient funds');

  let fee = feeSizer(selected.length, true);
  while (total < targetSats + fee) {
    const next = sorted[selected.length];
    if (!next) throw new Error('Insufficient funds');
    selected.push(next);
    total += next.value;
    fee = feeSizer(selected.length, true);
  }

  let change = total - targetSats - fee;

  // try no-change if change would be dust
  if (change > 0 && change < changeDustThreshold) {
    const feeNoChange = feeSizer(selected.length, false);
    if (total >= targetSats + feeNoChange) {
      fee = feeNoChange;
      change = 0;
    }
  }

  return { inputs: selected, change, fee };
}
