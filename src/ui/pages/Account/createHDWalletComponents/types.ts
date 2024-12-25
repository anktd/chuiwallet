import { AddressType, RestoreWalletType } from '@/shared/types';


export enum TabType {
  // eslint-disable-next-line no-unused-vars
  STEP1 = 'STEP1',
  // eslint-disable-next-line no-unused-vars
  STEP2 = 'STEP2',
  // eslint-disable-next-line no-unused-vars
  STEP3 = 'STEP3'
}

export enum WordsType {
  // eslint-disable-next-line no-unused-vars
  WORDS_12,
  // eslint-disable-next-line no-unused-vars
  WORDS_24
}

export interface ContextData {
  mnemonics: string;
  hdPath: string;
  passphrase: string;
  addressType: AddressType;
  step1Completed: boolean;
  tabType: TabType;
  restoreWalletType: RestoreWalletType;
  isRestore: boolean;
  isCustom: boolean;
  customHdPath: string;
  addressTypeIndex: number;
  wordsType: WordsType;
}

export interface UpdateContextDataParams {
  mnemonics?: string;
  hdPath?: string;
  passphrase?: string;
  addressType?: AddressType;
  step1Completed?: boolean;
  tabType?: TabType;
  restoreWalletType?: RestoreWalletType;
  isCustom?: boolean;
  customHdPath?: string;
  addressTypeIndex?: number;
  wordsType?: WordsType;
}
