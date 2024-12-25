import { useMemo } from 'react';

import { Text } from '@/ui/components';
import { useBTCUnit } from '@/ui/state/settings/hooks';

export function BtcDisplay({ balance }: { balance: string }) {
  const btcUnit = useBTCUnit();
  useMemo(() => {
    //   split balance into integer and decimal parts
    const [intPart, decPart] = balance.split('.');

    return {
      intPart,
      decPart: decPart || ''
    };
  }, [balance]);

  return <Text text={balance + ' ' + btcUnit} preset="title-bold" textCenter size="xxxl" my="sm" />;
}
