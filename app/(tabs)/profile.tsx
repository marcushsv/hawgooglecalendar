import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "http://10.0.2.2:3000";
const RAUM_BUCHUNG_URL = "https://auth.anny.eu/start-session?entityId=https%3A%2F%2Flogin.haw-hamburg.de%2Frealms%2FHAW-Hamburg&returnTo=https%3A%2F%2Fanny.eu%2Fexplore%2Fhaw-hamburg-hibs"; // ← echte URL anpassen
const MENSA_URL = "https://www.stwhh.de/speiseplan?t=today"

const Profile = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Passwort ändern
    const [altesPasswort, setAltesPasswort] = useState('');
    const [neuesPasswort, setNeuesPasswort] = useState('');
    const [passwortWdh, setPasswortWdh] = useState('');
    const [showPasswort, setShowPasswort] = useState(false);

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
                    <Text style={styles.linkCardText}>🏛️  Zur Raumbuchung (Anny)</Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                {/* Essen & Trinken */}
                <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(MENSA_URL)}>
                    <Text style={styles.linkCardText}>🥗  Zu den Speiseplänen (Mensa)</Text>
                    <Text style={styles.linkCardArrow}>→</Text>
                </TouchableOpacity>

                {/* Passwort ändern */}
                <TouchableOpacity style={styles.linkCard} onPress={() => setShowPasswort(!showPasswort)}>
                    <Text style={styles.linkCardText}>🔑  Passwort ändern</Text>
                    <Text style={styles.linkCardArrow}>{showPasswort ? '↑' : '→'}</Text>
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