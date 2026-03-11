import { Link } from 'expo-router'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Index = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Image
                    source={require('../assets/images/HAW_Logo.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.headline}>HAW Kalender App</Text>

                <Link style={styles.link} href="/login">Login</Link>
                <Link style={styles.linkSecondary} href="/register">Registrieren</Link>
                <Link style={styles.linkGhost} href="/guestCalendar">Stundenplan als Gast anschauen</Link>
            </View>
        </SafeAreaView>
    )
}

export default Index

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        backgroundColor: 'white',
    },
    logo: {
        width: 180,
        height: 70,
        marginBottom: 12,
    },
    headline: {
        fontSize: 24,
        fontWeight: '700',
        color: '#002E99',
        marginBottom: 40,
    },
    link: {
        backgroundColor: '#002E99',
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 13,
        paddingHorizontal: 0,
        borderRadius: 30,
        marginTop: 12,
        width: '70%',
        textAlign: 'center',
        overflow: 'hidden',
    },
    linkSecondary: {
        backgroundColor: '#9FBDDB',
        color: '#002E99',
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 13,
        paddingHorizontal: 0,
        borderRadius: 30,
        marginTop: 12,
        width: '70%',
        textAlign: 'center',
        overflow: 'hidden',
    },
    linkGhost: {
        backgroundColor: 'transparent',
        color: '#002E99',
        fontSize: 13,
        fontWeight: '500',
        paddingVertical: 10,
        paddingHorizontal: 0,
        borderRadius: 30,
        marginTop: 20,
        width: '70%',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#9FBDDB',
        overflow: 'hidden',
    },
})
