import { CacheType, ChangeType } from '../types/cache';
import { accountManager } from '../accountManager';

export function getCacheKey(type: string = CacheType.Address, chain: string = ChangeType.External): string {
  const activeAccount = accountManager.getActiveAccount();
  return `${type}_${activeAccount.network}_${chain}_${activeAccount.index}`;
}

export function selectByChain<T>(external: T, internal: T, changeType: ChangeType): T {
  return changeType === ChangeType.External ? external : internal;
}
