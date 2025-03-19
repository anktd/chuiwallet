interface WalletSettings {
  gapLimit: number;
  fiatCurrency: string;
  network: 'mainnet' | 'testnet';
  xpub: string | null;
}

class Settings {
  private settings: WalletSettings;

  constructor() {
    this.settings = {
      gapLimit: 500,
      fiatCurrency: 'USD',
      network: 'mainnet',
      xpub: null,
    };
  }

  public updateSettings(newSettings: Partial<WalletSettings>): WalletSettings {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  public getSettings(): WalletSettings {
    return this.settings;
  }
}

export default new Settings();
