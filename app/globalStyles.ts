import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { fontSizes, fontWeights, spacing } from "./theme";

// Helper for dynamic styles
export const useGlobalStyles = () => {
  const theme = useTheme();

  return {
    viewStyles: StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: spacing.md,
      },
      card: {
        backgroundColor: theme.colors.surface, // Better for MD3
        borderRadius: 12, // More rounded, modern
        padding: spacing.lg,
        marginVertical: spacing.sm,
        shadowColor: theme.colors.shadow || '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      },
      button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 100, // Pill shape often looks more professional
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: spacing.sm,
      },
      input: {
        backgroundColor: theme.colors.surfaceVariant, // MD3 standard
        borderColor: theme.colors.outline,
        color: theme.colors.onSurfaceVariant,
        borderWidth: 1,
        borderRadius: 8,
        padding: spacing.md, // More padding for touch targets
        marginBottom: spacing.md,
        fontSize: fontSizes.md,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      center: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      spacer: {
        height: spacing.md,
      },
    }),
    textStyles: StyleSheet.create({
      title: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold as any,
        color: theme.colors.onBackground, // Adapts to theme
        marginBottom: spacing.sm,
        letterSpacing: 0.5,
      },
      subtitle: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.medium as any,
        color: theme.colors.onSurfaceVariant,
        marginBottom: spacing.xs,
      },
      text: {
        fontSize: fontSizes.md,
        color: theme.colors.onSurface,
        lineHeight: 24, // Better readability
      },
      caption: {
        fontSize: fontSizes.sm,
        color: theme.colors.onSurfaceVariant,
      },
      buttonText: {
        color: theme.colors.onPrimary,
        fontSize: fontSizes.md,
        fontWeight: fontWeights.bold as any,
        textTransform: 'uppercase', // Professional touch
        letterSpacing: 1,
      },
      input: {
        fontSize: fontSizes.md,
        color: theme.colors.onSurface,
      },
      error: {
        color: theme.colors.error,
        fontSize: fontSizes.sm,
        marginTop: spacing.xs,
      },
    }),
    colors: theme.colors as any, // Expose current theme colors
    spacing,
  };
};

// Deprecated static styles - kept temporarily to avoid breaking changes if not all files are updated immediately
// These will NOT adapt to theme changes dynamically
import { colors } from "./theme";

export const viewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Uses light theme default
    padding: spacing.md,
  },
  // ... (simplified fallback)
  input: {
    backgroundColor: colors.surface ?? '#fff',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border ?? '#ccc',
    marginBottom: spacing.md,
  },
});

export const textStyles = StyleSheet.create({
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary, // Uses light theme default
  },
  // ... (simplified fallback)
});
