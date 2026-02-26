import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const AddEvent: React.FC = () => {
    const API_URL = "http://localhost:3000"; 

    const [title, setTitle] = useState('');
    const [module, setModule] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [mainLecturer, setMainLecturer] = useState('');
    const [subLecturer, setSubLecturer] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [veranstaltungsart, setVeranstaltungsart] = useState('');




    const handleSave = async () => {
        if (!title || !date || !module || !mainLecturer) {
             Alert.alert("Fehler", "Titel, Datum, Modul, Hauptlehrender sind Pflichtfelder!");
            return; 
        } 
        const entryPayload = {
    title: `${module} – ${title}`,      // oder nur title
    dozent: mainLecturer,
    raum: location,
    datum: `${date}T00:00:00.000Z`,     // ISO string -> Date castet Mongoose
    zeitVon: startTime,
    zeitBis: endTime,
    notizen: description,
    wichtig: false,
    userId: "demo", // optional
  };
  try {
    const res = await fetch(`${API_URL}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryPayload),
    });

    const text = await res.text(); // <- IMMER lesen, hilft mega beim Debug
    console.log("POST /entries:", res.status, text);

    if (!res.ok) {
      Alert.alert("Fehler", text || "Speichern fehlgeschlagen");
      return;
    }

    Alert.alert("Gespeichert", "Event gespeichert!");
    setTitle("");
    setModule("");
    setDescription("");
    setDate("");
    setMainLecturer("");
    setSubLecturer("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setVeranstaltungsart("");
  } catch (e: any) {
    console.log("NETWORK ERROR", e);
    Alert.alert("Netzwerkfehler", e?.message ?? String(e));
  }
    }

    return (

        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Neuen Termin anlegen</Text>
                <Text>Titel</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} />
                <Text>Beschreibung (optional)</Text>
                <TextInput style={styles.input} value={description} onChangeText={setDescription} />
                <Text>Modul</Text>
                <TextInput style={styles.input} value={module} onChangeText={setModule} />
                <Text>Hauptdozent</Text>
                <TextInput style={styles.input} value={mainLecturer} onChangeText={setMainLecturer} />
                <Text>Nebendozent (optional)</Text>
                <TextInput style={styles.input} value={subLecturer} onChangeText={setSubLecturer} />
                <Text>Datum (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} />
                <Text>Startzeit (optional, HH:mm)</Text>
                <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} />
                <Text>Endzeit (optional, HH:mm)</Text>
                <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} />
                <Text>Ort/Raum (optional)</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} />
                <Text>Online, Hybrid oder in Person? (optional)</Text>
                <TextInput style={styles.input} value={veranstaltungsart} onChangeText={setVeranstaltungsart} />
                <Button title="Speichern" onPress={handleSave} />
            </ScrollView>
        </SafeAreaView>


    );



};

const styles = StyleSheet.create({
    safeArea: { flex: 1, },
    container: { padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 8 },
});


export default AddEvent;