import React, { useState,ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View} from 'react-native';

type BlueDataCardProps = {
    title:string,
    subtitle?:string,
    props?: ReactNode,
    onPress?: ()=> void
}

export function BlueDataCard(title, subtitle, props, onPress):BlueDataCardProps {
    const [isOpen,setIsOpen] = useState(false)

    return <View>
        <Pressable>
            <View>
                <Text>
                   title
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