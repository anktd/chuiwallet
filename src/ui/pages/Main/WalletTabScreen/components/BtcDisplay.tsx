import { useMemo } from 'react';

import { Row, Text } from '@/ui/components';
import { useBTCUnit, useChainType } from '@/ui/state/settings/hooks';

export function BtcDisplay({ balance }: { balance: string }) {
  const chainType = useChainType();
  const btcUnit = useBTCUnit();
  const { intPart, decPart } = useMemo(() => {
    //   split balance into integer and decimal parts
    const [intPart, decPart] = balance.split('.');

    return {
      intPart,
      decPart: decPart || ''
    };
  }, [balance]);

  return <Text text={balance + ' ' + btcUnit} preset="title-bold" textCenter size="xxxl" my="sm" />;
}
