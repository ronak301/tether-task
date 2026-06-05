import AsyncStorage from '@react-native-async-storage/async-storage';

const avatarOptions = [
  { id: 1, emoji: '₿', color: '#FF9500' },
  { id: 2, emoji: '💎', color: '#00D4FF' },
  { id: 3, emoji: '🌈', color: '#AF52DE' },
  { id: 4, emoji: '⚡', color: '#8E8E93' },
  { id: 5, emoji: '🟢', color: '#00C853' },
  { id: 6, emoji: '🔴', color: '#FF3B30' },
  { id: 7, emoji: '😎', color: '#FFCC00' },
  { id: 8, emoji: '👾', color: '#AF52DE' },
  { id: 9, emoji: '🎮', color: '#5856D6' },
  { id: 10, emoji: '🐻', color: '#8B6914' },
  { id: 11, emoji: '🚗', color: '#007AFF' },
  { id: 12, emoji: '😊', color: '#FFCC00' },
];

const storageKey = (walletId?: string) =>
  walletId ? `wallet_avatar_${walletId}` : 'wallet_avatar';

export const getAvatar = async (walletId?: string) => {
  const stored = await AsyncStorage.getItem(storageKey(walletId));
  if (stored) {
    const found = avatarOptions.find(a => a.emoji === stored);
    return found ?? avatarOptions[0];
  }
  return avatarOptions[0];
};

export const setAvatar = async (avatar: string, walletId?: string) => {
  await AsyncStorage.setItem(storageKey(walletId), avatar);
};

export const clearAvatar = async (walletId?: string) => {
  await AsyncStorage.removeItem(storageKey(walletId));
};

export default avatarOptions;
