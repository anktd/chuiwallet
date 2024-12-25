import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { RESTORE_WALLETS } from '@/shared/constant';
import { AddressType, RestoreWalletType } from '@/shared/types';
import { Button, Column, Content, Header, Layout, Row, Text } from '@/ui/components';
import { TabBar } from '@/ui/components/TabBar';

import { useNavigate } from '../MainRoute';
import {
  ContextData,
  TabType,
  UpdateContextDataParams,
  WordsType
} from '@/ui/pages/Account/createHDWalletComponents/types';
import { Step1_Create } from '@/ui/pages/Account/createHDWalletComponents/Step1_Create';
import { Step1_Import } from '@/ui/pages/Account/createHDWalletComponents/Step1_Import';
import { Step2 } from '@/ui/pages/Account/createHDWalletComponents/Step2';
import { Step0 } from '@/ui/pages/Account/createHDWalletComponents/Step0';
import { Step1_Confirm } from '@/ui/pages/Account/createHDWalletComponents/Step1_Confirm';


export default function CreateHDWalletScreen() {
  const navigate = useNavigate();

  const { state } = useLocation();
  const { isImport, fromUnlock } = state as {
    isImport: boolean;
    fromUnlock: boolean;
  };

  const [contextData, setContextData] = useState<ContextData>({
    mnemonics: '',
    hdPath: '',
    passphrase: '',
    addressType: AddressType.P2WPKH,
    step1Completed: false,
    tabType: TabType.STEP1,
    restoreWalletType: RestoreWalletType.UNISAT,
    isRestore: isImport,
    isCustom: false,
    customHdPath: '',
    addressTypeIndex: 0,
    wordsType: WordsType.WORDS_12
  });

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData]
  );

  const items = useMemo(() => {
    if (contextData.isRestore) {
      if (contextData.restoreWalletType === RestoreWalletType.OW) {
        return [
          {
            key: TabType.STEP1,
            label: 'Step 1',
            children: <Step0 contextData={contextData} updateContextData={updateContextData} />
          },
          {
            key: TabType.STEP2,
            label: 'Step 2',
            children: <Step1_Import contextData={contextData} updateContextData={updateContextData} />
          }
        ];
      } else {
        return [
          {
            key: TabType.STEP1,
            label: 'Step 1',
            children: <Step0 contextData={contextData} updateContextData={updateContextData} />
          },
          {
            key: TabType.STEP2,
            label: 'Step 2',
            children: <Step1_Import contextData={contextData} updateContextData={updateContextData} />
          },
          {
            key: TabType.STEP3,
            label: 'Step 3',
            children: <Step2 contextData={contextData} updateContextData={updateContextData} />
          }
        ];
      }
    } else {
      return [
        {
          key: TabType.STEP1,
          label: 'Step 1',
          children: <Step1_Create contextData={contextData} updateContextData={updateContextData} />
        },
        // {
        //   key: TabType.STEP2,
        //   label: 'Step 2',
        //   children: <Step1_Confirm contextData={contextData} updateContextData={updateContextData} />
        // },
        {
          key: TabType.STEP2,
          label: 'Step 2',
          children: <Step2 contextData={contextData} updateContextData={updateContextData} />
        }
      ];
    }
  }, [contextData, updateContextData]);

  const currentChildren = useMemo(() => {
    const item = items.find((v) => v.key === contextData.tabType);
    return item?.children;
  }, [items, contextData.tabType]);

  const activeTabIndex = useMemo(() => {
    const index = items.findIndex((v) => v.key === contextData.tabType);
    if (index === -1) {
      return 0;
    } else {
      return index;
    }
  }, [items, contextData.tabType]);
  return (
    <Layout>
      <Header
        onBack={() => {
          if (fromUnlock) {
            navigate('WelcomeScreen');
          } else {
            window.history.go(-1);
          }
        }}
        title={contextData.isRestore ? 'Restore from mnemonics' : 'Create a new HD Wallet'}
      />
      <Content>
        <Row justifyCenter>
          <TabBar
            progressEnabled
            defaultActiveKey={contextData.tabType}
            activeKey={contextData.tabType}
            items={items.map((v) => ({
              key: v.key,
              label: v.label
            }))}
            onTabClick={(key) => {
              const toTabType = key as TabType;
              if (toTabType === TabType.STEP2) {
                if (!contextData.step1Completed) {
                  setTimeout(() => {
                    updateContextData({ tabType: contextData.tabType });
                  }, 200);
                  return;
                }
              }
              updateContextData({ tabType: toTabType });
            }}
          />
        </Row>

        {currentChildren}
      </Content>
    </Layout>
  );
}
