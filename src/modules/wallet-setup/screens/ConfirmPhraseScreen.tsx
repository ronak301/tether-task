import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { wordlists } from 'bip39';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface WordPosition {
  position: number;
  word: string;
  options: string[];
}

export default function ConfirmPhraseScreen() {
  const router = useDebouncedNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    mnemonic?: string;
    walletName?: string;
    avatar?: string;
  }>();
  const [selectedWords, setSelectedWords] = useState<{ [key: number]: string }>({});
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);

  useEffect(() => {
    const mnemonicString = params.mnemonic as string;
    if (!mnemonicString) return;

    const words = mnemonicString.split(',');
    const bip39Words = wordlists.english;

    // Pick 3 random unique positions from the 12 words.
    const allIndices = Array.from({ length: 12 }, (_, i) => i);
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    const positions = allIndices.slice(0, 3);

    const verificationWords: WordPosition[] = positions.map((pos) => {
      const correctWord = words[pos];

      // Pick 2 random BIP39 words that are not the correct word as distractors.
      const distractors: string[] = [];
      while (distractors.length < 2) {
        const candidate = bip39Words[Math.floor(Math.random() * bip39Words.length)];
        if (candidate !== correctWord && !distractors.includes(candidate)) {
          distractors.push(candidate);
        }
      }

      const options = [correctWord, ...distractors].sort(() => Math.random() - 0.5);
      return { position: pos + 1, word: correctWord, options };
    });

    setWordPositions(verificationWords);
  }, [params.mnemonic]);

  const handleWordSelect = (position: number, word: string) => {
    setSelectedWords((prev) => ({
      ...prev,
      [position]: word,
    }));
  };

  const isAllSelected = () => {
    return wordPositions.every((wp) => selectedWords[wp.position] !== undefined);
  };

  const isCorrect = () => {
    return wordPositions.every((wp) => selectedWords[wp.position] === wp.word);
  };

  const handleNext = () => {
    if (!isAllSelected()) {
      Alert.alert('Select All Words', 'Please select all the required words to continue.', [
        { text: 'OK' },
      ]);
      return;
    }

    if (!isCorrect()) {
      Alert.alert('Incorrect Words', 'Some words are incorrect. Please try again.', [
        { text: 'OK' },
      ]);
      // Reset selections for incorrect words
      const newSelections = { ...selectedWords };
      wordPositions.forEach((wp) => {
        if (selectedWords[wp.position] !== wp.word) {
          delete newSelections[wp.position];
        }
      });
      setSelectedWords(newSelections);
      return;
    }

    // All correct, proceed to completion
    router.push({
      pathname: './complete',
      params: {
        walletName: params.walletName,
        avatar: params.avatar,
        mnemonic: params.mnemonic,
      },
    });
  };

  const getButtonStyle = (position: number, word: string) => {
    const selected = selectedWords[position] === word;
    const isCorrectWord = wordPositions.find((wp) => wp.position === position)?.word === word;

    if (selected) {
      if (isAllSelected() && !isCorrect() && !isCorrectWord) {
        return [styles.wordOption, styles.wordOptionIncorrect];
      }
      return [styles.wordOption, styles.wordOptionSelected];
    }

    return styles.wordOption;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Confirm your secret phrase</Text>

        {wordPositions.map((wp) => (
          <View key={wp.position} style={styles.wordSection}>
            <Text style={styles.wordLabel}>Word #{wp.position}</Text>
            <View style={styles.optionsContainer}>
              {wp.options.map((option) => (
                <TouchableOpacity
                  key={`${wp.position}-${option}`}
                  style={getButtonStyle(wp.position, option)}
                  onPress={() => handleWordSelect(wp.position, option)}
                >
                  <Text
                    style={[
                      styles.wordOptionText,
                      selectedWords[wp.position] === option && styles.wordOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.nextButton, !isAllSelected() && styles.nextButtonDisabled]}
          onPress={handleNext}
        >
          <Text style={[styles.nextButtonText, !isAllSelected() && styles.nextButtonTextDisabled]}>
            Next
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  skipText: {
    color: colors.primary,
    fontSize: 16,
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
  wordSection: {
    marginBottom: 28,
  },
  wordLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  wordOption: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  wordOptionSelected: {
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    borderColor: colors.primary,
  },
  wordOptionIncorrect: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: colors.danger,
  },
  wordOptionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  wordOptionTextSelected: {
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  nextButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.card,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
  },
  nextButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
