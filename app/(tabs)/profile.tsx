import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const Profile = () => {
    return (
        <View style={styles.container}>
            <Text>Mein Profil</Text>
            <Pressable onPress={() => router.push('/register')}>
                <Text > Registrieren</Text>
            </Pressable>
        </View>
    )
}

export default Profile

const styles = StyleSheet.create({
    container: {
        padding: 20
    }
})