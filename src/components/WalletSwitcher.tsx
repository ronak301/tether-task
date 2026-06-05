import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useWalletManager, useRefreshBalance } from '@tetherto/wdk-react-native-core';
import { getAvatar } from '@/config/avatar-options';
import avatarOptions from '@/config/avatar-options';
import { useRouter } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

interface WalletSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletDisplayInfo {
  id: string;
  displayName: string;
  avatar: string;
}

function parseWalletName(walletId: string): string {
  // walletId format: wallet_<name_slug>_<timestamp>
  const match = walletId.match(/^wallet_(.+)_\d+$/);
  if (match) {
    return match[1]
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return walletId;
}

export function WalletSwitcher({ isOpen, onClose }: WalletSwitcherProps) {
  const { wallets, activeWalletId, setActiveWalletId, unlock } = useWalletManager();
  const { mutateAsync: refreshBalance } = useRefreshBalance();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [walletDisplayInfo, setWalletDisplayInfo] = useState<WalletDisplayInfo[]>([]);

  const snapPoints = useMemo(() => ['40%', '60%'], []);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  // Load per-wallet avatars whenever the list changes.
  useEffect(() => {
    const existing = wallets.filter(w => w.exists);
    Promise.all(
      existing.map(async w => {
        const avatar = await getAvatar(w.identifier);
        return {
          id: w.identifier,
          displayName: parseWalletName(w.identifier),
          avatar: avatar.emoji,
        };
      })
    ).then(setWalletDisplayInfo);
  }, [wallets]);

  const handleSelectWallet = useCallback(
    async (walletId: string) => {
      if (walletId !== activeWalletId) {
        setActiveWalletId(walletId);
        await unlock(walletId);
        // Invalidate TanStack cache so ETH balance refetches from RPC
        // instead of showing the previous wallet's stale initialData.
        refreshBalance({ accountIndex: 0, type: 'wallet' }).catch(() => {});
      }
      onClose();
    },
    [activeWalletId, setActiveWalletId, unlock, refreshBalance, onClose]
  );

  const handleAddWallet = useCallback(() => {
    onClose();
    // Small delay so the sheet has time to close before navigation.
    setTimeout(() => router.push('/wallet-setup/name-wallet'), 300);
  }, [onClose, router]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Show fallback avatars while loading.
  const displayList =
    walletDisplayInfo.length > 0
      ? walletDisplayInfo
      : wallets
          .filter(w => w.exists)
          .map((w, i) => ({
            id: w.identifier,
            displayName: parseWalletName(w.identifier),
            avatar: avatarOptions[i % avatarOptions.length].emoji,
          }));

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>My Wallets</Text>

        {displayList.map(wallet => {
          const isActive = wallet.id === activeWalletId;
          return (
            <TouchableOpacity
              key={wallet.id}
              style={[styles.walletRow, isActive && styles.walletRowActive]}
              onPress={() => handleSelectWallet(wallet.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarCircle, isActive && styles.avatarCircleActive]}>
                <Text style={styles.avatarText}>{wallet.avatar}</Text>
              </View>
              <Text style={[styles.walletName, isActive && styles.walletNameActive]} numberOfLines={1}>
                {wallet.displayName}
              </Text>
              {isActive && <Check size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.addButton} onPress={handleAddWallet} activeOpacity={0.7}>
          <View style={styles.addIcon}>
            <Plus size={20} color={colors.primary} />
          </View>
          <Text style={styles.addText}>Add wallet</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.card },
  handleIndicator: { backgroundColor: colors.border },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  walletRowActive: { backgroundColor: 'rgba(255, 101, 1, 0.08)', borderWidth: 1, borderColor: colors.primary },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarCircleActive: { backgroundColor: 'rgba(255, 101, 1, 0.15)' },
  avatarText: { fontSize: 20 },
  walletName: { flex: 1, fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  walletNameActive: { color: colors.text },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 101, 1, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
});
