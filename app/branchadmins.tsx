import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function BranchAdminsScreen() {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Branch Admins</Text>
            <Text>Manage branch administrators here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
