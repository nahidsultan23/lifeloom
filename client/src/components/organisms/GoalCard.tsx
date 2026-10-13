import { View } from 'react-native';
import type { Goal } from '../../api';
import { deadlineLabel, isPastDate, statusLabel } from '../../lib/goals';
import { t } from '../../strings';
import { AppText } from '../atoms/AppText';
import { Card } from '../atoms/Card';
import { Pill } from '../atoms/Pill';

interface Props {
  goal: Goal;
  birthDate?: string;
  onPress: () => void;
}

export function GoalCard({ goal, birthDate, onPress }: Props) {
  const past = isPastDate(goal, birthDate);
  const label = deadlineLabel(goal, birthDate);
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${goal.title}. ${label}. ${statusLabel(goal.status)}${past ? `. ${t.goals.pastDate}` : ''}`}
    >
      <AppText variant="heading">{goal.title}</AppText>
      <AppText muted>{label}</AppText>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Pill
          label={statusLabel(goal.status)}
          icon={goal.status === 'completed' ? 'check' : goal.status === 'archived' ? 'archive' : goal.status === 'abandoned' ? 'wind' : 'target'}
        />
        {past ? <Pill tone="notice" icon="clock" label={t.goals.pastDate} /> : null}
      </View>
    </Card>
  );
}
