import { Text, type TextProps } from 'react-native';
import { type, useTheme } from '../../theme';

export type TextVariant = keyof typeof type;

interface Props extends TextProps {
  variant?: TextVariant;
  muted?: boolean;
  accent?: boolean;
}

/** All text goes through here so type scale, color, and dynamic type stay uniform. */
export function AppText({ variant = 'body', muted, accent, style, ...rest }: Props) {
  const colors = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        type[variant],
        { color: accent ? colors.accentText : muted ? colors.textMuted : colors.text },
        style,
      ]}
    />
  );
}
