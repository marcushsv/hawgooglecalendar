import { Stack } from 'expo-router'
import React from 'react'

const RootLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="login" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="register" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="admin" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="adminLogin" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="guestCalendar" options={{ headerShown: false }}></Stack.Screen>
    </Stack >

  )
}

export default RootLayout