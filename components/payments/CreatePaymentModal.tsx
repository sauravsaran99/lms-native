import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Modal, Portal, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';
import { createPayment } from '../../services/api';

interface CreatePaymentModalProps {
    bookingNumber: string;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialAmount?: number;
}

const CreatePaymentModal = ({ bookingNumber, visible, onClose, onSuccess, initialAmount }: CreatePaymentModalProps) => {
    const theme = useTheme();
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
    const [mode, setMode] = useState<'CASH' | 'ONLINE'>('CASH');
    const [referenceNo, setReferenceNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<any>(null);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const submit = async () => {
        const paymentAmount = Number(amount);

        if (!paymentAmount || paymentAmount <= 0) {
            Alert.alert("Error", "Enter valid payment amount");
            return;
        }

        if (mode === 'ONLINE' && !file) {
            Alert.alert("Error", "Please upload payment proof for online payments");
            return;
        }

        try {
            setLoading(true);

            const payload: any = {
                booking_number: bookingNumber,
                amount: paymentAmount,
                payment_mode: mode,
                payment_date: new Date().toISOString(), // Add Date
            };

            if (mode === 'ONLINE') {
                payload.reference_no = referenceNo;

                const fd = new FormData();
                fd.append('booking_number', bookingNumber);
                fd.append('amount', String(paymentAmount));
                fd.append('payment_mode', mode);
                fd.append('payment_date', new Date().toISOString());
                if (referenceNo) fd.append('reference_no', referenceNo);

                if (file) {
                    fd.append('proof', {
                        uri: file.uri,
                        name: file.name,
                        type: file.mimeType || 'application/pdf',
                    } as any);
                }
                await createPayment(fd);
            } else {
                await createPayment(payload);
            }

            Alert.alert("Success", "Payment processed successfully");
            onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setMode('CASH');
            setReferenceNo('');
            setFile(null);
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };



    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <Text variant="headlineSmall" style={{ marginBottom: 16 }}>Record Payment</Text>

                <View style={styles.infoContainer}>
                    <Text variant="bodyMedium">Booking: <Text style={{ fontWeight: 'bold' }}>{bookingNumber}</Text></Text>
                </View>

                <TextInput
                    label="Amount *"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                />

                <Text variant="bodyMedium" style={{ marginTop: 8 }}>Payment Mode *</Text>
                <RadioButton.Group onValueChange={value => setMode(value as 'CASH' | 'ONLINE')} value={mode}>
                    <View style={styles.radioRow}>
                        <RadioButton.Item label="Cash" value="CASH" position="leading" labelStyle={{ textAlign: 'left' }} />
                        <RadioButton.Item label="Online" value="ONLINE" position="leading" labelStyle={{ textAlign: 'left' }} />
                    </View>
                </RadioButton.Group>

                {mode === 'ONLINE' && (
                    <>
                        <TextInput
                            label="Reference No"
                            value={referenceNo}
                            onChangeText={setReferenceNo}
                            mode="outlined"
                            style={styles.input}
                        />
                        <Text variant="bodyMedium" style={{ marginTop: 8, marginBottom: 4 }}>Proof Document *</Text>
                        <TouchableOpacity onPress={pickDocument} style={[styles.uploadArea, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant }]}>
                            {file ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="file-check" size={24} color={theme.colors.primary} />
                                    <Text style={{ marginLeft: 8, flex: 1 }} numberOfLines={1}>{file.name}</Text>
                                    <TouchableOpacity onPress={() => setFile(null)}>
                                        <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', padding: 12 }}>
                                    <MaterialCommunityIcons name="cloud-upload" size={24} color={theme.colors.secondary} />
                                    <Text variant="bodySmall" style={{ marginTop: 4 }}>Upload Proof (PDF/Image)</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                <View style={styles.actions}>
                    <Button onPress={onClose} disabled={loading} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button mode="contained" onPress={submit} loading={loading} disabled={loading}>
                        Pay
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
    uploadArea: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 8,
        marginTop: 4,
        marginBottom: 12,
    },
});

export default CreatePaymentModal;
