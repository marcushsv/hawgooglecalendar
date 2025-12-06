import React, { useState,React } from 'react';
import { Pressable, StyleSheet, Text, View} from 'react-native';

type BlueDataCardProps {
    title:string,
    subtitle?:string,
    props?: ReactNode
}

export function BlueDataCard(title, subtitle, props):BlueDataCardProps {
    const [isOpen,setIsOpen] = useState(false)

    return <View>
        <Pressable>
            <View>
                <Text>
                   
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