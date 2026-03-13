import React, { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type BlueDataCardProps = {
    title: string,
    subtitle?: string | string[],
    children?: ReactNode,
    onPress?: () => void,
    onDelete?: () => void,
    defaultOpen?: boolean,
    cardColor?: string,
    titleColor?: string,
}

export function BlueDataCard({ title, subtitle, children, onPress, onDelete, defaultOpen, cardColor, titleColor }: BlueDataCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen ?? false)

    return <View style={[styles.card, cardColor ? { backgroundColor: cardColor } : undefined]}>
        <Pressable
            onPress={() => {
                setIsOpen((prev) => !prev);
                if (onPress) onPress();
            }}
            style={styles.header}
        >
            <View style={{ flex: 1 }}>
                <Text style={[styles.title, titleColor ? { color: titleColor } : undefined]}>{title}</Text>
                {Array.isArray(subtitle)
                    ? subtitle.map((s, i) => <Text key={i} style={styles.subtitle}>{s}</Text>)
                    : subtitle && <Text style={styles.subtitle}>{subtitle}</Text>
                }
            </View>
            {onDelete && (
                <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.arrow}>{isOpen ? "−" : "+"}</Text>
        </Pressable>
        {isOpen && (
            <View style={styles.body}>
                {children}
            </View>
        )}
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
        color: "#002E99",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center"
    },
    subtitle: {
        color: "#002E99",
        opacity: 0.9,
        marginTop: 5,
        marginBottom: 5
    },
    deleteBtn: {
        backgroundColor: '#E8455A',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    deleteBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    arrow: {
        color: "white",
        fontSize: 30,
        marginLeft: 8,
    },
    body: {
        marginTop: 5,
        backgroundColor: "#C5D7EA",
        padding: 10,
        borderRadius: 10,
        gap: 8
    }
})
