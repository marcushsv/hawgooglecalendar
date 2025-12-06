import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function BlueDataCard(title, subtitle, onPress, children) {
    const [isOpen,setIsOpen] = useState(false)

    return <View>
        <Pressable>
            <View>
                <Text>
                    {}
                </Text>
            </View>
        </Pressable>
    </View>
}

const styles = StyleSheet.create({
    container: {
        width:100
    }
})