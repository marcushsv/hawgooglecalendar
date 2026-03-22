import { getUserId } from '@/utils/auth';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, Image, ScrollView, StyleSheet,
    Switch, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const FACHSEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

interface CourseEntry {
    _id: string;
    title: string;
    fachsemester: number;
    studiengang: string;
    datum: string;
    zeitVon?: string;
    zeitBis?: string;
    raum?: string;
    dozent?: string;
    wichtig?: boolean;
    notizen?: string;
    wiederholung?: string;
}

const CARD_COLORS: Record<string, string> = {
    'nie': '#9FDBBD',
    'wöchentlich': '#9FBDDB',
    '2-wöchentlich': '#DDD4A8',
};

const AddEvent: React.FC = () => {
    const API_URL = "http://10.0.2.2:3000";
    const [activeTab, setActiveTab] = useState<'kurssuche' | 'eigener'>('kurssuche');

    // Kurssuche
    const [fachsemester, setFachsemester] = useState<number | null>(null);
    const [studiengang, setStudiengang] = useState('');
    const [courseResults, setCourseResults] = useState<CourseEntry[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    // Eigener Eintrag
    const [name, setName] = useState('');
    const todayDisplay = (() => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    })();
    const [datum, setDatum] = useState(todayDisplay);
    const [wichtig, setWichtig] = useState(false);
    const [notiz, setNotiz] = useState('');
    const [raum, setRaum] = useState('');
    const [dozent, setDozent] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [wiederholung, setWiederholung] = useState<'nie' | 'wöchentlich' | '2-wöchentlich'>('nie');

    const handleKurssuche = async () => {
        if (!fachsemester || !studiengang.trim()) {
            Alert.alert("Fehler", "Bitte Fachsemester und Studiengang auswählen!");
            return;
        }
        setSearching(true);
        setHasSearched(false);
        setCourseResults([]);
        try {
            const res = await fetch(
                `${API_URL}/course-entries?fachsemester=${fachsemester}&studiengang=${encodeURIComponent(studiengang.trim())}`
            );
            const data = await res.json();
            setCourseResults(data);
            setHasSearched(true);
        } catch (e: any) {
            Alert.alert("Netzwerkfehler", e?.message ?? String(e));
        } finally {
            setSearching(false);
        }
    };

    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const findConflicts = (datum: string, zeitVon: string, zeitBis: string, entries: any[]) =>
        entries.filter(e => {
            if (!e.zeitVon || !e.zeitBis) return false;
            if (e.datum.slice(0, 10) !== datum.slice(0, 10)) return false;
            return toMinutes(zeitVon) < toMinutes(e.zeitBis) && toMinutes(zeitBis) > toMinutes(e.zeitVon);
        });

    const handleAddCourseEntry = async (course: CourseEntry) => {
        const userId = await getUserId();
        setAddingId(course._id);
        try {
            const payload = {
                title: course.title,
                datum: course.datum,
                zeitVon: course.zeitVon,
                zeitBis: course.zeitBis,
                raum: course.raum,
                dozent: course.dozent,
                wichtig: course.wichtig ?? false,
                notizen: course.notizen,
                wiederholung: course.wiederholung ?? 'nie',
                userId,
            };

            const doAdd = async () => {
                const res = await fetch(`${API_URL}/entries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) { Alert.alert("Fehler", "Konnte nicht hinzugefügt werden."); return; }
                Alert.alert("Hinzugefügt!", `"${course.title}" wurde deinem Kalender hinzugefügt.`);
            };

            if (course.zeitVon && course.zeitBis) {
                const existingRes = await fetch(`${API_URL}/entries?userId=${userId}`);
                const existingEntries = existingRes.ok ? await existingRes.json() : [];
                const conflicts = findConflicts(course.datum, course.zeitVon, course.zeitBis, existingEntries);
                if (conflicts.length > 0) {
                    const names = conflicts.map((c: any) => `• ${c.title} (${c.zeitVon}–${c.zeitBis})`).join('\n');
                    setAddingId(null);
                    Alert.alert(
                        'Zeitkonflikt',
                        `Dieser Eintrag überschneidet sich mit:\n${names}`,
                        [
                            { text: 'Ändern', style: 'cancel' },
                            { text: 'Trotzdem hinzufügen', onPress: doAdd },
                        ]
                    );
                    return;
                }
            }

            await doAdd();
        } catch (e: any) {
            Alert.alert("Netzwerkfehler", e?.message ?? String(e));
        } finally {
            setAddingId(null);
        }
    };

    const handleSaveEigener = async () => {
        if (!name || !datum || !startTime || !endTime) {
            Alert.alert("Fehler", "Name und Datum/Uhrzeit sind Pflichtfelder!");
            return;
        }
        const userId = await getUserId();
        const [dd, mm, yyyy] = datum.split('.');
        const isoDate = `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}`;
        const payload = {
            title: name,
            datum: isoDate,
            wichtig,
            notizen: notiz,
            raum,
            dozent,
            zeitVon: startTime,
            zeitBis: endTime,
            wiederholung,
            userId,
        };

        const doSave = async () => {
            try {
                const res = await fetch(`${API_URL}/entries`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const text = await res.text();
                if (!res.ok) { Alert.alert("Fehler", text); return; }
                Alert.alert("Gespeichert!", "Eintrag wurde erstellt.");
                setName(''); setDatum(todayDisplay); setWichtig(false); setNotiz('');
                setRaum(''); setDozent(''); setStartTime(''); setEndTime(''); setWiederholung('nie');
            } catch (e: any) {
                Alert.alert("Netzwerkfehler", e?.message ?? String(e));
            }
        };

        try {
            const existingRes = await fetch(`${API_URL}/entries?userId=${userId}`);
            const existingEntries = existingRes.ok ? await existingRes.json() : [];
            const conflicts = findConflicts(isoDate, startTime, endTime, existingEntries);
            if (conflicts.length > 0) {
                const names = conflicts.map((c: any) => `• ${c.title} (${c.zeitVon}–${c.zeitBis})`).join('\n');
                Alert.alert(
                    'Zeitkonflikt',
                    `Dieser Eintrag überschneidet sich mit:\n${names}`,
                    [
                        { text: 'Ändern', style: 'cancel' },
                        { text: 'Trotzdem hinzufügen', onPress: doSave },
                    ]
                );
                return;
            }
        } catch {
            // if conflict check fails, proceed with save
        }

        await doSave();
    };

    const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return WEEKDAYS[d.getDay()];
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Image
                    source={require("../../assets/images/HAW_Logo.jpg")}
                    style={styles.hawLogo}
                    resizeMode='contain'
                />
                <View style={{ height: 15 }}></View> 
                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
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
                                <Text style={styles.pickerLabel}>Fachsemester</Text>
                                <View style={styles.pickerRow}>
                                    {FACHSEMESTER_OPTIONS.map(sem => (
                                        <TouchableOpacity
                                            key={sem}
                                            style={[styles.semOption, fachsemester === sem && styles.semOptionActive]}
                                            onPress={() => setFachsemester(sem)}
                                        >
                                            <Text style={[styles.semOptionText, fachsemester === sem && styles.semOptionTextActive]}>
                                                {sem}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Studiengang (z.B. MS, MT)"
                                    placeholderTextColor="#6A8FAD"
                                    value={studiengang}
                                    onChangeText={setStudiengang}
                                    autoCapitalize="characters"
                                />

                                {/* Suchergebnisse */}
                                {searching && (
                                    <ActivityIndicator color="#002E99" style={{ marginTop: 12 }} />
                                )}

                                {hasSearched && !searching && courseResults.length === 0 && (
                                    <Text style={styles.noResultsText}>
                                        Keine Einträge gefunden.
                                    </Text>
                                )}

                                {courseResults.length > 0 && (
                                    <View style={styles.resultsList}>
                                        {courseResults.map(course => (
                                            <View key={course._id} style={[styles.resultItem, { backgroundColor: CARD_COLORS[course.wiederholung || 'nie'] || '#C5D7EA' }]}>
                                                <View style={styles.resultInfo}>
                                                    <Text style={styles.resultTitle}>{course.title}</Text>
                                                    <Text style={styles.resultMeta}>
                                                        {formatDate(course.datum)}
                                                        {course.zeitVon && course.zeitBis
                                                            ? `  ·  ${course.zeitVon} – ${course.zeitBis}`
                                                            : ''}
                                                    </Text>
                                                    {(course.raum || course.dozent) && (
                                                        <Text style={styles.resultMeta}>
                                                            {[course.raum, course.dozent].filter(Boolean).join('  ·  ')}
                                                        </Text>
                                                    )}
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.addButton}
                                                    onPress={() => handleAddCourseEntry(course)}
                                                    disabled={addingId === course._id}
                                                >
                                                    {addingId === course._id
                                                        ? <ActivityIndicator color="white" size="small" />
                                                        : <Text style={styles.addButtonText}>+</Text>
                                                    }
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Eigener Eintrag */}
                        {activeTab === 'eigener' && (
                            <View>
                                <TextInput style={styles.input} placeholder="Modulname" placeholderTextColor="#6A8FAD" value={name} onChangeText={setName} />
                                <TextInput style={styles.input} placeholder="Datum (TT.MM.JJJJ)" placeholderTextColor="#6A8FAD" value={datum} onChangeText={setDatum} />
                                <TextInput style={styles.input} placeholder="Startzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={startTime} onChangeText={setStartTime} />
                                <TextInput style={styles.input} placeholder="Endzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={endTime} onChangeText={setEndTime} />
                                <TextInput style={styles.input} placeholder="Raum (optional)" placeholderTextColor="#6A8FAD" value={raum} onChangeText={setRaum} />
                                <TextInput style={styles.input} placeholder="Dozent (optional)" placeholderTextColor="#6A8FAD" value={dozent} onChangeText={setDozent} />
                                <Text style={styles.pickerLabel}>Wiederholung</Text>
                                <View style={styles.pickerRow}>
                                    {(['nie', 'wöchentlich', '2-wöchentlich'] as const).map(option => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[styles.pickerOption, wiederholung === option && styles.pickerOptionActive]}
                                            onPress={() => setWiederholung(option)}
                                        >
                                            <Text style={[styles.pickerOptionText, wiederholung === option && styles.pickerOptionTextActive]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Wichtig</Text>
                                    <Switch
                                        value={wichtig}
                                        onValueChange={setWichtig}
                                        trackColor={{ false: '#393a3c', true: '#002E99' }}
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

                    <TouchableOpacity
                        style={styles.button}
                        onPress={activeTab === 'kurssuche' ? handleKurssuche : handleSaveEigener}
                    >
                        <Text style={styles.buttonText}>
                            {activeTab === 'kurssuche' ? 'Suchen' : 'Erstellen'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default AddEvent;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: { flex: 1, padding: 20, paddingTop: 5 },
    hawLogo: { width: 120, height: 60, alignSelf: 'flex-end' },
    scrollArea: { flex: 1, marginTop: 20 },
    card: {
        backgroundColor: '#9FBDDB',
        borderRadius: 15,
        padding: 16,
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
    pickerLabel: {
        color: '#002E99',
        fontWeight: '500',
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    pickerRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
    },
    semOption: {
        flex: 1,
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        paddingVertical: 8,
        alignItems: 'center',
    },
    semOptionActive: {
        backgroundColor: '#002E99',
    },
    semOptionText: {
        color: '#002E99',
        fontSize: 13,
        fontWeight: '600',
    },
    semOptionTextActive: {
        color: 'white',
    },
    noResultsText: {
        color: '#002E99',
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
    resultsList: {
        marginTop: 12,
        gap: 8,
        backgroundColor: '#7A9DC0',
        borderRadius: 12,
        padding: 10,
    },
    resultItem: {
        backgroundColor: '#C5D7EA',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        color: '#002E99',
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 2,
    },
    resultMeta: {
        color: '#4A6A8A',
        fontSize: 12,
    },
    addButton: {
        backgroundColor: '#002E99',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 22,
        lineHeight: 24,
        fontWeight: '400',
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
        height: 80,
        textAlignVertical: 'top',
    },
    pickerOption: {
        flex: 1,
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        paddingVertical: 8,
        alignItems: 'center',
    },
    pickerOptionActive: {
        backgroundColor: '#002E99',
    },
    pickerOptionText: {
        color: '#002E99',
        fontSize: 12,
        fontWeight: '500',
    },
    pickerOptionTextActive: {
        color: 'white',
    },
    button: {
        backgroundColor: '#9FBDDB',
        borderRadius: 20,
        padding: 14,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
        width: '60%',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#002E99',
        fontSize: 16,
        fontWeight: '600',
    },
});
