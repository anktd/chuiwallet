import { Tooltip } from 'antd';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import AccountSelect from '@/ui/components/AccountSelect';
import { BtcUsd } from '@/ui/components/BtcUsd';
import { Button } from '@/ui/components/Button';
import { DisableUnconfirmedsPopover } from '@/ui/components/DisableUnconfirmedPopover';
import { FeeRateIcon } from '@/ui/components/FeeRateIcon';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { SwitchNetworkBar } from '@/ui/components/SwitchNetworkBar';
import { UpgradePopover } from '@/ui/components/UpgradePopover';
import { getCurrentTab } from '@/ui/features/browser/tabs';
import { BtcDisplay } from '@/ui/pages/Main/WalletTabScreen/components/BtcDisplay';
import { useAccountBalance, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import {
  useAddressExplorerUrl,
  useBTCUnit,
  useChain,
  useSkipVersionCallback,
  useVersionInfo,
  useWalletConfig
} from '@/ui/state/settings/hooks';
import { useFetchUtxosCallback, useSafeBalance } from '@/ui/state/transactions/hooks';
import { useResetUiTxCreateScreen } from '@/ui/state/ui/hooks';
import { fontSizes } from '@/ui/theme/font';
import { amountToSatoshis, satoshisToAmount, useWallet } from '@/ui/utils';
import { useNavigate } from '../../MainRoute';
import { SwitchChainModal } from '../../Settings/SwitchChainModal';

const $noBreakStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all'
};

export default function WalletTabScreen() {
  const navigate = useNavigate();
  const accountBalance = useAccountBalance();
  const chain = useChain();
  const currentKeyring = useCurrentKeyring();
  const currentAccount = useCurrentAccount();
  const balanceValue = useMemo(() => {
    if (accountBalance.amount === '0') {
      return '--';
    } else {
      return accountBalance.amount;
    }
  }, [accountBalance.amount]);
  const wallet = useWallet();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const [connected, setConnected] = useState(false);
  const skipVersion = useSkipVersionCallback();
  const walletConfig = useWalletConfig();
  const versionInfo = useVersionInfo();
  const [showDisableUnconfirmedUtxoNotice, setShowDisableUnconfirmedUtxoNotice] = useState(false);
  const fetchUtxos = useFetchUtxosCallback();
  const ref = useRef<{ fetchedUtxo: { [key: string]: { loading: boolean } } }>({
    fetchedUtxo: {}
  });
  const [loadingFetch, setLoadingFetch] = useState(false);
  const safeBalance = useSafeBalance();
  const avaiableSatoshis = useMemo(() => {
    return amountToSatoshis(safeBalance);
  }, [safeBalance]);
  const totalSatoshis = amountToSatoshis(accountBalance.amount);
  const unavailableSatoshis = totalSatoshis - avaiableSatoshis;
  const avaiableAmount = safeBalance;
  const unavailableAmount = satoshisToAmount(unavailableSatoshis);
  const totalAmount = satoshisToAmount(totalSatoshis);

  useEffect(() => {
    const run = async () => {
      const activeTab = await getCurrentTab();
      if (!activeTab) return;
      const site = await wallet.getCurrentConnectedSite(activeTab.id);
      if (site) {
        setConnected(site.isConnected);
      }
    };
    run();
  }, []);

  const addressExplorerUrl = useAddressExplorerUrl(currentAccount.address);
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();
  const btcUnit = useBTCUnit();
  const [switchChainModalVisible, setSwitchChainModalVisible] = useState(false);

  return (
    <Layout>
      <Header
        type="style2"
        LeftComponent={
          <Card
            preset="style2"
            style={{ height: 28 }}
            onClick={() => {
              navigate('SwitchKeyringScreen');
            }}>
            <Text text={currentKeyring.alianName} size="xxs" />
          </Card>
        }
        RightComponent={
          <Row>
            <FeeRateIcon />
            <SwitchNetworkBar />
          </Row>
        }
      />

      <Content>
        <AccountSelect />

        <Column gap="lg2" mt="md">
          {(walletConfig.chainTip || walletConfig.statusMessage) && (
            <Column
              py={'lg'}
              px={'md'}
              gap={'lg'}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(245, 84, 84, 0.35)',
                background: 'rgba(245, 84, 84, 0.08)'
              }}>
              {walletConfig.chainTip && <Text text={walletConfig.chainTip} color="text" textCenter />}
              {walletConfig.statusMessage && <Text text={walletConfig.statusMessage} color="danger" textCenter />}
            </Column>
          )}

          <Tooltip
            placement={'bottom'}
            title={
              !loadingFetch ? (
                <>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Available '}</span>
                    <span style={$noBreakStyle}>{` ${avaiableAmount} ${btcUnit}`}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Unavailable '}</span>
                    <span style={$noBreakStyle}>{` ${unavailableAmount} ${btcUnit}`}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Total '}</span>
                    <span style={$noBreakStyle}>{` ${totalAmount} ${btcUnit}`}</span>
                  </Row>
                </>
              ) : (
                <>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Available '}</span>
                    <span style={$noBreakStyle}>{'loading...'}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Unavailable '}</span>
                    <span style={$noBreakStyle}>{'loading...'}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Total '}</span>
                    <span style={$noBreakStyle}>{` ${totalAmount} ${btcUnit}`}</span>
                  </Row>
                </>
              )
            }
            onOpenChange={() => {
              if (!ref.current.fetchedUtxo[currentAccount.address]) {
                ref.current.fetchedUtxo[currentAccount.address] = { loading: true };
                setLoadingFetch(true);
                fetchUtxos().finally(() => {
                  ref.current.fetchedUtxo[currentAccount.address].loading = false;
                  setLoadingFetch(false);
                });
              }
            }}
            overlayStyle={{
              fontSize: fontSizes.xs
            }}>
            <div>
              <Text text={'TOTAL BALANCE'} textCenter color="textDim" />
              <BtcDisplay balance={balanceValue} />
            </div>
          </Tooltip>
          <BtcUsd
            sats={amountToSatoshis(balanceValue)}
            textCenter
            size={'md'}
            style={{
              marginTop: -16,
              marginBottom: -8
            }}
          />

          <Row justifyCenter mt="md">
            <Button
              text="Receive"
              preset="home"
              icon="receive"
              onClick={() => {
                navigate('ReceiveScreen');
              }}
            />

            <Button
              text="Send"
              preset="home"
              icon="send"
              onClick={() => {
                resetUiTxCreateScreen();
                navigate('TxCreateScreen');
              }}
            />
            <Button
              text="History"
              preset="home"
              icon="history"
              onClick={() => {
                if (chain.isViewTxHistoryInternally) {
                  navigate('HistoryScreen');
                } else {
                  window.open(addressExplorerUrl);
                }
              }}
            />
          </Row>

          {/*{tabItems[assetTabKey].children}*/}
        </Column>
        {!versionInfo.skipped && (
          <UpgradePopover
            onClose={() => {
              skipVersion(versionInfo.newVersion);
            }}
          />
        )}

        {showDisableUnconfirmedUtxoNotice && (
          <DisableUnconfirmedsPopover onClose={() => setShowDisableUnconfirmedUtxoNotice(false)} />
        )}
        {switchChainModalVisible && (
          <SwitchChainModal
            onClose={() => {
              setSwitchChainModalVisible(false);
            }}
          />
        )}
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="home" />
      </Footer>
    </Layout>
  );
}
