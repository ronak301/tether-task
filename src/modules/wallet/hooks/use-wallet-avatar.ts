import avatarOptions, { getAvatar } from '@/modules/wallet/utils/avatar-options';
import { useWalletManager } from '@tetherto/wdk-react-native-core';
import { useEffect, useState } from 'react';

const useWalletAvatar = () => {
  const { activeWalletId } = useWalletManager();
  const [avatar, setAvatar] = useState<string>(avatarOptions[0].emoji);

  useEffect(() => {
    getAvatar(activeWalletId ?? undefined).then(a => setAvatar(a.emoji));
  }, [activeWalletId]);

  return avatar;
};

export default useWalletAvatar;
