import React, { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BlueDataCardProps = {
    title:string,
    subtitle?:string,
    children?: ReactNode,
    onPress?: ()=> void
}

export function BlueDataCard({title, subtitle, children, onPress,}:BlueDataCardProps) {
    const [isOpen,setIsOpen] = useState(false)

    return <View>
        <Pressable
            onPress={() => {
                setIsOpen( (prev)=> !prev);
                if (onPress) onPress();
            }}
        >
            <View style={{flex: 1}}>
                <Text>
                    {title}
                </Text>
            </View>
        </Pressable>
        {isOpen && <View></View }
    </View>
}

const styles = StyleSheet.create({
    container: {
        width:100
    }
})