import BigNumber from 'bignumber.js';

import { DecodedPsbt } from '@/shared/types';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { colors } from '@/ui/theme/colors';

import { Column } from '../Column';
import { Icon } from '../Icon';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

export const SendingOutAssets = ({ decodedPsbt, onClose }: { decodedPsbt: DecodedPsbt; onClose: () => void }) => {
  const currentAccount = useCurrentAccount();

  return (
    <Popover>
      <Column justifyCenter itemsCenter>
        <Row fullX justifyBetween>
          <Row />
          <Text text="Sending Out Assets" preset="bold" />
          <Icon
            icon="close"
            onClick={() => {
              onClose();
            }}
          />
        </Row>

        <Row fullX style={{ borderBottomWidth: 1, borderColor: colors.border }} />
      </Column>
    </Popover>
  );
};
