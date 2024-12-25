import { Radio } from 'antd';
import * as bip39 from 'bip39';
import { useEffect, useMemo, useState } from 'react';

import { Button, Card, Column, Grid, Input, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import {
  ContextData,
  TabType,
  UpdateContextDataParams,
  WordsType
} from '@/ui/pages/Account/createHDWalletComponents/types';

const WORDS_12_ITEM = {
  key: WordsType.WORDS_12,
  label: '12 words',
  count: 12
};

const WORDS_24_ITEM = {
  key: WordsType.WORDS_24,
  label: '24 words',
  count: 24
};

export function Step1_Import({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  // eslint-disable-next-line no-unused-vars
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const [curInputIndex, setCurInputIndex] = useState(0);
  const [disabled, setDisabled] = useState(true);

  const wordsItems = useMemo(() => {
    return [WORDS_12_ITEM, WORDS_24_ITEM];
  }, [contextData]);

  const [keys, setKeys] = useState<Array<string>>(new Array(wordsItems[contextData.wordsType].count).fill(''));

  const handleEventPaste = (event, index: number) => {
    const copyText = event.clipboardData?.getData('text/plain');
    const textArr = copyText.trim().split(' ');
    const newKeys = [...keys];
    if (textArr) {
      for (let i = 0; i < keys.length - index; i++) {
        if (textArr.length == i) {
          break;
        }
        newKeys[index + i] = textArr[i];
      }
      setKeys(newKeys);
    }

    event.preventDefault();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChange = (e: any, index: any) => {
    const newKeys = [...keys];
    newKeys.splice(index, 1, e.target.value);
    setKeys(newKeys);
  };

  useEffect(() => {
    setDisabled(true);

    const hasEmpty =
      keys.filter((key) => {
        return key == '';
      }).length > 0;
    if (hasEmpty) {
      return;
    }

    const mnemonic = keys.join(' ');
    if (!bip39.validateMnemonic(mnemonic)) {
      return;
    }

    setDisabled(false);
  }, [keys]);

  const tools = useTools();
  const onNext = async () => {
    try {
      const mnemonics = keys.join(' ');
      updateContextData({ mnemonics, tabType: TabType.STEP3 });
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools.toastError((e as any).message);
    }
  };
  // eslint-disable-next-line no-undef
  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      onNext();
    }
  };

  return (
    <Column gap="lg">
      <Text text="Secret Recovery Phrase" preset="title-bold" textCenter />
      <Text text="Import an existing wallet with your secret recovery phrase" preset="sub" textCenter />

      {wordsItems.length > 1 ? (
        <Row justifyCenter>
          <Radio.Group
            onChange={(e) => {
              const wordsType = e.target.value;
              updateContextData({ wordsType });
              setKeys(new Array(wordsItems[wordsType].count).fill(''));
            }}
            value={contextData.wordsType}>
            {wordsItems.map((v) => (
              <Radio key={v.key} value={v.key}>
                {v.label}
              </Radio>
            ))}
          </Radio.Group>
        </Row>
      ) : null}

      <Row justifyCenter>
        <Grid columns={2}>
          {keys.map((_, index) => {
            return (
              <Row key={index}>
                <Card gap="zero">
                  <Text text={`${index + 1}. `} style={{ width: 25 }} textEnd color="textDim" />
                  <Input
                    containerStyle={{ width: 80, minHeight: 25, height: 25, padding: 0 }}
                    style={{ width: 60 }}
                    value={_}
                    onPaste={(e) => {
                      handleEventPaste(e, index);
                    }}
                    onChange={(e) => {
                      onChange(e, index);
                    }}
                    onFocus={() => {
                      setCurInputIndex(index);
                    }}
                    onBlur={() => {
                      setCurInputIndex(999);
                    }}
                    onKeyUp={(e) => handleOnKeyUp(e)}
                    autoFocus={index == curInputIndex}
                    preset={'password'}
                    placeholder=""
                  />
                </Card>
              </Row>
            );
          })}
        </Grid>
      </Row>

      <FooterButtonContainer>
        <Button
          disabled={disabled}
          text="Continue"
          preset="primary"
          onClick={() => {
            onNext();
          }}
        />
      </FooterButtonContainer>
    </Column>
  );
}
