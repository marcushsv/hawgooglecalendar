import { CalendarEvent } from '@/types/event';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert } from 'react-native/Libraries/Alert/Alert';
import { v4 as uuidv4 } from 'uuid';


const AddEvent: React.FC = () => {
    const [title, setTitle] = useState('');
    const [module, setModule] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [mainLecturer, setMainLecturer] = useState('');
    const [subLecturer, setSubLecturer] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');


    const handleSave = async () => {
        if (!title || !date || !module || !mainLecturer) {
            Alert.alert('Fehler', 'Titel, Datum, Modul, Hauptlehrender sind Pflichtfelder!');
            return;
        }

        const newEvent: CalendarEvent = {
            id: uuidv4(),
            title,
            module,
            description,
            date,
            mainLecturer,
            subLecturer,
            startTime,
            endTime

        };
        const eventsString = await AsyncStorage.getItem('events');
        const events: CalendarEvent[] = eventsString ? JSON.parse(eventsString) : [];
        events.push(newEvent);
        await AsyncStorage.setItem('events', JSON.stringify(events));
        Alert.alert('Gespeichert', 'Event gespeichert!');
        setTitle('');
        setModule('');
        setDescription('');
        setDate('');
        setMainLecturer('');
        setSubLecturer('');
        setStartTime('');
        setEndTime('');




    }
}