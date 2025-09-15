import { Link } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const Index = () => {
    return (
        <View style={styles.container} >
            <Text style={styles.headline}>Unsere HAW Kalender App</Text>
            <Link style={styles.link} href="/(tabs)/home">Öffnen </Link>

        </View>
    )
}

export default Index

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'

    },
    headline: {
        fontSize: 30

    },
    link: {
        backgroundColor: 'blue',
        fontSize: 20,
        marginTop: 20,
        color: 'white',
        padding: 16

    }
})