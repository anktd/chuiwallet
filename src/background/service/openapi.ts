import randomstring from 'randomstring';

import { createPersistStore } from '@/background/utils';
import { CHAINS_MAP, CHANNEL, VERSION } from '@/shared/constant';
import {
  AddressSummary,
  AppInfo,
  AppSummary,
  BitcoinBalance,
  CoinPrice,
  DecodedPsbt,
  FeeSummary,
  UTXO,
  VersionDetail,
  WalletConfig
} from '@/shared/types';

import { preferenceService } from '.';

interface OpenApiStore {
  deviceId: string;
  config?: WalletConfig;
}

const maxRPS = 100;

enum API_STATUS {
  FAILED = -1,
  SUCCESS = 0
}

export class OpenApiService {
  store!: OpenApiStore;
  clientAddress = '';
  addressFlag = 0;
  endpoints: string[] = [];
  endpoint = '';
  config: WalletConfig | null = null;

  setEndpoints = async (endpoints: string[]) => {
    this.endpoints = endpoints;
    await this.init();
  };

  init = async () => {
    this.store = await createPersistStore({
      name: 'openapi',
      template: {
        deviceId: randomstring.generate(12)
      }
    });

    const chainType = preferenceService.getChainType();
    const chain = CHAINS_MAP[chainType];
    this.endpoint = chain.endpoints[0];

    if (!this.store.deviceId) {
      this.store.deviceId = randomstring.generate(12);
    }

    try {
      const config = await this.getWalletConfig();
      this.config = config;
      if (config.endpoint && config.endpoint !== this.endpoint) {
        this.endpoint = config.endpoint;
      }
    } catch (e) {
      console.error(e);
    }
  };

  setClientAddress = async (token: string, flag: number) => {
    this.clientAddress = token;
    this.addressFlag = flag;
  };

  getRespData = async (res: any) => {
    let jsonRes: { code: number; msg: string; data: any };

    if (!res) throw new Error('Network error, no response');
    if (res.status !== 200) throw new Error('Network error with status: ' + res.status);
    try {
      jsonRes = await res.json();
    } catch (e) {
      throw new Error('Network error, json parse error');
    }
    if (!jsonRes) throw new Error('Network error,no response data');
    if (jsonRes.code !== API_STATUS.SUCCESS) {
      throw new Error(jsonRes.msg);
    }
    return jsonRes.data;
  };

  httpGet = async (route: string, params: any) => {
    let url = this.endpoint + route;
    let c = 0;
    for (const id in params) {
      if (c == 0) {
        url += '?';
      } else {
        url += '&';
      }
      url += `${id}=${params[id]}`;
      c++;
    }
    const headers = new Headers();
    headers.append('X-Client', 'UniSat Wallet');
    headers.append('X-Version', VERSION);
    headers.append('x-address', this.clientAddress);
    headers.append('x-flag', this.addressFlag + '');
    headers.append('x-channel', CHANNEL);
    headers.append('x-udid', this.store.deviceId);
    let res: Response;
    try {
      res = await fetch(new Request(url), { method: 'GET', headers, mode: 'cors', cache: 'default' });
    } catch (e: any) {
      throw new Error('Network error: ' + e && e.message);
    }

    return this.getRespData(res);
  };

  httpPost = async (route: string, params: any) => {
    const url = this.endpoint + route;
    const headers = new Headers();
    headers.append('X-Client', 'UniSat Wallet');
    headers.append('X-Version', VERSION);
    headers.append('x-address', this.clientAddress);
    headers.append('x-flag', this.addressFlag + '');
    headers.append('x-channel', CHANNEL);
    headers.append('x-udid', this.store.deviceId);
    headers.append('Content-Type', 'application/json;charset=utf-8');
    let res: Response;
    try {
      res = await fetch(new Request(url), {
        method: 'POST',
        headers,
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify(params)
      });
    } catch (e: any) {
      throw new Error('Network error: ' + e && e.message);
    }

    return this.getRespData(res);
  };

  async getWalletConfig(): Promise<WalletConfig> {
    return this.httpGet('/v5/default/config', {});
  }

  async getAddressSummary(address: string): Promise<AddressSummary> {
    return this.httpGet('/v5/address/summary', {
      address
    });
  }

  async getAppList(): Promise<
    {
      tab: string;
      items: AppInfo[];
    }[]
  > {
    return this.httpGet('/v5/discovery/app-list', {});
  }

  async getBannerList(): Promise<
    {
      id: string;
      img: string;
      link: string;
    }[]
  > {
    return this.httpGet('/v5/discovery/banner-list', {});
  }

  async getBlockActiveInfo(): Promise<{ allTransactions: number; allAddrs: number }> {
    return this.httpGet('/v5/default/block-active-info', {});
  }

  async getAddressBalance(address: string): Promise<BitcoinBalance> {
    return this.httpGet('/v5/address/balance', {
      address
    });
  }

  async getMultiAddressAssets(addresses: string): Promise<AddressSummary[]> {
    return this.httpGet('/v5/address/multi-assets', {
      addresses
    });
  }

  async findGroupAssets(
    groups: { type: number; address_arr: string[] }[]
  ): Promise<{ type: number; address_arr: string[]; satoshis_arr: number[] }[]> {
    return this.httpPost('/v5/address/find-group-assets', {
      groups
    });
  }

  async getAvailableUtxos(address: string): Promise<UTXO[]> {
    return this.httpGet('/v5/address/available-utxo', {
      address,
      ignoreAssets: true
    });
  }

  async getUnavailableUtxos(address: string): Promise<UTXO[]> {
    return this.httpGet('/v5/address/unavailable-utxo', {
      address
    });
  }

  async getBTCUtxos(address: string): Promise<UTXO[]> {
    return this.httpGet('/v5/address/btc-utxo', {
      address
    });
  }

  async getAppSummary(): Promise<AppSummary> {
    return this.httpGet('/v5/default/app-summary-v2', {});
  }

  async pushTx(rawtx: string): Promise<string> {
    return this.httpPost('/v5/tx/broadcast', {
      rawtx
    });
  }

  async getFeeSummary(): Promise<FeeSummary> {
    return this.httpGet('/v5/default/fee-summary', {});
  }

  private priceCache: CoinPrice | null = null;
  private priceUpdateTime = 0;
  private isRefreshingCoinPrice = false;

  async refreshCoinPrice() {
    try {
      this.isRefreshingCoinPrice = true;
      const result: CoinPrice = await this.httpGet('/v5/default/price', {});

      this.priceCache = result;
      this.priceUpdateTime = Date.now();

      return result;
    } finally {
      this.isRefreshingCoinPrice = false;
    }
  }

  async getCoinPrice(): Promise<CoinPrice> {
    while (this.isRefreshingCoinPrice) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    //   30s cache
    if (this.priceCache && Date.now() - this.priceUpdateTime < 30 * 1000) {
      return this.priceCache;
    }
    // 40s return cache and refresh
    if (this.priceCache && Date.now() - this.priceUpdateTime < 40 * 1000) {
      this.refreshCoinPrice().then();
      return this.priceCache;
    }

    return this.refreshCoinPrice();
  }

  async decodePsbt(psbtHex: string, website: string): Promise<DecodedPsbt> {
    return this.httpPost('/v5/tx/decode2', { psbtHex, website });
  }

  async getBuyBtcChannelList(): Promise<{ channel: string }[]> {
    return this.httpGet('/v5/buy-btc/channel-list', {});
  }

  async createPaymentUrl(address: string, channel: string): Promise<string> {
    return this.httpPost('/v5/buy-btc/create', { address, channel });
  }

  async checkWebsite(website: string): Promise<{ isScammer: boolean; warning: string }> {
    return this.httpPost('/v5/default/check-website', { website });
  }

  async getVersionDetail(version: string): Promise<VersionDetail> {
    return this.httpGet('/v5/version/detail', {
      version
    });
  }

  async getAddressRecentHistory(params: { address: string; start: number; limit: number }) {
    return this.httpGet('/v5/address/history', params);
  }
}

export default new OpenApiService();
