import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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
            <Text style={styles.title} >Meine Kontakte</Text>
            <FlatList data={contacts} renderItem={renderItem} keyExtractor={(item, index) => index.toString()}></FlatList>

        </View>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    contactItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'

    },
    contactName: {
        fontSize: 18,
        fontWeight: 'bold'
    }
})