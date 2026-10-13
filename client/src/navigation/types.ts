import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  GoalForm: { goalId?: string } | undefined;
  GoalDetail: { goalId: string };
  MemoryForm: { goalId?: string } | undefined;
  Snapshot: { eventId: string };
  WhatIfList: undefined;
  WhatIfForm: { pathId?: string } | undefined;
  WhatIfDetail: { pathId: string };
  LetterForm: { letterId?: string } | undefined;
  LetterDetail: { letterId: string };
  Notifications: undefined;
  Privacy: undefined;
  About: undefined;
};

export type ScreenProps<K extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  K
>;

export type TabParamList = {
  Home: undefined;
  Goals: undefined;
  Ledger: undefined;
  Letters: undefined;
  Profile: undefined;
};
