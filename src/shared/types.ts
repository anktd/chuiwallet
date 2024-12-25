/* eslint-disable no-unused-vars */
import { CHAINS_ENUM } from './constant';

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH
}

export enum NetworkType {
  MAINNET,
  TESTNET
}

export enum RestoreWalletType {
  CHUI,
  OTHERS
}

export interface Chain {
  name: string;
  logo: string;
  enum: CHAINS_ENUM;
  network: string;
}

export interface BitcoinBalance {
  confirm_amount: string;
  pending_amount: string;
  amount: string;
  confirm_btc_amount: string;
  pending_btc_amount: string;
  btc_amount: string;
  usd_value: string;
}

export interface AddressAssets {
  total_btc: string;
  satoshis?: number;
}

export interface TxHistoryInOutItem {
  address: string;
  value: number;
}

export interface TxHistoryItem {
  txid: string;
  confirmations: number;
  height: number;
  timestamp: number;
  size: number;
  feeRate: number;
  fee: number;
  outputValue: number;
  vin: TxHistoryInOutItem[];
  vout: TxHistoryInOutItem[];
  types: string[];
  methods: string[];
}

export interface AppInfo {
  logo: string;
  title: string;
  desc: string;
  url: string;
  time: number;
  id: number;
  tag?: string;
  readtime?: number;
  new?: boolean;
  tagColor?: string;
}

export interface AppSummary {
  apps: AppInfo[];
  readTabTime?: number;
}

export interface FeeSummary {
  list: {
    title: string;
    desc: string;
    feeRate: number;
  }[];
}

export interface CoinPrice {
  btc: number;
  fb: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  satoshis: number;
  scriptPk: string;
  addressType: AddressType;
}

export interface UTXO_Detail {
  txId: string;
  outputIndex: number;
  satoshis: number;
  scriptPk: string;
  addressType: AddressType;
}

export enum TxType {
  SIGN_TX,
  SEND_BITCOIN
}

interface BaseUserToSignInput {
  index: number;
  sighashTypes: number[] | undefined;
  useTweakedSigner?: boolean;
  disableTweakSigner?: boolean;
  tapLeafHashToSign?: string;
}

export interface AddressUserToSignInput extends BaseUserToSignInput {
  address: string;
}

export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  publicKey: string;
}

export type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput;

export interface SignPsbtOptions {
  autoFinalized: boolean;
  toSignInputs?: UserToSignInput[];
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
  tapLeafHashToSign?: Buffer;
}

export type WalletKeyring = {
  key: string;
  index: number;
  type: string;
  addressType: AddressType;
  accounts: Account[];
  alianName: string;
  hdPath: string;
};

export interface Account {
  type: string;
  pubkey: string;
  address: string;
  brandName?: string;
  alianName?: string;
  displayBrandName?: string;
  index?: number;
  balance?: number;
  key: string;
  flag: number;
}

export interface TokenBalance {
  availableBalance: string;
  overallBalance: string;
  ticker: string;
  transferableBalance: string;
  availableBalanceSafe: string;
  availableBalanceUnSafe: string;
  selfMint: boolean;
  displayName?: string;
  tag?: string;
}

export interface TokenInfo {
  totalSupply: string;
  totalMinted: string;
  decimal: number;
  holder: string;
  selfMint?: boolean;
}

export interface TokenTransfer {
  ticker: string;
  amount: string;
  timestamp: number;
  confirmations: number;
  satoshi: number;
}

export interface AddressTokenSummary {
  tokenInfo: TokenInfo;
  tokenBalance: TokenBalance;
  historyList: TokenTransfer[];
  transferableList: TokenTransfer[];
}

export enum RiskType {
  SIGHASH_NONE,
  SCAMMER_ADDRESS,
  UNCONFIRMED_UTXO,
  MULTIPLE_ASSETS,
  LOW_FEE_RATE,
  HIGH_FEE_RATE
}

export interface Risk {
  type: RiskType;
  level: 'danger' | 'warning' | 'critical';
  title: string;
  desc: string;
}

export interface DecodedPsbt {
  inputInfos: {
    txid: string;
    vout: number;
    address: string;
    value: number;
    sighashType: number;
  }[];
  outputInfos: {
    address: string;
    value: number;
  }[];
  feeRate: number;
  fee: number;
  features: {
    rbf: boolean;
  };
  risks: Risk[];
  isScammer: boolean;
  recommendedFeeRate: number;
  shouldWarnFeeRate: boolean;
}

export interface ToAddressInfo {
  address: string;
  domain?: string;
}

export interface RawTxInfo {
  psbtHex: string;
  rawtx: string;
  toAddressInfo?: ToAddressInfo;
  fee?: number;
}

export interface WalletConfig {
  version: string;
  moonPayEnabled: boolean;
  statusMessage: string;
  endpoint: string;
  chainTip: string;
}

export enum WebsiteState {
  CHECKING,
  SCAMMER,
  SAFE
}

export interface AddressSummary {
  address: string;
  totalSatoshis: number;
  btcSatoshis: number;
  assetSatoshis: number;
  loading?: boolean;
}

export interface VersionDetail {
  version: string;
  title: string;
  changelogs: string[];
}

export interface BtcChannelItem {
  quote: number;
  payType: string[];
}

export type TickPriceItem = {
  curPrice: number;
  changePercent: number;
};

export interface WebsiteResult {
  isScammer: boolean;
  warning: string;
  allowQuickMultiSign: boolean;
}
