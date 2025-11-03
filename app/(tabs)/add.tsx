import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

const Add = () => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [mail, setMail] = useState('');
    const handleSubmit = async () => {
        if (name && number && mail) {
            type Contact = { name: string; number: string; mail: string };
            const contact = { name, number, mail };
            const existingContactsString = await AsyncStorage.getItem('contacts');
            let contacts: Contact[] = [];

            if (existingContactsString) {
                contacts = JSON.parse(existingContactsString);

            }

            contacts.push(contact);
            await AsyncStorage.setItem('contacts', JSON.stringify(contacts));


            Alert.alert('Kontakt gespeichert', 'Name: ' + name + '\nTelefon: ' + number + '\nE-Mail: ' + mail);
            setName('');
            setMail('');
            setNumber('');


        } else {
            Alert.alert('Fehler:', 'fülle bitte alle Felder aus.');

        }
    };
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Neuen Kontakt hinzufügen</Text>
            <Text>Name:</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                multiline={false}
                placeholder="Name eingeben" />
            <Text>Telefonnummer:</Text>
            <TextInput
                style={styles.input}
                value={number}
                onChangeText={setNumber}
                multiline={false}
                placeholder="Nummer eingeben" />
            <Text>E-Mail:</Text>
            <TextInput
                style={styles.input}
                value={mail} onChangeText={setMail}
                multiline={false}
                placeholder="Mail eingeben" />
            <Button title="Kontakt Speichern" onPress={handleSubmit} />
        </View>
    )
}

export default Add

const styles = StyleSheet.create({
    container: {
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 10
    }

})