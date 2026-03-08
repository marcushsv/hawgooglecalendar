import { getUserId } from '@/utils/auth';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const AddEvent: React.FC = () => {
    const API_URL = "http://localhost:3000";
    const [activeTab, setActiveTab] = useState<'kurssuche' | 'eigener'>('kurssuche');


    // Kurssuche
    const [semester, setSemester] = useState('');
    const [fach, setFach] = useState('');

    // Eigener Eintrag
    const [name, setName] = useState('');
    const [datum, setDatum] = useState('');
    const [wichtig, setWichtig] = useState(false);
    const [notiz, setNotiz] = useState('');
    const [raum, setRaum] = useState('');
    const [dozent, setDozent] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleSave = async () => {
        const userId = await getUserId(); // 👈
        if (activeTab === 'kurssuche') {
            if (!semester || !fach) {
                Alert.alert("Fehler", "Semester und Fach sind Pflichtfelder!");
                return;
            }
            // deine Kurssuche-Logik
        } else {
            if (!name || !datum || !startTime || !endTime) {
                Alert.alert("Fehler", "Name und Datum/Uhrzeit sind Pflichtfelder!");
                return;
            }
            const payload = {
                title: name,
                datum: datum,
                wichtig,
                notizen: notiz,
                raum: raum,
                dozent: dozent,
                zeitVon: startTime,
                zeitBis: endTime,
                userId: userId,
            };
            try {
                const res = await fetch(`${API_URL}/entries`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const text = await res.text();
                if (!res.ok) { Alert.alert("Fehler", text); return; }
                Alert.alert("Gespeichert!", "Eintrag wurde erstellt.");
                setName(''); setDatum(''); setWichtig(false); setNotiz(''); setRaum(''); setDozent(''); setStartTime(''); setEndTime('');
            } catch (e: any) {
                Alert.alert("Netzwerkfehler", e?.message ?? String(e));
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Image
                    source={require("../../assets/images/HAW_Logo.jpg")}
                    style={styles.hawLogo}
                    resizeMode='contain'
                />

                <View style={styles.card}>
                    {/* Tabs */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'kurssuche' && styles.tabActive]}
                            onPress={() => setActiveTab('kurssuche')}
                        >
                            <Text style={[styles.tabText, activeTab === 'kurssuche' && styles.tabTextActive]}>
                                Kurssuche
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'eigener' && styles.tabActive]}
                            onPress={() => setActiveTab('eigener')}
                        >
                            <Text style={[styles.tabText, activeTab === 'eigener' && styles.tabTextActive]}>
                                Eigener Eintrag
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Kurssuche */}
                    {activeTab === 'kurssuche' && (
                        <View>
                            <TextInput style={styles.input} placeholder="Semester" placeholderTextColor="#6A8FAD" value={semester} onChangeText={setSemester} />
                            <TextInput style={styles.input} placeholder="Fach" placeholderTextColor="#6A8FAD" value={fach} onChangeText={setFach} />
                        </View>
                    )}

                    {/* Eigener Eintrag */}
                    {activeTab === 'eigener' && (
                        <View>
                            <TextInput style={styles.input} placeholder="Modulname" placeholderTextColor="#6A8FAD" value={name} onChangeText={setName} />
                            <TextInput style={styles.input} placeholder="Datum" placeholderTextColor="#6A8FAD" value={datum} onChangeText={setDatum} />
                                    <TextInput style={styles.input} placeholder="Startzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={startTime} onChangeText={setStartTime} />
        <TextInput style={styles.input} placeholder="Endzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={endTime} onChangeText={setEndTime} />
        <TextInput style={styles.input} placeholder="Raum (optional)" placeholderTextColor="#6A8FAD" value={raum} onChangeText={setRaum} />
        <TextInput style={styles.input} placeholder="Dozent (optional)" placeholderTextColor="#6A8FAD" value={dozent} onChangeText={setDozent} />
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Wichtig</Text>
                                <Switch
                                    value={wichtig}
                                    onValueChange={setWichtig}
                                    trackColor={{ false: '#C5D7EA', true: '#002E99' }}
                                    thumbColor="white"
                                />
                            </View>
                            <TextInput
                                style={styles.notizInput}
                                placeholder="Notiz:"
                                placeholderTextColor="#6A8FAD"
                                multiline
                                value={notiz}
                                onChangeText={setNotiz}
                            />
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>
                        {activeTab === 'kurssuche' ? 'Suchen' : 'Erstellen'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddEvent;

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { padding: 20, backgroundColor: 'white' },
    hawLogo: { width: 120, height: 50, alignSelf: 'flex-end' },
    card: {
        backgroundColor: '#9FBDDB',
        borderRadius: 15,
        padding: 16,
        marginTop: 20,
    },
    tabRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    tab: {
        flex: 1,
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        padding: 10,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: '#002E99',
    },
    tabText: {
        color: '#002E99',
        fontWeight: '500',
    },
    tabTextActive: {
        color: 'white',
    },
    input: {
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        padding: 10,
        paddingHorizontal: 16,
        color: '#002E99',
        marginBottom: 10,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    switchLabel: {
        color: '#002E99',
    },
    notizInput: {
        backgroundColor: '#C5D7EA',
        borderRadius: 15,
        padding: 12,
        color: '#002E99',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#9FBDDB',
        borderRadius: 20,
        padding: 14,
        alignItems: 'center',
        marginTop: 24,
        width: '60%',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#002E99',
        fontSize: 16,
        fontWeight: '600',
    },
});