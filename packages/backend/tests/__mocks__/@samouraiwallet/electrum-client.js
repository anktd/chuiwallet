module.exports = {
  ElectrumClient: {
    createClient: jest.fn().mockResolvedValue({
      blockchainScripthash_getBalance: jest.fn().mockResolvedValue({ confirmed: 1000, unconfirmed: 200 }),
      blockchainScripthash_getHistory: jest.fn().mockResolvedValue([{ tx_hash: 'tx1', height: 100 }]),
      blockchainTransaction_broadcast: jest.fn().mockResolvedValue('dummy_txid'),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
};
