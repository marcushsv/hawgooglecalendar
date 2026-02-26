import { BlueDataCard } from '@/components/BlueDataCard';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';


const Home = () => {

    const API_URL = "http://localhost:3000"; 
    type Entry = {
  _id: string;
  title: string;
  dozent?: string;
  raum?: string;
  datum: string;      // kommt als ISO string
  zeitVon?: string;
  zeitBis?: string;
  notizen?: string;
};

const [entries, setEntries] = useState<Entry[]>([]);

useFocusEffect(
  useCallback(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/entries`);
        if (!res.ok) throw new Error("Entries konnten nicht geladen werden");
        const data = await res.json();
        setEntries(data);
      } catch (e) {
        console.log(e);
      }
    };
    load();
  }, [])
);

const todayKey = new Date().toISOString().slice(0, 10);
const todayEntries = entries
  .filter((e) => new Date(e.datum).toISOString().slice(0, 10) === todayKey)
  .sort((a, b) => (a.zeitVon || "").localeCompare(b.zeitVon || ""));
    const renderItem = ({ item }) => (
        <View style={styles.contactItem}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text>{item.number}</Text>
            <Text>{item.mail}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Image
                source={require("../../assets/images/HAW_Logo.jpg")} 
                style= {styles.hawLogo}
                resizeMode='contain'
            />
            <Text style={styles.title}>Willkommen zu deinem Kalender</Text>
            {todayEntries.length === 0 ? (
            <Text style={{ marginTop: 16 }}>Heute keine Vorlesungen 🎉</Text>
        ) : (
            todayEntries.map((ev) => (
            <BlueDataCard
            key={ev._id}
            title={`${ev.zeitVon ?? "??:??"}-${ev.zeitBis ?? "??:??"} Uhr - ${ev.title}`}
            subtitle={`Dozent: ${ev.dozent ?? "-"}`}
            onPress={() => {}}
        >
        <Text>Notizen:</Text>
        <Text>{ev.notizen?.trim() ? ev.notizen : "-"}</Text>
        {!!ev.raum && <Text style={{ marginTop: 6 }}>Raum: {ev.raum}</Text>}
        </BlueDataCard>
        ))
    )}
           {/* <FlatList data={contacts} renderItem={renderItem} keyExtractor={(item, index) => index.toString()}>

            </FlatList> */}
        </View>
    )
};

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white'
    },
    title: {
        fontSize: 20,
        fontWeight: "500",
        marginTop: 20,
        textAlign: 'left',
        color: '#3a38ac'
    },
    contactItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'

    },
    contactName: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    hawLogo: {
        width:120,
        height:50,
        alignSelf:'flex-end'

    }
})


