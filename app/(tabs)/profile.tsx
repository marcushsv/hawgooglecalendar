import * as Calendar from 'expo-calendar';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DEFAULT_SETTINGS, NotificationSettings, getNotificationSettings, saveNotificationSettings } from '@/utils/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "http://10.0.2.2:3000";
const RAUM_BUCHUNG_URL = "https://auth.anny.eu/start-session?entityId=https%3A%2F%2Flogin.haw-hamburg.de%2Frealms%2FHAW-Hamburg&returnTo=https%3A%2F%2Fanny.eu%2Fexplore%2Fhaw-hamburg-hibs"; // ← echte URL anpassen
const MENSA_URL = "https://www.stwhh.de/speiseplan?t=today"
const OUTLOOK_URL = "https://outlook.office365.com"

const Profile = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [altesPasswort, setAltesPasswort] = useState('');
    const [neuesPasswort, setNeuesPasswort] = useState('');
    const [passwortWdh, setPasswortWdh] = useState('');
    const [showPasswort, setShowPasswort] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [showNotifSettings, setShowNotifSettings] = useState(false);

    const OFFSET_OPTIONS = [0, 5, 10, 15, 30, 60];

    useEffect(() => {
        const loadUser = async () => {
            const userId = await SecureStore.getItemAsync('userId');
            const token = await SecureStore.getItemAsync('token');
            if (!userId || !token) { setIsLoggedIn(false); return; }
            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) { setUser(data); setIsLoggedIn(true); }
            } catch { setIsLoggedIn(false); }
        };
        loadUser();
        getNotificationSettings().then(setNotifSettings);
    }, []);

    const handlePasswortAendern = async () => {
        if (!altesPasswort || !neuesPasswort || !passwortWdh) {
            Alert.alert('Fehler', 'Bitte alle Felder ausfüllen!'); return;
        }
        if (neuesPasswort !== passwortWdh) {
            Alert.alert('Fehler', 'Neue Passwörter stimmen nicht überein!'); return;
        }
        try {
            const token = await SecureStore.getItemAsync('token');
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ altesPasswort, neuesPasswort }),
            });
            const data = await res.json();
            if (!res.ok) { Alert.alert('Fehler', data.error); return; }
            Alert.alert('Erfolg!', 'Passwort geändert!');
            setAltesPasswort(''); setNeuesPasswort(''); setPasswortWdh('');
            setShowPasswort(false);
        } catch (e: any) {
            Alert.alert('Netzwerkfehler', e?.message);
        }
    };

    const handleExportToCalendar = async () => {
        setExporting(true);
        try {
            const userId = await SecureStore.getItemAsync('userId');
            if (!userId) { Alert.alert('Fehler', 'Nicht angemeldet.'); return; }

            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Berechtigung verweigert', 'Kalender-Zugriff wird benötigt, um Einträge zu exportieren.');
                return;
            }

            const res = await fetch(`${API_URL}/entries?userId=${userId}`);
            if (!res.ok) throw new Error('Einträge konnten nicht geladen werden.');
            const entries = await res.json();

            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

            let hawCal = calendars.find(c => c.title === 'HAW Kalender');
            let calendarId: string;
            if (hawCal) {
                calendarId = hawCal.id;
            } else {
                calendarId = await Calendar.createCalendarAsync({
                    title: 'HAW Kalender',
                    color: '#002E99',
                    entityType: Calendar.EntityTypes.EVENT,
                    source: { isLocalAccount: true, name: 'HAW Kalender', type: 'LOCAL' },
                    name: 'hawkalender',
                    ownerAccount: 'local',
                    accessLevel: Calendar.CalendarAccessLevel.OWNER,
                });
            }

            let added = 0;
            const existing = await Calendar.getEventsAsync([calendarId], new Date(2020, 0, 1), new Date(2030, 0, 1));
            for (const ev of existing) {
                try { await Calendar.deleteEventAsync(ev.id); } catch { /* ignorieren */ }
            }

            for (const e of entries) {
                const [year, month, day] = e.datum.slice(0, 10).split('-').map(Number);
                const [startH, startM] = (e.zeitVon ?? '08:00').split(':').map(Number);
                const [endH, endM] = (e.zeitBis ?? '09:00').split(':').map(Number);

                const startDate = new Date(year, month - 1, day, startH, startM, 0);
                const endDate = new Date(year, month - 1, day, endH, endM, 0);

                const recurrenceRule: Calendar.RecurrenceRule | null =
                    e.wiederholung === 'wöchentlich'
                        ? { frequency: Calendar.Frequency.WEEKLY }
                        : e.wiederholung === '2-wöchentlich'
                        ? { frequency: Calendar.Frequency.WEEKLY, interval: 2 }
                        : null;

                await Calendar.createEventAsync(calendarId, {
                    title: e.title,
                    startDate,
                    endDate,
                    timeZone: 'Europe/Berlin',
                    location: e.raum ?? null,
                    notes: e.notizen ?? '',
                    ...(recurrenceRule ? { recurrenceRule } : {}),
                });
                added++;
            }

            Alert.alert('Erfolg!', `${added} Einträge wurden in "HAW Kalender" exportiert.`);
        } catch (e: any) {
            Alert.alert('Fehler', e?.message ?? 'Export fehlgeschlagen.');
        } finally {
            setExporting(false);
        }
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('userId');
        router.replace('/');
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Image source={require("../../assets/images/HAW_Logo.jpg")} style={styles.hawLogo} resizeMode='contain' />

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Mein Profil</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{user?.vorname} {user?.nachname}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>E-Mail</Text>
                        <Text style={styles.value}>{user?.email}</Text>
                    </View>
                    <View style={[styles.infoRow, { marginBottom: 0 }]}>
                        <Text style={styles.label}>Matrikelnummer</Text>
                        <Text style={styles.value}>{user?.matrikelnummer ?? '-'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(RAUM_BUCHUNG_URL)}>
                    <Text style={styles.linkCardText}>🏛️  Raumbuchung (Anny)</Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(MENSA_URL)}>
                    <Text style={styles.linkCardText}>🥗  Speisepläne (Mensa)</Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(OUTLOOK_URL)}>
                    <Text style={styles.linkCardText}>📧  Outlook </Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkCard} onPress={() => setShowNotifSettings(!showNotifSettings)}>
                    <Text style={styles.linkCardText}>🔔  Benachrichtigungen</Text>
                    <Text style={styles.linkCardArrow}>{showNotifSettings ? '↑' : '↓'}</Text>
                </TouchableOpacity>

                {showNotifSettings && (
                    <View style={styles.card}>
                        <View style={[styles.infoRow, { marginBottom: 12 }]}>
                            <Text style={styles.value}>Benachrichtigungen aktiv</Text>
                            <Switch
                                value={notifSettings.enabled}
                                onValueChange={v => {
                                    const updated = { ...notifSettings, enabled: v };
                                    setNotifSettings(updated);
                                    saveNotificationSettings(updated);
                                }}
                                trackColor={{ false: '#393a3c', true: '#002E99' }}
                                thumbColor="white"
                            />
                        </View>
                        <Text style={[styles.label, { marginBottom: 8, paddingHorizontal: 4 }]}>Erinnerung vor Event-Start</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {OFFSET_OPTIONS.map(min => {
                                const active = notifSettings.offsetsBefore.includes(min);
                                return (
                                    <TouchableOpacity
                                        key={min}
                                        style={[styles.offsetChip, active && styles.offsetChipActive]}
                                        onPress={() => {
                                            const offsets = active
                                                ? notifSettings.offsetsBefore.filter(o => o !== min)
                                                : [...notifSettings.offsetsBefore, min].sort((a, b) => a - b);
                                            const updated = { ...notifSettings, offsetsBefore: offsets };
                                            setNotifSettings(updated);
                                            saveNotificationSettings(updated);
                                        }}
                                    >
                                        <Text style={[styles.offsetChipText, active && styles.offsetChipTextActive]}>
                                            {min === 0 ? 'Pünktlich' : `${min} Min.`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.linkCard} onPress={handleExportToCalendar} disabled={exporting}>
                    {exporting
                        ? <ActivityIndicator color="#002E99" />
                        : <Text style={styles.linkCardText}>📅  Kalender exportieren</Text>
                    }
                    <Text style={styles.linkCardArrow}>↓</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkCard} onPress={() => setShowPasswort(!showPasswort)}>
                    <Text style={styles.linkCardText}>🔑  Passwort ändern</Text>
                    <Text style={styles.linkCardArrow}>{showPasswort ? '↑' : '↓'}</Text>
                </TouchableOpacity>

                {showPasswort && (
                    <View style={styles.card}>
                        <TextInput style={styles.input} placeholder="Altes Passwort" placeholderTextColor="#6A8FAD" secureTextEntry value={altesPasswort} onChangeText={setAltesPasswort} />
                        <TextInput style={styles.input} placeholder="Neues Passwort" placeholderTextColor="#6A8FAD" secureTextEntry value={neuesPasswort} onChangeText={setNeuesPasswort} />
                        <TextInput style={[styles.input, { marginBottom: 0 }]} placeholder="Neues Passwort wiederholen" placeholderTextColor="#6A8FAD" secureTextEntry value={passwortWdh} onChangeText={setPasswortWdh} />
                        <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={handlePasswortAendern}>
                            <Text style={styles.buttonText}>Speichern</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={[styles.button, styles.buttonLogout]} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Abmelden</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: { padding: 20 },
    hawLogo: { width: 120, height: 60, alignSelf: 'flex-end' },
    card: { backgroundColor: '#9FBDDB', borderRadius: 15, padding: 16, marginTop: 16 },
    cardTitle: { color: '#002E99', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
    infoRow: { backgroundColor: '#C5D7EA', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
    label: { color: '#6A8FAD', fontSize: 13 },
    value: { color: '#002E99', fontWeight: '500' },
    infoText: { color: '#002E99', textAlign: 'center', marginBottom: 8 },
    linkCard: { backgroundColor: '#9FBDDB', borderRadius: 15, padding: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    linkCardText: { color: '#002E99', fontWeight: '500' },
    linkCardArrow: { color: '#002E99', fontSize: 18 },
    input: { backgroundColor: '#C5D7EA', borderRadius: 20, padding: 10, paddingHorizontal: 16, color: '#002E99', marginBottom: 10 },
    button: { backgroundColor: '#9FBDDB', borderRadius: 20, padding: 14, alignItems: 'center', marginTop: 16, width: '60%', alignSelf: 'center' },
    buttonSecondary: { backgroundColor: '#C5D7EA' },
    buttonLogout: { backgroundColor: '#C5D7EA', marginBottom: 40 },
    buttonText: { color: '#002E99', fontSize: 16, fontWeight: '600' },
    offsetChip: { backgroundColor: '#C5D7EA', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
    offsetChipActive: { backgroundColor: '#002E99' },
    offsetChipText: { color: '#002E99', fontSize: 13, fontWeight: '500' },
    offsetChipTextActive: { color: 'white' },
});