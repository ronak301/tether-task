import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { suppressLock } from '@/utils/biometric-auth';
import { ClipboardPaste, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');
const qrSize = screenWidth * 0.65;

function isValidEthAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export default function ScanQRScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const { returnRoute, ...params } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualError, setManualError] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const navigateWithAddress = useCallback(
    (address: string) => {
      const target = returnRoute ?? '/send/select-token';
      router.replace({
        pathname: target as any,
        params: { scannedAddress: address.trim(), ...params },
      });
    },
    [router, returnRoute, params]
  );

  const handleBarCodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (scanned) return;
      setScanned(true);

      const address = data.trim();
      if (!isValidEthAddress(address)) {
        Alert.alert('Invalid QR Code', 'The scanned code is not a valid Ethereum address.', [
          { text: 'Try Again', onPress: () => setScanned(false) },
        ]);
        return;
      }
      navigateWithAddress(address);
    },
    [scanned, navigateWithAddress]
  );

  const handleClose = useCallback(() => router.back(), [router]);

  const handleRequestPermission = useCallback(async () => {
    suppressLock(true);
    try {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission Required', 'Please allow camera access to scan QR codes.');
      }
    } finally {
      suppressLock(false);
    }
  }, [requestPermission]);

  const handleManualChange = (text: string) => {
    setManualAddress(text);
    setManualError('');
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setManualAddress(text.trim());
      setManualError('');
    }
  };

  const handleUseManualAddress = () => {
    const address = manualAddress.trim();
    if (!address) {
      setManualError('Please enter an address');
      return;
    }
    if (!isValidEthAddress(address)) {
      setManualError('Invalid Ethereum address (must start with 0x, 42 characters)');
      return;
    }
    navigateWithAddress(address);
  };

  if (permission === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <CloseHeader onClose={handleClose} />
        <View style={styles.centerContent}>
          <Text style={styles.centerText}>Checking camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <CloseHeader onClose={handleClose} />
        <View style={styles.centerContent}>
          <Text style={styles.centerTitle}>Camera Permission Required</Text>
          <Text style={styles.centerText}>
            Allow camera access to scan QR codes, or enter an address manually below.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
        <ManualInput
          value={manualAddress}
          error={manualError}
          onChange={handleManualChange}
          onPaste={handlePaste}
          onSubmit={handleUseManualAddress}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          insets={insets}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CloseHeader onClose={handleClose} />

      {/* Collapse the camera when the address input is focused so the
          keyboard doesn't push it off screen. */}
      {!inputFocused && (
        <>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Scan QR code</Text>
            <Text style={styles.subtitle}>Hold your phone up to the recipient's QR code.</Text>
          </View>

          <View style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing="back" onBarcodeScanned={handleBarCodeScanned}>
              <View style={styles.overlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Text style={styles.scanLabel}>Align QR code within the frame</Text>
              </View>
            </CameraView>
          </View>
        </>
      )}

      <ManualInput
        value={manualAddress}
        error={manualError}
        onChange={handleManualChange}
        onPaste={handlePaste}
        onSubmit={handleUseManualAddress}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        insets={insets}
      />
    </View>
  );
}

function CloseHeader({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.header}>
      <View style={{ width: 32 }} />
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <X size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function ManualInput({
  value,
  error,
  onChange,
  onPaste,
  onSubmit,
  onFocus,
  onBlur,
  insets,
}: {
  value: string;
  error: string;
  onChange: (t: string) => void;
  onPaste: () => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  insets: { bottom: number };
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.manualSection, { paddingBottom: insets.bottom + 16 }]}
    >
      <Text style={styles.manualLabel}>Or enter address manually</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.addressInput, !!error && styles.addressInputError]}
          value={value}
          onChangeText={onChange}
          placeholder="0x..."
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <TouchableOpacity style={styles.pasteButton} onPress={onPaste}>
          <ClipboardPaste size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity
        style={[styles.useButton, !value && styles.useButtonDisabled]}
        onPress={onSubmit}
        disabled={!value}
      >
        <Text style={[styles.useButtonText, !value && styles.useButtonTextDisabled]}>
          Use This Address
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: { padding: 4 },
  titleSection: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  cameraContainer: { flex: 1, marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: qrSize, height: qrSize, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.white },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLabel: {
    marginTop: 24,
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  manualSection: { paddingHorizontal: 20, paddingTop: 16 },
  manualLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addressInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'monospace',
  },
  addressInputError: { borderColor: colors.danger },
  pasteButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: 8 },
  useButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  useButtonDisabled: { backgroundColor: colors.card },
  useButtonText: { fontSize: 16, fontWeight: '600', color: colors.black },
  useButtonTextDisabled: { color: colors.textTertiary },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  centerTitle: { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 12 },
  centerText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permissionButton: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  permissionButtonText: { color: colors.black, fontSize: 16, fontWeight: '600' },
});
