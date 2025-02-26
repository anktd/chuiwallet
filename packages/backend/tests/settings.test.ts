import settings from '../src/modules/settings.js';

describe('Settings Module', () => {
  test('should update and get settings', () => {
    const original = settings.getSettings();
    const updated = settings.updateSettings({ fiatCurrency: 'EUR', gapLimit: 1000 });
    expect(updated.fiatCurrency).toBe('EUR');
    expect(updated.gapLimit).toBe(1000);
    // Other settings should remain unchanged.
    expect(updated.network).toBe(original.network);
  });
});
