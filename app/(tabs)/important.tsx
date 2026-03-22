import { BlueDataCard } from '@/components/BlueDataCard';
import { getUserId } from '@/utils/auth';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const API_URL = "http://10.0.2.2:3000";

const CARD_COLORS: Record<string, string> = {
    'nie':  '#9FDBBD',
    'wöchentlich': '#9FBDDB',
    '2-wöchentlich': '#DDD4A8',
};


const Important = () => {
      type Entry = {
        _id: string;
        title: string;
        dozent?: string;
        raum?: string;
        datum: string;
        zeitVon?: string;
        zeitBis?: string;
        notizen?: string;
        wichtig: boolean;
        wiederholung?: 'nie' | 'wöchentlich' | '2-wöchentlich';
    };

    type Announcement = {
        _id: string;
        title: string;
        message: string;
        createdAt: string;
    };

    const [entries, setEntries] = useState<Entry[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const unmarkWichtig = (id: string, title: string) => {
        Alert.alert('Achtung!', `"${title}" wirklich aus wichtigen Terminen entfernen?`, [
            { text: 'Abbrechen', style: 'cancel' },
            {
                text: 'Entfernen', style: 'destructive', onPress: () => {
                    fetch(`${API_URL}/entries/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ wichtig: false }),
                    })
                        .then(() => setEntries(prev => prev.filter(e => e._id !== id)))
                        .catch(console.error);
                }
            },
        ]);
    };

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const userId = await getUserId();
                const [entriesRes, announcementsRes] = await Promise.all([
                    fetch(`${API_URL}/entries?userId=${userId}`),
                    fetch(`${API_URL}/announcements`),
                ]);
                const entriesData = await entriesRes.json();
                const announcementsData = await announcementsRes.json();
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                setEntries(entriesData.filter((e: Entry) => e.wichtig && (
                    e.wiederholung && e.wiederholung !== 'nie'
                        ? true
                        : new Date(e.datum) >= todayStart
                )));
                setAnnouncements(announcementsData);
            };
            load();
        }, [])
    );

    return (
        <SafeAreaView style={styles.safeArea}>
         <ScrollView style={styles.container}>
            <View>
                    <Image
                        source={require("../../assets/images/HAW_Logo.jpg")}
                        style= {styles.hawLogo}
                        resizeMode='contain'
                    />
                    <Text style={styles.title}>Wichtige Termine &amp; Meldungen</Text>


                    {announcements.length > 0 && (
                        <View>
                            <Text style={[styles.title, { color: '#c0392b', marginBottom: 8 }]}>Admin-Meldungen</Text>
                            {announcements.map(a => (
                                <View key={a._id} style={styles.announcementCard}>
                                    <Text style={styles.announcementTitle}>{a.title}</Text>
                                    <Text style={styles.announcementText}>{a.message}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={[styles.title, { marginTop: announcements.length > 0 ? 16 : 0 }]}>Meine wichtigen Termine</Text>

                    {entries.length === 0 ? (
                <Text style={{ marginTop: 16 }}>Keine wichtigen Termine 🎉</Text>
            ) : (
                entries.map((ev) => (
                    <BlueDataCard
                        key={ev._id}
                        title={ev.title}
                        subtitle={[
                            `Dozent: ${ev.dozent ?? '-'}`,
                            `Raum: ${ev.raum ?? '-'}`,
                            `Zeit: ${ev.zeitVon ?? '??'} - ${ev.zeitBis ?? '??'} Uhr`,
                            ...(ev.wiederholung && ev.wiederholung !== 'nie' ? [`${ev.wiederholung}`] : []),
                        ]}
                        cardColor={CARD_COLORS[ev.wiederholung ?? 'nie']}
                        titleColor='#E67E22'
                    >
                        <Text style={{ color: '#002E99' }}>Notizen:</Text>
                        <Text style={{ color: '#002E99' }}>{ev.notizen?.trim() ? ev.notizen : '-'}</Text>
                        <TouchableOpacity style={styles.unmarkBtn} onPress={() => unmarkWichtig(ev._id, ev.title)}>
                            <Text style={styles.unmarkBtnText}>Aus "Wichtige Termine" entfernen</Text>
                        </TouchableOpacity>
                    </BlueDataCard>
                ))
            )}
            </View>
        </ScrollView>
        </SafeAreaView>
    )
}

export default Important

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        padding: 20,
        backgroundColor: 'white',
    },
    hawLogo: {
        width: 120,
        height: 60,
        alignSelf: 'flex-end',
    },
    title: {
        fontSize: 20,
        fontWeight: "500",
        marginTop: 20,
        textAlign: 'left',
        color: '#3a38ac'
    },
    unmarkBtn: {
        backgroundColor: '#002E99',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
    },
    unmarkBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    announcementCard: {
        backgroundColor: '#fdecea',
        borderLeftWidth: 4,
        borderLeftColor: '#c0392b',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },
    announcementTitle: {
        color: '#c0392b',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4,
    },
    announcementText: {
        color: '#333',
        fontSize: 13,
    },
})