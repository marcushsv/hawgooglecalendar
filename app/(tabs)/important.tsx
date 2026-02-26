import { BlueDataCard } from '@/components/BlueDataCard';
import React from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';

const Important = () => {
    return (
         <View style={styles.container}>
                    <Image
                        source={require("../../assets/images/HAW_Logo.jpg")} 
                        style= {styles.hawLogo}
                        resizeMode='contain'
                    />
                    <Text style={styles.title}>Wichtige Termine</Text>


                    <BlueDataCard title="26.02.2026: NWA Labor" subtitle={[
        'Dozent: Prof Dr Nils Martini',
        'Raum: A 1.23',
        'Zeit: 08:00 - 11:30 Uhr',
    ]} >
                         <TextInput
        multiline
        placeholder="Notizen hier eingeben..."
        placeholderTextColor="#6A8FAD"
        style={{
            color: "#002E99",
            minHeight: 80,
            textAlignVertical: 'top',  // Android: Text startet oben
        }}
    />
                    </BlueDataCard>
                </View>

    )
}

export default Important

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: 'white'
    },
     hawLogo: {
        width:120,
        height:50,
        alignSelf:'flex-end'

    },
    title: {
        fontSize: 20,
        fontWeight: "500",
        marginTop: 20,
        textAlign: 'left',
        color: '#3a38ac'
    }
})