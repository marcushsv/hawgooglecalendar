import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminLogin = () => {
    const API_URL = "http://10.0.2.2:3000";
    const [email, setEmail] = useState('');
    const [passwort, setPasswort] = useState('');

    const handleAdminLogin = async () => {
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

            if (data.user.role !== 'admin') {
                Alert.alert('Kein Zugriff', 'Dieser Account hat keine Admin-Rechte.');
                return;
            }

            if (Platform.OS === 'web') {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user._id);
                localStorage.setItem('role', data.user.role);
            } else {
                await SecureStore.setItemAsync('token', data.token);
                await SecureStore.setItemAsync('userId', data.user._id);
                await SecureStore.setItemAsync('role', data.user.role);
            }

            Alert.alert('Willkommen!', `Admin-Login erfolgreich.`);
            router.push('/admin');
        } catch (e: any) {
            Alert.alert('Netzwerkfehler', e?.message);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.topBar}>
                                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                                        <Text style={styles.backArrow}>‹</Text>
                                        <Text style={styles.backText}>Zurück</Text>
                                    </TouchableOpacity>
                <Image
                    source={require("../assets/images/HAW_Logo.jpg")}
                    style={styles.hawLogo}
                    resizeMode='contain'
                />
                </View>
                <View style={{ height: 55 }} />
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Admin Login</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Admin E-Mail"
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

                <View style={{ height: 20 }} />

                <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
                    <Text style={styles.buttonText}>Admin Login</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

export default AdminLogin;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    backArrow: { fontSize: 28, color: '#002E99', lineHeight: 30 },
    backText: { color: '#002E99', fontSize: 15, fontWeight: '500', marginLeft: 2 },
    backLink: {
        color: '#6A8FAD',
        textAlign: 'center',
        marginTop: 16,
    },
    container: {
        padding: 20,
        backgroundColor: 'white',
        flex: 1,
    },
    hawLogo: {
        width: 120,
        height: 50,
        alignSelf: 'flex-end',
    },
    button: {
        backgroundColor: '#002E99',
        borderRadius: 20,
        padding: 14,
        alignItems: 'center',
        marginTop: 24,
        width: '60%',
        alignSelf: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#9FBDDB',
        borderRadius: 15,
        padding: 16,
        marginTop: 20,
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
});
