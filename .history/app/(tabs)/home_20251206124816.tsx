import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Button, FlatList, Image, StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from "expo-haptics";

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
            <Text style={styles.title} >Home Screen</Text>
            <Image
                source={require("../../assets/images/HAW_Logo.jpg")} 
                style= {styles.hawLogo}
            />
            <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      style={{ padding: 20, backgroundColor: "#ddd" }}
    >
      <Text>Drück mich!</Text>
    </Pressable>
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
    },
    hawLogo: {
        width:290,
        height:100,
        

    }
})