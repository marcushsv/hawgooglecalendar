import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

const Add = () => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [mail, setMail] = useState('');
    const handleSubmit = async () => {
        if (name && number && mail) {
            Alert.alert('Kontakt gespeichert', 'Name: ' + name + '\nTelefon: ' + number + '\nE-Mail: ' + mail);
        } else {
            Alert.alert('Fehler:', 'fülle bitte alle Felder aus.')

        }
    };
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Neuen Kontakt hinzufügen</Text>
            <Text>Name:</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName}> </TextInput>
            <Text>Telefonnummer:</Text>
            <TextInput style={styles.input} value={number} onChangeText={setNumber}> </TextInput>
            <Text>E-Mail::</Text>
            <TextInput style={styles.input} value={mail} onChangeText={setMail}> </TextInput>
            <Button title="Kontakt Speichern" onPress={handleSubmit}> </Button>
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