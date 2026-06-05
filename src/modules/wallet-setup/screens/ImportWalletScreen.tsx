import { SeedPhrase } from '@/components/SeedPhrase';
import * as Clipboard from 'expo-clipboard';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { ChevronLeft, Download, FileText, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { colors } from '@/constants/colors';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { validateMnemonic } from 'bip39';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

export default function ImportWalletScreen() {
  const router = useDebouncedNavigation();
  const insets = useSafeAreaInsets();
  const [secretWords, setSecretWords] = useState<string[]>(Array(12).fill(''));

  const handleWordChange = (index: number, text: string) => {
    const newWords = [...secretWords];
    newWords[index] = text.trim().toLowerCase();
    setSecretWords(newWords);
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();

      if (!clipboardContent.trim()) {
        toast.error('Empty Clipboard! No text found in clipboard');
        return;
      }

      const words = clipboardContent.trim().split(/\s+/).slice(0, 12);

      if (words.length < 12) {
        toast.error(
          `Invalid Phrase! Found only ${words.length} words in clipboard. Please ensure you have exactly 12 words.`
        );
        return;
      }

      const newWords = [...secretWords];
      words.forEach((word, index) => {
        if (index < 12) {
          newWords[index] = word.toLowerCase().trim();
        }
      });
      setSecretWords(newWords);

      toast.success('12 words have been pasted from clipboard');
    } catch (error) {
      console.error('Paste error:', error);
      toast.error('Could not paste from clipboard');
    }
  };

  const handleClear = () => {
    setSecretWords(Array(12).fill(''));
  };

  const isFormValid = () => {
    return secretWords.every(word => word.trim().length > 0);
  };

  const handleImportWallet = () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete', 'Please fill in all 12 words of your secret phrase', [
        { text: 'OK' },
      ]);
      return;
    }

    const seedPhrase = secretWords.map(w => w.trim().toLowerCase()).join(' ');

    if (!validateMnemonic(seedPhrase)) {
      Alert.alert(
        'Invalid Seed Phrase',
        'The phrase you entered is not a valid BIP39 mnemonic. Please check each word is spelled correctly.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: './import-name-wallet',
      params: { seedPhrase: encodeURIComponent(seedPhrase) },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Import via Secret Phrase</Text>

          <SeedPhrase words={secretWords} editable={true} onWordChange={handleWordChange} />

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePaste}>
              <FileText size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Paste</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleClear}>
              <Trash2 size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.importButton, !isFormValid() && styles.importButtonDisabled]}
          onPress={handleImportWallet}
        >
          <Download size={20} color={isFormValid() ? colors.black : colors.textTertiary} />
          <Text
            style={[styles.importButtonText, !isFormValid() && styles.importButtonTextDisabled]}
          >
            Import Wallet
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tintedBackground,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  importButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  importButtonDisabled: {
    backgroundColor: colors.card,
  },
  importButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
  },
  importButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
