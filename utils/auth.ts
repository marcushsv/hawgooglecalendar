import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const getUserId = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('userId');
    } else {
        return await SecureStore.getItemAsync('userId');
    }
};

export const getToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('token');
    } else {
        return await SecureStore.getItemAsync('token');
    }
};

export const getRole = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('role');
    } else {
        return await SecureStore.getItemAsync('role');
    }
};