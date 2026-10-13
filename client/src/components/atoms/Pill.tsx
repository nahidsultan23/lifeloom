import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  /** State is always shown with an icon and words, never with color alone. */
  icon?: IconName;
  tone?: 'neutral' | 'notice';
}

export function Pill({ label, icon, tone = 'neutral' }: Props) {
  const colors = useTheme();
  const background = tone === 'notice' ? colors.notice : colors.surfaceAlt;
  const color = tone === 'notice' ? colors.onNotice : colors.text;
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
