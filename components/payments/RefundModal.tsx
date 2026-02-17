import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';
import { createRefund } from '../../services/api';

interface RefundModalProps {
    bookingNumber: string;
    refundableAmount: number;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RefundModal = ({ bookingNumber, refundableAmount, visible, onClose, onSuccess }: RefundModalProps) => {
    const theme = useTheme();
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState<'CASH' | 'ONLINE'>('CASH');
    const [referenceNo, setReferenceNo] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        const refundAmount = Number(amount);

        if (!refundAmount || refundAmount <= 0) {
            Alert.alert("Error", "Enter valid refund amount");
            return;
        }

        if (refundAmount > refundableAmount) {
            Alert.alert("Error", "Refund amount exceeds refundable balance");
            return;
        }

        try {
            setLoading(true);

            await createRefund({
                booking_number: bookingNumber,
                amount: refundAmount,
                refund_mode: mode,
                reference_no: mode === 'ONLINE' ? referenceNo : undefined,
            });

            Alert.alert("Success", "Refund processed successfully");
            onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setMode('CASH');
            setReferenceNo('');
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Refund failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <Text variant="headlineSmall" style={{ marginBottom: 16 }}>Refund Payment</Text>

                <View style={styles.infoContainer}>
                    <Text variant="bodyMedium">Booking: <Text style={{ fontWeight: 'bold' }}>{bookingNumber}</Text></Text>
                    <Text variant="bodyMedium">Refundable Amount: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>₹{refundableAmount}</Text></Text>
                </View>

                <TextInput
                    label="Refund Amount *"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                />

                <Text variant="bodyMedium" style={{ marginTop: 8 }}>Refund Mode *</Text>
                <RadioButton.Group onValueChange={value => setMode(value as 'CASH' | 'ONLINE')} value={mode}>
                    <View style={styles.radioRow}>
                        <RadioButton.Item label="Cash" value="CASH" position="leading" labelStyle={{ textAlign: 'left' }} />
                        <RadioButton.Item label="Online" value="ONLINE" position="leading" labelStyle={{ textAlign: 'left' }} />
                    </View>
                </RadioButton.Group>

                {mode === 'ONLINE' && (
                    <TextInput
                        label="Reference No"
                        value={referenceNo}
                        onChangeText={setReferenceNo}
                        mode="outlined"
                        style={styles.input}
                    />
                )}

                <View style={styles.actions}>
                    <Button onPress={onClose} disabled={loading} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button mode="contained" onPress={submit} loading={loading} disabled={loading} buttonColor={theme.colors.error}>
                        Refund
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    infoContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
    },
});

export default RefundModal;
