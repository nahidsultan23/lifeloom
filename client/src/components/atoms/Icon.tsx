import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type IconName = keyof typeof Feather.glyphMap;

interface Props {
  name: IconName;
  size?: number;
  accent?: boolean;
  muted?: boolean;
  color?: string;
}

/** One icon family (Feather) for the whole interface. Decorative by default. */
export function Icon({ name, size = 22, accent, muted, color }: Props) {
  const colors = useTheme();
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? (accent ? colors.accentText : muted ? colors.textMuted : colors.text)}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
