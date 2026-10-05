import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../../theme';
import { WELCOME_COPY } from './welcome.copy';

const FADE_IN_DURATION_MS = 600;
const LOGO_SIZE = 96;

export interface WelcomeScreenProps {
  readonly onStart?: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_IN_DURATION_MS,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.logo} importantForAccessibility="no-hide-descendants">
          <Text style={styles.logoText}>{WELCOME_COPY.logo}</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {WELCOME_COPY.title}
        </Text>
        <Text style={styles.subtitle}>{WELCOME_COPY.subtitle}</Text>
      </Animated.View>

      {onStart ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={WELCOME_COPY.ctaA11yLabel}
          onPress={onStart}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{WELCOME_COPY.cta}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoText: { ...typography.logo },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.subtitle, color: colors.textSecondary, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonPressed: { backgroundColor: colors.primaryPressed },
  buttonText: { ...typography.button, color: colors.onPrimary },
});
