import * as bip39 from 'bip39';

export const generateMnemonic = (): string => bip39.generateMnemonic();
export const validateMnemonic = (mnemonic: string): boolean => bip39.validateMnemonic(mnemonic);
