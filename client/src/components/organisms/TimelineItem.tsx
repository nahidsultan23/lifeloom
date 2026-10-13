import type { TimelineEvent } from '../../api';
import { formatInstant } from '../../lib/dates';
import { t } from '../../strings';
import { AppText } from '../atoms/AppText';
import { Card } from '../atoms/Card';
import { Icon, type IconName } from '../atoms/Icon';
import { View } from 'react-native';

const ICONS: Record<TimelineEvent['eventType'], IconName> = {
  goal_created: 'flag',
  goal_updated: 'edit-3',
  goal_status: 'compass',
  memory: 'book-open',
};

interface Props {
  event: TimelineEvent;
  onPress: () => void;
}

/** One line of the life ledger. Text comes from what was stored at the time. */
export function TimelineItem({ event, onPress }: Props) {
  const label = t.ledger.events[event.eventType];
  const when = formatInstant(event.occurredAt);
  const title = event.snapshot?.title;
  const status =
    event.eventType === 'goal_status' && event.snapshot?.status
      ? t.goals.status[event.snapshot.status]
      : undefined;
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}. ${title ?? ''}. ${when}`}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon name={ICONS[event.eventType]} size={20} accent />
        <View style={{ flex: 1 }}>
          <AppText variant="label">{label}</AppText>
          {title ? <AppText>{title}</AppText> : null}
          {status ? <AppText muted>{t.ledger.markedAs(status)}</AppText> : null}
          {event.eventType === 'memory' && event.note ? (
            <AppText numberOfLines={2} muted>
              {event.note}
            </AppText>
          ) : null}
          <AppText variant="caption" muted>
            {when}
          </AppText>
        </View>
      </View>
    </Card>
  );
}
