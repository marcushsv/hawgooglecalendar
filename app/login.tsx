import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Login = () => {
    const API_URL = "http://10.0.2.2:3000";
    const [email, setEmail] = useState('');
    const [passwort, setPasswort] = useState('');

    const handleLogin = async () => {
        if (!email || !passwort) {
            Alert.alert('Fehler', 'Bitte alle Felder ausfüllen!');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, passwort }),
            });
            const data = await res.json();
            if (!res.ok) { Alert.alert('Fehler', data.error); return; }
            const saveToken = async (token: string, userId: string, role: string) => {
                if (Platform.OS === 'web') {
                    localStorage.setItem('token', token);
                    localStorage.setItem('userId', userId);
                    localStorage.setItem('role', role);
                } else {
                    await SecureStore.setItemAsync('token', token);
                    await SecureStore.setItemAsync('userId', userId);
                    await SecureStore.setItemAsync('role', role);
                }
            };
            Alert.alert('Willkommen!', `Hallo ${data.user.vorname}!`);
            await saveToken(data.token, data.user._id, data.user.role);
            router.push('/home');
        } catch (e: any) {
            Alert.alert('Netzwerkfehler', e?.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Top-Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backArrow}>‹</Text>
                        <Text style={styles.backText}>Zurück</Text>
                    </TouchableOpacity>
                    <Image
                        source={require('../assets/images/HAW_Logo.jpg')}
                        style={styles.hawLogo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.spacer} />

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Login</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="HAW E-Mail"
                        placeholderTextColor="#6A8FAD"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={[styles.input, { marginBottom: 0 }]}
                        placeholder="Passwort"
                        placeholderTextColor="#6A8FAD"
                        secureTextEntry
                        value={passwort}
                        onChangeText={setPasswort}
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Einloggen</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.registerLink}>Noch kein Account? Registrieren</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/adminLogin')}>
                    <Text style={styles.adminLink}>Admin Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default Login;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 20 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    backArrow: { fontSize: 28, color: '#002E99', lineHeight: 30 },
    backText: { color: '#002E99', fontSize: 15, fontWeight: '500', marginLeft: 2 },
    hawLogo: { width: 120, height: 50 },
    spacer: { height: 100 },
    card: {
        backgroundColor: '#9FBDDB',
        borderRadius: 15,
        padding: 16,
    },
    cardTitle: {
        color: '#002E99',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        padding: 10,
        paddingHorizontal: 16,
        color: '#002E99',
        marginBottom: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#9FBDDB',
        borderRadius: 20,
        padding: 14,
        alignItems: 'center',
        marginTop: 45,
        width: '60%',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#002E99',
        fontSize: 16,
        fontWeight: '600',
    },
    registerLink: {
        color: '#002E99',
        textAlign: 'center',
        marginTop: 35,
    },
    guestLink: {
        color: '#002E99',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    adminLink: {
        color: '#002E99',
        textAlign: 'center',
        marginTop: 24,
        fontSize: 13,
        opacity: 0.6,
    },
});
