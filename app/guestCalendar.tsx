import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Image, Modal, Pressable, ScrollView,
    StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "http://10.0.2.2:3000";
const FACHSEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const STUDIENGANG_PRESETS = ['MT', 'MS'];

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const GRID_START = 8;
const CELL_HEIGHT = 70;
const GRID_HEIGHT = (HOURS.length - 1) * CELL_HEIGHT;

const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
};

const getCalendarWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const padTwo = (n: number) => String(n).padStart(2, '0');

const toDecimalHour = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h + m / 60;
};

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const overlapsTime = (a: any, b: any) =>
    toMin(a.zeitVon) < toMin(b.zeitBis) && toMin(a.zeitBis) > toMin(b.zeitVon);

const computeDayLayout = (dayEntries: any[]): { entry: any; colIndex: number; totalCols: number }[] => {
    if (dayEntries.length === 0) return [];

    const parent = dayEntries.map((_, i) => i);
    const find = (i: number): number => parent[i] === i ? i : (parent[i] = find(parent[i]));
    const union = (a: number, b: number) => { parent[find(a)] = find(b); };
    for (let i = 0; i < dayEntries.length; i++)
        for (let j = i + 1; j < dayEntries.length; j++)
            if (overlapsTime(dayEntries[i], dayEntries[j])) union(i, j);

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

const isEntryOnDay = (entry: any, dayDate: Date): boolean => {
    const entryDate = new Date(entry.datum);
    entryDate.setHours(0, 0, 0, 0);
    const target = new Date(dayDate);
    target.setHours(0, 0, 0, 0);

    if (!entry.wiederholung || entry.wiederholung === 'nie') {
        return entryDate.getTime() === target.getTime();
    }
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

const GuestCalendar = () => {
    const [studiengang, setStudiengang] = useState('');
    const [fachsemester, setFachsemester] = useState<number | null>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);

    const [detailVisible, setDetailVisible] = useState(false);
    const [detailEntry, setDetailEntry] = useState<any>(null);

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

    const handleLoad = async () => {
        if (!studiengang.trim() || !fachsemester) return;
        setLoading(true);
        setLoaded(false);
        try {
            const res = await fetch(
                `${API_URL}/course-entries?fachsemester=${fachsemester}&studiengang=${encodeURIComponent(studiengang.trim())}`
            );
            const data = await res.json();
            setEntries(data);
            setLoaded(true);
            setWeekOffset(0);
        } catch {
            setEntries([]);
            setLoaded(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backArrow}>‹</Text>
                    <Text style={styles.backText}>Login</Text>
                </TouchableOpacity>
                <Image
                    source={require('../assets/images/HAW_Logo.jpg')}
                    style={styles.hawLogo}
                    resizeMode="contain"
                />
            </View>

            <View style={{ height: 30 }} />

            <View style={styles.selectionCard}>
                <Text style={styles.selectionTitle}>Stundenplan anzeigen</Text>

                <View style={styles.pickerRow}>
                    <Text style={{ color: '#002E99', fontSize: 14, marginRight: 6 }}>Studiengang:</Text>
                    {STUDIENGANG_PRESETS.map(sg => (
                        <TouchableOpacity
                            key={sg}
                            style={[styles.chip, studiengang === sg && styles.chipActive]}
                            onPress={() => setStudiengang(sg)}
                        >
                            <Text style={[styles.chipText, studiengang === sg && styles.chipTextActive]}>{sg}</Text>
                        </TouchableOpacity>
                    ))}

                </View>

                <View style={styles.pickerRow}>
                    <Text style={{ color: '#002E99', fontSize: 14, marginRight: 6 }}>Semester:</Text>
                    {FACHSEMESTER_OPTIONS.map(sem => (
                        <TouchableOpacity
                            key={sem}
                            style={[styles.chip, fachsemester === sem && styles.chipActive]}
                            onPress={() => setFachsemester(sem)}
                        >
                            <Text style={[styles.chipText, fachsemester === sem && styles.chipTextActive]}>{sem}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.loadBtn, (!studiengang || !fachsemester) && styles.loadBtnDisabled]}
                    onPress={handleLoad}
                    disabled={!studiengang || !fachsemester || loading}
                >
                    {loading
                        ? <ActivityIndicator color="white" />
                        : <Text style={styles.loadBtnText}>
                            {loaded ? `${studiengang} · FS ${fachsemester} neu laden` : 'Stundenplan anzeigen'}
                        </Text>
                    }
                </TouchableOpacity>
            </View>

            {loaded && (
                <>
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

                    {entries.length === 0 ? (
                        <Text style={styles.emptyText}>Keine Einträge für {studiengang} FS {fachsemester} gefunden.</Text>
                    ) : (
                        <ScrollView>
                            <ScrollView horizontal showsHorizontalScrollIndicator>
                                <View style={styles.grid}>
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

                                    <View style={styles.contentRow}>
                                        <View style={styles.timeColumn}>
                                            {HOURS.map(hour => (
                                                <View key={hour} style={styles.timeCell}>
                                                    <Text style={styles.timeText}>{hour}:00</Text>
                                                </View>
                                            ))}
                                        </View>
                                        {weekDates.map((dayDate, dayIndex) => {
                                            const dayEntries = entries.filter(
                                                e => isEntryOnDay(e, dayDate) && e.zeitVon && e.zeitBis
                                            );
                                            return (
                                                <View key={dayIndex} style={[styles.dayColumn, { height: GRID_HEIGHT }]}>
                                                    {HOURS.slice(0, -1).map(hour => (
                                                        <View key={hour} style={[styles.hourLine, { top: (hour - GRID_START) * CELL_HEIGHT }]} />
                                                    ))}
                                                    {computeDayLayout(dayEntries).map(({ entry: e, colIndex, totalCols }) => {
                                                        const start = toDecimalHour(e.zeitVon);
                                                        const end = toDecimalHour(e.zeitBis);
                                                        const top = (start - GRID_START) * CELL_HEIGHT;
                                                        const height = (end - start) * CELL_HEIGHT - 1;
                                                        const slotWidth = 86 / totalCols;
                                                        const left = 2 + colIndex * slotWidth;
                                                        const width = slotWidth - 1;
                                                        return (
                                                            <Pressable
                                                                key={e._id}
                                                                onPress={() => { setDetailEntry(e); setDetailVisible(true); }}
                                                                style={[styles.eventCard, { top, height, left, width }]}
                                                            >
                                                                <Text style={styles.eventTitle} numberOfLines={2}>{e.title}</Text>
                                                                {e.raum ? <Text style={styles.eventSub}>{e.raum}</Text> : null}
                                                                <Text style={styles.eventSub}>{e.zeitVon} – {e.zeitBis}</Text>
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
                </>
            )}

            <Modal visible={detailVisible} transparent animationType="fade" onRequestClose={() => setDetailVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setDetailVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        {detailEntry && (
                            <>
                                <Text style={styles.modalTitle}>{detailEntry.title}</Text>
                                <Text style={styles.modalRow}>
                                    {new Date(detailEntry.datum).toLocaleDateString('de-DE')}
                                    {detailEntry.zeitVon && detailEntry.zeitBis
                                        ? `  ·  ${detailEntry.zeitVon} – ${detailEntry.zeitBis}`
                                        : ''}
                                </Text>
                                {detailEntry.raum && <Text style={styles.modalRow}>Raum: {detailEntry.raum}</Text>}
                                {detailEntry.dozent && <Text style={styles.modalRow}>Dozent: {detailEntry.dozent}</Text>}
                                {detailEntry.wiederholung && detailEntry.wiederholung !== 'nie' && (
                                    <Text style={styles.modalRow}>Wiederholung: {detailEntry.wiederholung}</Text>
                                )}
                                {detailEntry.notizen && <Text style={styles.modalRow}>Notiz: {detailEntry.notizen}</Text>}
                            </>
                        )}
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>Schließen</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

export default GuestCalendar;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white', paddingTop: 40 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    backArrow: { fontSize: 28, color: '#002E99', lineHeight: 30 },
    backText: { color: '#002E99', fontSize: 15, fontWeight: '500', marginLeft: 2 },
    hawLogo: { width: 100, height: 40 },
    selectionCard: {
        backgroundColor: '#9FBDDB',
        borderRadius: 15,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    selectionTitle: {
        color: '#002E99',
        fontWeight: '700',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    pickerRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    chip: {
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        paddingVertical: 7,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    chipActive: { backgroundColor: '#002E99' },
    chipText: { color: '#002E99', fontWeight: '600', fontSize: 13 },
    chipTextActive: { color: 'white' },
    sgInput: {
        flex: 1,
        minWidth: 60,
        backgroundColor: '#C5D7EA',
        borderRadius: 20,
        paddingVertical: 7,
        paddingHorizontal: 12,
        color: '#002E99',
        fontSize: 13,
        fontWeight: '600',
    },
    loadBtn: {
        backgroundColor: '#002E99',
        borderRadius: 20,
        padding: 11,
        alignItems: 'center',
        marginTop: 4,
    },
    loadBtnDisabled: { opacity: 0.4 },
    loadBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
    weekNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    weekNavBtn: { padding: 6 },
    weekNavArrow: { fontSize: 28, color: '#002E99', lineHeight: 30 },
    weekLabel: { fontSize: 14, fontWeight: '500', color: '#3a38ac' },
    emptyText: {
        textAlign: 'center',
        color: '#6A8FAD',
        marginTop: 24,
        fontStyle: 'italic',
    },
    grid: { flexDirection: 'column', paddingHorizontal: 10, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', marginBottom: 4 },
    contentRow: { flexDirection: 'row' },
    timeColumn: { width: 50 },
    timeCell: { width: 50, height: CELL_HEIGHT, justifyContent: 'flex-start', alignItems: 'center' },
    timeText: { color: '#6A8FAD', fontSize: 12, transform: [{ translateY: -7 }] },
    dayHeader: {
        width: 90, height: 44,
        backgroundColor: '#9FBDDB',
        justifyContent: 'center', alignItems: 'center',
        borderRadius: 10, marginHorizontal: 2,
    },
    dayHeaderToday: { backgroundColor: '#002E99' },
    dayHeaderText: { color: '#002E99', fontWeight: '600', fontSize: 13 },
    dayDateText: { color: '#4A6A8A', fontSize: 11, marginTop: 1 },
    dayHeaderTextToday: { color: 'white' },
    dayColumn: { width: 90, marginHorizontal: 2, position: 'relative' },
    hourLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#d3dce4' },
    eventCard: {
        position: 'absolute',
        backgroundColor: '#9FBDDB',
        borderRadius: 8, padding: 4, overflow: 'hidden',
    },
    eventTitle: { color: '#002E99', fontSize: 11, fontWeight: '600' },
    eventSub: { color: '#002E99', fontSize: 10, opacity: 0.8 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalCard: {
        backgroundColor: 'white', borderRadius: 16,
        padding: 20, width: '80%',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    },
    modalTitle: { color: '#002E99', fontWeight: '700', fontSize: 16, marginBottom: 10 },
    modalRow: { color: '#4A6A8A', fontSize: 13, marginBottom: 4 },
    modalCloseBtn: {
        backgroundColor: '#9FBDDB', borderRadius: 20,
        padding: 10, alignItems: 'center', marginTop: 14,
    },
    modalCloseBtnText: { color: '#002E99', fontWeight: '600' },
});
