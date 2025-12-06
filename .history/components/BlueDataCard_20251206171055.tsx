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

    return <View style={styles.card}>
        <Pressable
            onPress={() => {
                setIsOpen( (prev)=> !prev);
                if (onPress) onPress();
            }}
            style={styles.header}
        >
            <View style={{flex: 1}}>
                <Text style={styles.title}>
                    {title}
                </Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <Text style={styles.arrow}>{isOpen ? "^" : "˅"}</Text>
        </Pressable>
        {isOpen && <View style={styles.body}>
            {children}</View> }
    </View>
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#9FBDDB",
        borderRadius: 15,
        marginTop: 16,
        padding: 12
    },
    header: {
        flexDirection: "row",
        alignItems: "center"
    },
    title: {
        color:"white",
        fontSize: 18,
        fontWeight: "600"
    },
    subtitle: {
        color: "white",
        opacity: 0.9,
        marginTop: 5,
        marginBottom: 5
    },
    arrow: {
        color: "white",
        fontSize: 18,
        marginLeft: 8,
    },
    body: {
        marginTop: 5,
        backgroundColor: "#C5D7EA",
        padding: 10,
        borderRadius: 10,
    }
})