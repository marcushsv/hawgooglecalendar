import { getUserId } from '@/utils/auth';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

const CARD_COLORS: Record<string, string> = {
    'nie': '#9FDBBD',
    'wöchentlich': '#9FBDDB',
    '2-wöchentlich': '#DDD4A8',
};
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 - 18:00
const GRID_START = 8;
const CELL_HEIGHT = 70;
const GRID_HEIGHT = (HOURS.length - 1) * CELL_HEIGHT;
const API_URL = "http://10.0.2.2:3000";

// Gibt den Montag der Woche zurück, die `date` enthält
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
};

// Gibt KW-Nummer zurück
const getCalendarWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const padTwo = (n: number) => String(n).padStart(2, '0');

// YYYY-MM-DD → DD.MM.YYYY
const isoToDisplay = (iso: string) => {
    if (!iso || iso.length < 10) return iso;
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}.${m}.${y}`;
};

// DD.MM.YYYY → YYYY-MM-DD
const displayToISO = (display: string) => {
    const parts = display.split('.');
    if (parts.length !== 3) return display;
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const toDecimalHour = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h + m / 60;
};

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const overlapsTime = (a: any, b: any) =>
    toMin(a.zeitVon) < toMin(b.zeitBis) && toMin(a.zeitBis) > toMin(b.zeitVon);

// Returns layout info for each entry: colIndex and totalCols within its overlap group
const computeDayLayout = (dayEntries: any[]): { entry: any; colIndex: number; totalCols: number }[] => {
    if (dayEntries.length === 0) return [];

    // Union-Find to group overlapping entries into connected components
    const parent = dayEntries.map((_, i) => i);
    const find = (i: number): number => parent[i] === i ? i : (parent[i] = find(parent[i]));
    const union = (a: number, b: number) => { parent[find(a)] = find(b); };
    for (let i = 0; i < dayEntries.length; i++)
        for (let j = i + 1; j < dayEntries.length; j++)
            if (overlapsTime(dayEntries[i], dayEntries[j])) union(i, j);

    // Build groups
    const groups = new Map<number, number[]>();
    for (let i = 0; i < dayEntries.length; i++) {
        const root = find(i);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root)!.push(i);
    }

    const result: { entry: any; colIndex: number; totalCols: number }[] = new Array(dayEntries.length);

    groups.forEach(group => {
        group.sort((a, b) => toMin(dayEntries[a].zeitVon) - toMin(dayEntries[b].zeitVon));
        const lanes: number[][] = [];
        const entryLane: Record<number, number> = {};
        for (const i of group) {
            let placed = false;
            for (let l = 0; l < lanes.length; l++) {
                if (!lanes[l].some(j => overlapsTime(dayEntries[i], dayEntries[j]))) {
                    lanes[l].push(i);
                    entryLane[i] = l;
                    placed = true;
                    break;
                }
            }
            if (!placed) { entryLane[i] = lanes.length; lanes.push([i]); }
        }
        const totalCols = lanes.length;
        for (const i of group) result[i] = { entry: dayEntries[i], colIndex: entryLane[i], totalCols };
    });

    return result;
};

// Prüft ob ein Entry an einem bestimmten Tag (dayDate) gezeigt werden soll
const isEntryOnDay = (entry: any, dayDate: Date): boolean => {
    const entryDate = new Date(entry.datum);
    entryDate.setHours(0, 0, 0, 0);
    const target = new Date(dayDate);
    target.setHours(0, 0, 0, 0);

    if (!entry.wiederholung || entry.wiederholung === 'nie') {
        return entryDate.getTime() === target.getTime();
    }

    // Wiederkehrend: gleicher Wochentag, Starttag vor oder gleich target
    if (entryDate.getDay() !== target.getDay()) return false;
    if (entryDate > target) return false;

    if (entry.wiederholung === 'wöchentlich') return true;

    if (entry.wiederholung === '2-wöchentlich') {
        const diffWeeks = Math.round(
            (target.getTime() - entryDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        return diffWeeks % 2 === 0;
    }

    return false;
};

const Stundenplan = () => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);

    // Berechnung der aktuellen Wochentage (Mo-Fr)
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const weekStart = getWeekStart(baseDate);
    const weekDates = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });
    const kw = getCalendarWeek(weekStart);
    const weekLabel = `KW ${kw}  ·  ${padTwo(weekDates[0].getDate())}.${padTwo(weekDates[0].getMonth() + 1)} – ${padTwo(weekDates[4].getDate())}.${padTwo(weekDates[4].getMonth() + 1)}`;

    // Edit-Modal State
    const [editVisible, setEditVisible] = useState(false);
    const [editId, setEditId] = useState('');
    const [editName, setEditName] = useState('');
    const [editDatum, setEditDatum] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editRaum, setEditRaum] = useState('');
    const [editDozent, setEditDozent] = useState('');
    const [editWichtig, setEditWichtig] = useState(false);
    const [editNotiz, setEditNotiz] = useState('');
    const [editWiederholung, setEditWiederholung] = useState<'nie' | 'wöchentlich' | '2-wöchentlich'>('nie');

    useFocusEffect(useCallback(() => {
        const load = async () => {
            setLoading(true);
            const userId = await getUserId();
            fetch(`${API_URL}/entries?userId=${userId}`)
                .then(r => r.json())
                .then(data => { setEntries(data); setLoading(false); })
                .catch(() => setLoading(false));
        };
        load();
    }, []));

    const deleteEntry = (id: string) => {
        fetch(`${API_URL}/entries/${id}`, { method: 'DELETE' })
            .then(() => {
                setEntries(prev => prev.filter(e => e._id !== id));
                setEditVisible(false);
            })
            .catch(console.error);
    };

    const openEdit = (entry: any) => {
        setEditId(entry._id);
        setEditName(entry.title ?? '');
        setEditDatum(entry.datum ? isoToDisplay(entry.datum.slice(0, 10)) : '');
        setEditStartTime(entry.zeitVon ?? '');
        setEditEndTime(entry.zeitBis ?? '');
        setEditRaum(entry.raum ?? '');
        setEditDozent(entry.dozent ?? '');
        setEditWichtig(entry.wichtig ?? false);
        setEditNotiz(entry.notizen ?? '');
        setEditWiederholung(entry.wiederholung ?? 'nie');
        setEditVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editName || !editDatum || !editStartTime || !editEndTime) {
            Alert.alert('Fehler', 'Name und Datum/Uhrzeit sind Pflichtfelder!');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/entries/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editName,
                    datum: displayToISO(editDatum),
                    zeitVon: editStartTime,
                    zeitBis: editEndTime,
                    raum: editRaum,
                    dozent: editDozent,
                    wichtig: editWichtig,
                    notizen: editNotiz,
                    wiederholung: editWiederholung,
                }),
            });
            if (!res.ok) { Alert.alert('Fehler', await res.text()); return; }
            const updated = await res.json();
            setEntries(prev => prev.map(e => e._id === editId ? updated : e));
            setEditVisible(false);
        } catch (e: any) {
            Alert.alert('Netzwerkfehler', e?.message ?? String(e));
        }
    };

    const confirmDeleteFromEdit = () => {
        Alert.alert('Eintrag löschen', `"${editName}" wirklich löschen?`, [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Löschen', style: 'destructive', onPress: () => deleteEntry(editId) },
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
                <Image
                    source={require("../../assets/images/HAW_Logo.jpg")}
                    style={styles.hawLogo}
                    resizeMode='contain'
                />
                {/* Wochennavigation */}
                <View style={styles.weekNav}>
                    <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset(w => w - 1)}>
                        <Text style={styles.weekNavArrow}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setWeekOffset(0)}>
                        <Text style={styles.weekLabel}>{weekLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset(w => w + 1)}>
                        <Text style={styles.weekNavArrow}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator color="#002E99" style={{ marginTop: 20 }} />
            ) : (
                <ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <View style={styles.grid}>
                            {/* Tag-Header mit Datum */}
                            <View style={styles.headerRow}>
                                <View style={styles.timeCell} />
                                {DAYS.map((d, i) => {
                                    const date = weekDates[i];
                                    const isToday =
                                        weekOffset === 0 &&
                                        date.getDate() === new Date().getDate() &&
                                        date.getMonth() === new Date().getMonth();
                                    return (
                                        <View key={d} style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
                                            <Text style={[styles.dayHeaderText, isToday && styles.dayHeaderTextToday]}>{d}</Text>
                                            <Text style={[styles.dayDateText, isToday && styles.dayHeaderTextToday]}>
                                                {padTwo(date.getDate())}.{padTwo(date.getMonth() + 1)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Inhalt: Zeitachse + Tages-Spalten */}
                            <View style={styles.contentRow}>
                                {/* Zeitlabels */}
                                <View style={styles.timeColumn}>
                                    {HOURS.map(hour => (
                                        <View key={hour} style={styles.timeCell}>
                                            <Text style={styles.timeText}>{hour}:00</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Eine Spalte pro Tag */}
                                {weekDates.map((dayDate, dayIndex) => {
                                    const dayEntries = entries.filter(
                                        e => isEntryOnDay(e, dayDate) && e.zeitVon && e.zeitBis
                                    );
                                    return (
                                        <View key={dayIndex} style={[styles.dayColumn, { height: GRID_HEIGHT }]}>
                                            {HOURS.slice(0, -1).map(hour => (
                                                <View
                                                    key={hour}
                                                    style={[styles.hourLine, { top: (hour - GRID_START) * CELL_HEIGHT }]}
                                                />
                                            ))}
                                            {computeDayLayout(dayEntries).map(({ entry: e, colIndex, totalCols }) => {
                                                const start = toDecimalHour(e.zeitVon);
                                                const end = toDecimalHour(e.zeitBis);
                                                const top = (start - GRID_START) * CELL_HEIGHT;
                                                const height = (end - start) * CELL_HEIGHT - 1;
                                                const slotWidth = (86) / totalCols;
                                                const left = 2 + colIndex * slotWidth;
                                                const width = slotWidth - 1;
                                                return (
                                                    <Pressable key={e._id} onLongPress={() => openEdit(e)} style={[styles.eventCard, { top, height, left, width, backgroundColor: CARD_COLORS[e.wiederholung ?? 'nie'] }]}>
                                                        <Text style={[styles.eventTitle, e.wichtig && { color: '#E67E22' }]} numberOfLines={2}>{e.title}</Text>
                                                        {e.raum ? <Text style={styles.eventSub}>{e.raum}</Text> : null}
                                                        <Text style={styles.eventSub}>{e.zeitVon} - {e.zeitBis}</Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>
                </ScrollView>
            )}

            {/* Edit-Modal */}
            <Modal visible={editVisible} animationType="slide" transparent={false} onRequestClose={() => setEditVisible(false)}>
                <SafeAreaView style={styles.modalSafe}>
                    <ScrollView style={styles.modalContainer}>
                        <Image
                            source={require("../../assets/images/HAW_Logo.jpg")}
                            style={styles.hawLogo}
                            resizeMode='contain'
                        />

                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Eintrag bearbeiten</Text>

                            <TextInput style={styles.input} placeholder="Modulname" placeholderTextColor="#6A8FAD" value={editName} onChangeText={setEditName} />
                            <TextInput style={styles.input} placeholder="Datum (TT.MM.JJJJ)" placeholderTextColor="#6A8FAD" value={editDatum} onChangeText={setEditDatum} />
                            <TextInput style={styles.input} placeholder="Startzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={editStartTime} onChangeText={setEditStartTime} />
                            <TextInput style={styles.input} placeholder="Endzeit (HH:mm)" placeholderTextColor="#6A8FAD" value={editEndTime} onChangeText={setEditEndTime} />
                            <TextInput style={styles.input} placeholder="Raum (optional)" placeholderTextColor="#6A8FAD" value={editRaum} onChangeText={setEditRaum} />
                            <TextInput style={styles.input} placeholder="Dozent (optional)" placeholderTextColor="#6A8FAD" value={editDozent} onChangeText={setEditDozent} />

                            <Text style={styles.pickerLabel}>Wiederholung</Text>
                            <View style={styles.pickerRow}>
                                {(['nie', 'wöchentlich', '2-wöchentlich'] as const).map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[styles.pickerOption, editWiederholung === option && styles.pickerOptionActive]}
                                        onPress={() => setEditWiederholung(option)}
                                    >
                                        <Text style={[styles.pickerOptionText, editWiederholung === option && styles.pickerOptionTextActive]}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Wichtig</Text>
                                <Switch
                                    value={editWichtig}
                                    onValueChange={setEditWichtig}
                                    trackColor={{ false: '#393a3c', true: '#002E99' }}
                                    thumbColor="white"
                                />
                            </View>

                            <TextInput
                                style={styles.notizInput}
                                placeholder="Notiz:"
                                placeholderTextColor="#6A8FAD"
                                multiline
                                value={editNotiz}
                                onChangeText={setEditNotiz}
                            />
                        </View>

                        <TouchableOpacity style={styles.btnSave} onPress={handleSaveEdit}>
                            <Text style={styles.btnText}>Speichern</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnCancel} onPress={() => setEditVisible(false)}>
                            <Text style={styles.btnText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnDelete} onPress={confirmDeleteFromEdit}>
                            <Text style={[styles.btnText, { color: 'white' }]}>Löschen</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

export default Stundenplan;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
    hawLogo: { width: 120, height: 60, alignSelf: 'flex-end' },
    weekNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 4,
    },
    weekNavBtn: {
        padding: 8,
    },
    weekNavArrow: {
        fontSize: 28,
        color: '#002E99',
        lineHeight: 30,
    },
    weekLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#3a38ac',
    },
    grid: { flexDirection: 'column', paddingHorizontal: 10, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', marginBottom: 4 },
    contentRow: { flexDirection: 'row' },
    timeColumn: { width: 50 },
    timeCell: {
        width: 50,
        height: CELL_HEIGHT,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    timeText: { color: '#6A8FAD', fontSize: 12, transform: [{ translateY: -7 }] },
    dayHeader: {
        width: 90,
        height: 44,
        backgroundColor: '#9FBDDB',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginHorizontal: 2,
    },
    dayHeaderToday: {
        backgroundColor: '#002E99',
    },
    dayHeaderText: { color: '#002E99', fontWeight: '600', fontSize: 13 },
    dayDateText: { color: '#4A6A8A', fontSize: 11, marginTop: 1 },
    dayHeaderTextToday: { color: 'white' },
    dayColumn: {
        width: 90,
        marginHorizontal: 2,
        position: 'relative',
    },
    hourLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#d3dce4',
    },
    eventCard: {
        position: 'absolute',
        backgroundColor: '#9FBDDB',
        borderRadius: 8,
        padding: 4,
        overflow: 'hidden',
    },
    eventTitle: { color: '#002E99', fontSize: 11, fontWeight: '600' },
    eventSub: { color: '#002E99', fontSize: 10, opacity: 0.8 },
    // Modal
    modalSafe: { flex: 1 },
    modalContainer: { padding: 20, backgroundColor: 'white' },
    modalCard: {
        backgroundColor: '#9FBDDB',
        borderRadius: 15,
        padding: 16,
        marginTop: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#002E99',
        marginBottom: 14,
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
    pickerOption: {
        flex: 1,
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        paddingVertical: 8,
        alignItems: 'center',
    },
    pickerOptionActive: { backgroundColor: '#002E99' },
    pickerOptionText: { color: '#002E99', fontSize: 12, fontWeight: '500' },
    pickerOptionTextActive: { color: 'white' },
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
    switchLabel: { color: '#002E99' },
    notizInput: {
        backgroundColor: '#C5D7EA',
        borderRadius: 15,
        padding: 12,
        color: '#002E99',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    btnSave: {
        backgroundColor: '#002E99',
        borderRadius: 20,
        padding: 14,
        alignItems: 'center',
        marginTop: 24,
        width: '60%',
        alignSelf: 'center',
    },
    btnCancel: {
        backgroundColor: '#9FBDDB',
        borderRadius: 20,
        padding: 14,
        alignItems: 'center',
        marginTop: 10,
        width: '60%',
        alignSelf: 'center',
    },
    btnDelete: {
        backgroundColor: '#c0392b',
        borderRadius: 20,
        padding: 14,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
        width: '60%',
        alignSelf: 'center',
    },
    btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
