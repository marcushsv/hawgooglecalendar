import { CalendarEvent } from '@/types/event';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';





const customTheme = {
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#b6c1cd',
    selectedDayBackgroundColor: '#00adf5',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#00adf5',
    dayTextColor: '#2d4150',
    textDisabledColor: '#d9e1e8',
    dotColor: '#00adf5',
    selectedDotColor: '#ffffff',
    arrowColor: '#00adf5',
    monthTextColor: '#00adf5',
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14
};

const CalendarScreen: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    useEffect(() => {
        const loadEvents = async () => {
            const eventsString = await AsyncStorage.getItem('events')
            setEvents(eventsString ? JSON.parse(eventsString) : []);
        };
        loadEvents();
    }, []);

    const markedDates = useMemo(() => {
        const marked: Record<string, object> = {};
        events.forEach(ev => {
            marked[ev.date] = { marked: true, dotColor: 'red' };
        });
        if (selectedDate) {
            marked[selectedDate] = { ...(marked[selectedDate] || {}), selected: true };
        }
        return marked;
    }, [events, selectedDate]);

    const dateEvents = useMemo(
        () => events.filter(ev => ev.date === selectedDate),
        [selectedDate, events]
    );

    const generateICS = (eventList: CalendarEvent[]) => {
        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const header = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:KalenderApp\n';
        const footer = 'END:VCALENDAR\n';
        const eventEntries = eventList.map(ev =>
            `\nBEGIN:VEVENT` +
            `\nUID:${ev.id}` +
            `\nDTSTAMP:${dtstamp}` +
            `\nSUMMARY:${ev.title}` +
            `\nDESCRIPTION:${ev.description || ''}` +
            `\nCATEGORIES:${ev.module}` +
            (ev.location ? `\nLOCATION:${ev.location}` : '') +
            (ev.mainLecturer ? `\nCOMMENT:Hauptlehrender: ${ev.mainLecturer}` : '') +
            (ev.subLecturer ? `\nCOMMENT:Nebenlehrende: ${ev.subLecturer}` : '') +
            (ev.veranstaltungsart ? `\nCOMMENT:Art: ${ev.veranstaltungsart}` : '') +
            (ev.startTime
                ? `\nDTSTART:${ev.date.replace(/-/g, '')}T${ev.startTime.replace(':', '')}00Z`
                : `\nDTSTART;VALUE=DATE:${ev.date.replace(/-/g, '')}`) +
            (ev.endTime ? `\nDTEND:${ev.date.replace(/-/g, '')}T${ev.endTime.replace(':', '')}00Z` : '') +
            `\nEND:VEVENT\n`
        ).join('');
        return header + eventEntries + footer;
    };

    const exportICS = async () => {
        if (events.length === 0) {
            Alert.alert('Keine Events', 'Es gibt keine Termine zum Exportieren.');
            return;
        }
        const ics = generateICS(events);
        const fileName = 'termine.ics';
        const fileUri = FileSystem.cacheDirectory + 'termine.ics';
        await FileSystem.writeAsStringAsync(fileUri, ics, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri);
    };

    return (
        <View style={styles.container}>
            <Calendar markedDates={markedDates} onDayPress={d => setSelectedDate(d.dateString)} />
            <Text style={styles.dateTitle}>Termine am {selectedDate}:</Text>
            <FlatList
                data={dateEvents}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.eventItem}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text>{item.description}</Text>
                        {item.startTime && <Text>Start: {item.startTime}</Text>}
                        {item.endTime && <Text>Ende: {item.endTime}</Text>}
                    </View>
                )}
            />
            <Button title="Alle Events als ICS exportieren" onPress={exportICS} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    eventItem: { marginVertical: 6, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 },
    eventTitle: { fontWeight: 'bold' },
    dateTitle: { fontWeight: 'bold', marginTop: 12, marginBottom: 6 }
});

export default CalendarScreen;




/* const STORAGE_KEY = 'calendar_events';

export default function CalendarApp() {
    const [selectedDate, setSelectedDate] = useState('');

    // Beispiel Events
    const events = {
        '2025-09-25': { marked: true, dotColor: 'red' },
        '2025-09-26': { marked: true, dotColor: 'blue' },
        '2025-09-27': { marked: true, selected: true, selectedColor: 'orange' },
        '2025-09-30': { marked: true, dotColor: 'green' }
    };

    const marked = useMemo(() => ({
        ...events,
        [selectedDate]: {
            ...events[selectedDate],
            selected: true,
            selectedColor: events[selectedDate]?.selectedColor || '#00adf5',
            selectedTextColor: '#ffffff'
        }
    }), [selectedDate, events]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <Calendar theme={customTheme}
                    onDayPress={(day) => {
                        setSelectedDate(day.dateString);
                    }}
                    markedDates={marked}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center'
    },
    infoContainer: {
        padding: 20,
        alignItems: 'center'
    },
    infoText: {
        fontSize: 16,
        color: '#333'
    }

}); */