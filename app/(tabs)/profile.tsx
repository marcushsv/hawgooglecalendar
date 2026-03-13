import { File, Paths } from 'expo-file-system/next';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "http://10.0.2.2:3000";
const RAUM_BUCHUNG_URL = "https://auth.anny.eu/start-session?entityId=https%3A%2F%2Flogin.haw-hamburg.de%2Frealms%2FHAW-Hamburg&returnTo=https%3A%2F%2Fanny.eu%2Fexplore%2Fhaw-hamburg-hibs"; // ← echte URL anpassen
const MENSA_URL = "https://www.stwhh.de/speiseplan?t=today"
const OUTLOOK_URL = "https://outlook.office365.com"

const Profile = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Passwort ändern
    const [altesPasswort, setAltesPasswort] = useState('');
    const [neuesPasswort, setNeuesPasswort] = useState('');
    const [passwortWdh, setPasswortWdh] = useState('');
    const [showPasswort, setShowPasswort] = useState(false);
    const [exporting, setExporting] = useState(false);

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

    const handleExportICS = async () => {
        setExporting(true);
        try {
            const userId = await SecureStore.getItemAsync('userId');
            if (!userId) { Alert.alert('Fehler', 'Nicht angemeldet.'); return; }

            const res = await fetch(`${API_URL}/entries?userId=${userId}`);
            if (!res.ok) throw new Error('Einträge konnten nicht geladen werden.');
            const entries = await res.json();

            const lines: string[] = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//HAW Kalender//DE',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
            ];

            for (const e of entries) {
                const dateStr = e.datum.slice(0, 10).replace(/-/g, '');
                const start = (e.zeitVon ?? '00:00').replace(':', '');
                const end = (e.zeitBis ?? '01:00').replace(':', '');

                lines.push('BEGIN:VEVENT');
                lines.push(`UID:${e._id}@hawkalender`);
                lines.push(`DTSTART:${dateStr}T${start}00`);
                lines.push(`DTEND:${dateStr}T${end}00`);
                lines.push(`SUMMARY:${e.title}`);
                if (e.notizen) lines.push(`DESCRIPTION:${e.notizen.replace(/\n/g, '\\n')}`);
                if (e.raum) lines.push(`LOCATION:${e.raum}`);
                if (e.wiederholung === 'wöchentlich') lines.push('RRULE:FREQ=WEEKLY');
                if (e.wiederholung === '2-wöchentlich') lines.push('RRULE:FREQ=WEEKLY;INTERVAL=2');
                lines.push('END:VEVENT');
            }

            lines.push('END:VCALENDAR');

            const tempFile = new File(Paths.cache, 'haw-kalender.ics');
            tempFile.write(lines.join('\r\n'));

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(tempFile.uri, {
                    mimeType: 'text/calendar',
                    dialogTitle: 'Kalender exportieren',
                    UTI: 'public.calendar',
                });
            } else {
                Alert.alert('Nicht verfügbar', 'Teilen ist auf diesem Gerät nicht möglich.');
            }
        } catch (e: any) {
            Alert.alert('Fehler', e?.message ?? 'Export fehlgeschlagen.');
        } finally {
            setExporting(false);
        }
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('userId');
        router.push('/login');
    };

    // Gast-Ansicht
    if (!isLoggedIn) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Image source={require("../../assets/images/HAW_Logo.jpg")} style={styles.hawLogo} resizeMode='contain' />
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Kein Account</Text>
                        <Text style={styles.infoText}>Melde dich an um dein Profil zu sehen.</Text>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
                        <Text style={styles.buttonText}>Anmelden</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => router.push('/register')}>
                        <Text style={styles.buttonText}>Registrieren</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Eingeloggt-Ansicht
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Image source={require("../../assets/images/HAW_Logo.jpg")} style={styles.hawLogo} resizeMode='contain' />

                {/* Profildaten */}
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

                {/* Raumbuchung */}
                <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(RAUM_BUCHUNG_URL)}>
                    <Text style={styles.linkCardText}>🏛️  Raumbuchung (Anny)</Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                {/* Essen & Trinken */}
                <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(MENSA_URL)}>
                    <Text style={styles.linkCardText}>🥗  Speisepläne (Mensa)</Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                {/* Outlook */}
                <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(OUTLOOK_URL)}>
                    <Text style={styles.linkCardText}>📧  Outlook </Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                {/* Kalender Export */}
                <TouchableOpacity style={styles.linkCard} onPress={handleExportICS} disabled={exporting}>
                    {exporting
                        ? <ActivityIndicator color="#002E99" />
                        : <Text style={styles.linkCardText}>📅  Kalender exportieren</Text>
                    }
                    <Text style={styles.linkCardArrow}>↓</Text>
                </TouchableOpacity>

                {/* Passwort ändern */}
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

                {/* Logout */}
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
    hawLogo: { width: 120, height: 50, alignSelf: 'flex-end' },
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
});