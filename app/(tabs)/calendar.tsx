import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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
                <Calendar
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

});