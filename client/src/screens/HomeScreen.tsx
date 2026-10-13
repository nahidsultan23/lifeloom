import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { openSafeUrl } from '../lib/links';
import { api, type Goal } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { EmptyState } from '../components/molecules/StateViews';
import { Notice } from '../components/molecules/Notice';
import { GoalCard } from '../components/organisms/GoalCard';
import { ResourceView, ScreenTemplate } from '../components/templates/ScreenTemplate';
import { ageOn, goalDeadline, lifespanFraction } from '../lib/dates';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useResource } from '../state/useResource';
import { useUpdates } from '../state/UpdateContext';
import { t } from '../strings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function upcoming(goals: Goal[], birthDate?: string): Goal[] {
  return goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => {
      const da = goalDeadline(a, birthDate) ?? '9999-12-31';
      const db = goalDeadline(b, birthDate) ?? '9999-12-31';
      return da.localeCompare(db);
    })
    .slice(0, 3);
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { profile } = useAuth();
  const { optional, dismissOptional } = useUpdates();
  const goals = useResource((signal) => api.goals.list({ limit: 100, signal }), []);

  const birth = profile?.birthDate;
  const years = profile?.expectedLifespanYears;
  const age = birth ? ageOn(birth) : null;
  const fraction = lifespanFraction(birth, years);

  return (
    <ScreenTemplate onRefresh={goals.reload} refreshing={goals.loading && goals.data !== undefined}>
      <View>
        <AppText variant="display">{t.home.greeting(profile?.displayName ?? '')}</AppText>
        <AppText muted>{t.app.philosophy}</AppText>
      </View>

      {optional ? (
        <Notice
          icon="download"
          message={t.updates.optionalBody(optional.latestVersion)}
          actionLabel={t.updates.update}
          onAction={() => void openSafeUrl(optional.storeUrl)}
        />
      ) : null}
      {optional ? <Button label={t.updates.notNow} variant="quiet" onPress={dismissOptional} /> : null}

      {profile && !birth ? (
        <Notice
          icon="calendar"
          message={t.home.birthDateNeeded}
          actionLabel={t.home.openProfile}
          onAction={() => navigation.navigate('Tabs', { screen: 'Profile' })}
        />
      ) : null}

      {fraction !== null && years && age !== null ? (
        <Card accessible accessibilityLabel={t.home.lifespanLabel(age, years)}>
          <AppText variant="heading">{t.home.lifespanTitle}</AppText>
          <AppText>{t.home.lifespanBody(age, years, Math.round(fraction * 100))}</AppText>
          <AppText variant="caption" muted>
            {t.home.lifespanNote}
          </AppText>
        </Card>
      ) : null}

      <ResourceView {...goals}>
        {(page) => {
          const next = upcoming(page.items, birth);
          if (page.items.length === 0) {
            return (
              <EmptyState
                icon="compass"
                title={t.home.emptyTitle}
                body={t.home.emptyBody}
                actionLabel={t.goals.add}
                onAction={() => navigation.navigate('GoalForm')}
              />
            );
          }
          return (
            <View style={{ gap: 12 }}>
              <AppText variant="title">{t.home.lookingAhead}</AppText>
              {next.length === 0 ? (
                <AppText muted>{t.home.noActive}</AppText>
              ) : (
                next.map((goal) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    birthDate={birth}
                    onPress={() => navigation.navigate('GoalDetail', { goalId: goal._id })}
                  />
                ))
              )}
            </View>
          );
        }}
      </ResourceView>

      <View style={{ gap: 8 }}>
        <Button label={t.goals.add} icon="plus" onPress={() => navigation.navigate('GoalForm')} />
        <Button label={t.home.addMemory} icon="book-open" variant="secondary" onPress={() => navigation.navigate('MemoryForm')} />
        <Button label={t.home.writeLetter} icon="mail" variant="secondary" onPress={() => navigation.navigate('LetterForm')} />
        <Button label={t.home.whatIf} icon="git-branch" variant="secondary" onPress={() => navigation.navigate('WhatIfList')} />
      </View>
    </ScreenTemplate>
  );
}
