import { CalendarEvent } from '@/haw_backend/types/event';
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
const API_URL = "http://localhost:3000";
const [events, setEvents] = useState<CalendarEvent[]>([]);
const [selectedDate, setSelectedDate] = useState<string>('');

const loadEvents = async () => {
  try {
    const res = await fetch(`${API_URL}/entries`);
    if (!res.ok) throw new Error("Fehler beim Laden");

    const entries = await res.json();

    const mapped: CalendarEvent[] = entries.map((e: any) => ({
      id: e._id, // Mongo ID
      title: e.title,
      module: e.title, // falls du kein Modul-Feld im Entry hast
      description: e.notizen ?? "",
      date: new Date(e.datum).toISOString().slice(0, 10),
      mainLecturer: e.dozent ?? "",
      subLecturer: "",
      startTime: e.zeitVon ?? "",
      endTime: e.zeitBis ?? "",
      location: e.raum ?? "",
      veranstaltungsart: "",
    }));

    setEvents(mapped);
  } catch (err) {
    console.log(err);
  }
};

useEffect(() => {
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

