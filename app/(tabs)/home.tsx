import { BlueDataCard } from '@/components/BlueDataCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';


const Home = () => {


    const [contacts, setContacts] = useState([]);
    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem('contacts')
                .then((existingContactsString) => {
                    if (existingContactsString) {
                        setContacts(JSON.parse(existingContactsString));
                    }
                });
        }, [])
    );

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

            <BlueDataCard title="08:30-12:00 Uhr - ASAI" subtitle="Dozent: Prof. Dr.Sabine Schumann " onPress={() => {}}>
                <Text>Notizen:</Text>
                
                <Text>Themenfindung, Ideen: Recommender Systeme, ...</Text>
            </BlueDataCard>
           {/* <FlatList data={contacts} renderItem={renderItem} keyExtractor={(item, index) => index.toString()}>

            </FlatList> */}
        </View>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white'
    },
    title: {
        fontSize: 20,
        fontWeight: 450,
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