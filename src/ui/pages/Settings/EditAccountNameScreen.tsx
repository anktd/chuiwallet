import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Account } from '@/shared/types';
import { Button, Content, Header, Input, Layout } from '@/ui/components';
import { accountActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { keyringsActions } from '@/ui/state/keyrings/reducer';
import { useWallet } from '@/ui/utils';

export default function EditAccountNameScreen() {
  const { state } = useLocation();
  const { account } = state as {
    account: Account;
  };

  const wallet = useWallet();
  const [alianName, setAlianName] = useState('');
  const dispatch = useAppDispatch();
  const handleOnClick = async () => {
    const newAccount = await wallet.setAccountAlianName(account, alianName);
    dispatch(keyringsActions.updateAccountName(newAccount));
    dispatch(accountActions.updateAccountName(newAccount));
    window.history.go(-1);
  };

  // eslint-disable-next-line no-undef
  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      handleOnClick();
    }
  };

  const validName = useMemo(() => {
    if (alianName.length == 0) {
      return false;
    }
    return true;
  }, [alianName]);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={account.alianName}
      />
      <Content>
        <Input
          placeholder={account.alianName}
          defaultValue={account.alianName}
          onChange={(e) => {
            setAlianName(e.target.value);
          }}
          onKeyUp={(e) => handleOnKeyUp(e)}
          autoFocus={true}
        />
        <Button
          disabled={!validName}
          text="Change Account Name"
          preset="primary"
          // eslint-disable-next-line no-unused-vars
          onClick={(_e) => {
            handleOnClick();
          }}
        />
      </Content>
    </Layout>
  );
}
