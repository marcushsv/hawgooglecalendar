import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export type NotificationSettings = {
  enabled: boolean;
  offsetsBefore: number[]; // Minuten vor Event-Start; 0 = pünktlich
};

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  offsetsBefore: [0, 15],
};

const SETTINGS_KEY = 'notificationSettings';

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

type Entry = {
  _id: string;
  title: string;
  datum: string;
  zeitVon?: string;
  zeitBis?: string;
  raum?: string;
  wiederholung?: 'nie' | 'wöchentlich' | '2-wöchentlich';
};

function getUpcomingDates(entry: Entry, from: Date, days: number): Date[] {
  if (!entry.zeitVon) return [];
  const dates: Date[] = [];
  const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  const [h, m] = entry.zeitVon.split(':').map(Number);

  const base = new Date(entry.datum);
  base.setHours(h, m, 0, 0);

  if (!entry.wiederholung || entry.wiederholung === 'nie') {
    if (base >= from && base <= to) dates.push(new Date(base));
  } else {
    const intervalMs =
      entry.wiederholung === 'wöchentlich'
        ? 7 * 24 * 60 * 60 * 1000
        : 14 * 24 * 60 * 60 * 1000;

    let current = new Date(base);
    if (current < from) {
      const diff = from.getTime() - current.getTime();
      const steps = Math.ceil(diff / intervalMs);
      current = new Date(current.getTime() + steps * intervalMs);
    }
    while (current <= to) {
      dates.push(new Date(current));
      current = new Date(current.getTime() + intervalMs);
    }
  }

  return dates;
}

export async function scheduleNotificationsForEntries(entries: Entry[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getNotificationSettings();
  if (!settings.enabled) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const now = new Date();

  for (const entry of entries) {
    if (!entry.zeitVon) continue;

    const dates = getUpcomingDates(entry, now, 30);

    for (const date of dates) {
      for (const offset of settings.offsetsBefore) {
        const triggerDate = new Date(date.getTime() - offset * 60 * 1000);
        if (triggerDate <= now) continue;

        const title =
          offset === 0
            ? `${entry.title} beginnt jetzt`
            : `${entry.title} in ${offset} Min.`;

        const body = [
          entry.zeitVon + (entry.zeitBis ? ` – ${entry.zeitBis}` : ''),
          entry.raum,
        ]
          .filter(Boolean)
          .join(' · ');

        await Notifications.scheduleNotificationAsync({
          content: { title, body: body || undefined },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
      }
    }
  }
}
