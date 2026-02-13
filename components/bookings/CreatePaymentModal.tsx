import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, IconButton, Modal, Portal, RadioButton, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { createPayment } from "../../services/payment";

interface Props {
    bookingNumber: string | null;
    onClose: () => void;
    pendingAmount?: number;
}

const CreatePaymentModal = ({ bookingNumber: initialBookingNumber, onClose, pendingAmount = 0 }: Props) => {
    const theme = useTheme();
    const [bookingNumber, setBookingId] = useState(initialBookingNumber || "");
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
    const [openDate, setOpenDate] = useState(false);
    const [mode, setMode] = useState("CASH");
    const [file, setFile] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(String(pendingAmount));

    // Snackbar state
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            showSnackbar("Error picking file", 'error');
        }
    };

    const submit = async () => {
        if (mode === "ONLINE" && !file) {
            showSnackbar("Please upload payment proof", 'error');
            return;
        }

        if (!bookingNumber.trim()) {
            showSnackbar("Booking number is required", 'error');
            return;
        }

        if (!amount || Number(amount) <= 0) {
            showSnackbar("Valid amount is required", 'error');
            return;
        }

        if (!paymentDate) {
            showSnackbar("Payment Date is required", 'error');
            return;
        }

        const fd = new FormData();
        fd.append("booking_number", bookingNumber);
        fd.append("amount", amount);
        fd.append("payment_mode", mode);

        const dateStr = new Date(paymentDate.getTime() - (paymentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        fd.append("payment_date", dateStr);

        if (mode === "ONLINE" && file) {
            // React Native FormData expects an object with uri, name, type for files
            const fileObj = {
                uri: file.uri,
                name: file.name || 'proof.jpg',
                type: file.mimeType || 'image/jpeg',
            } as any;
            fd.append("proof", fileObj);
        }

        try {
            setLoading(true);
            await createPayment(fd);
            showSnackbar("Payment added successfully", 'success');
            // Wait for user to see success message before closing
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (e: any) {
            const msg = e.response?.data?.message || "Failed to create payment";
            showSnackbar(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal visible={true} onDismiss={onClose} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                        <IconButton icon="cash-plus" iconColor={theme.colors.primary} size={24} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleMedium">Create Payment</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Add a new payment transaction</Text>
                    </View>
                    <IconButton icon="close" onPress={onClose} />
                </View>

                <View style={styles.body}>
                    <TextInput
                        label={<Text>Booking ID <Text style={{ color: theme.colors.error }}>*</Text></Text>}
                        value={bookingNumber}
                        onChangeText={setBookingId}
                        mode="outlined"
                        disabled={loading}
                        style={{ backgroundColor: theme.colors.surface }}
                    />

                    <TouchableOpacity onPress={() => setOpenDate(true)}>
                        <TextInput
                            label={<Text>Payment Date <Text style={{ color: theme.colors.error }}>*</Text></Text>}
                            value={paymentDate ? paymentDate.toLocaleDateString() : ""}
                            mode="outlined"
                            editable={false}
                            style={{ backgroundColor: theme.colors.surface }}
                            right={<TextInput.Icon icon="calendar" onPress={() => setOpenDate(true)} />}
                        />
                    </TouchableOpacity>

                    <DatePickerModal
                        locale="en"
                        mode="single"
                        visible={openDate}
                        onDismiss={() => setOpenDate(false)}
                        date={paymentDate}
                        onConfirm={(params) => {
                            setOpenDate(false);
                            setPaymentDate(params.date);
                        }}
                    />

                    <TextInput
                        label={<Text>Payment Amount <Text style={{ color: theme.colors.error }}>*</Text></Text>}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        disabled={loading}
                        style={{ backgroundColor: theme.colors.surface }}
                    />

                    <Text variant="labelLarge" style={{ marginTop: 10 }}>Payment Mode <Text style={{ color: theme.colors.error }}>*</Text></Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity style={[
                            styles.radioItem,
                            { borderColor: theme.colors.outline },
                            mode === 'CASH' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.secondaryContainer }
                        ]} onPress={() => { setMode('CASH'); setFile(null); }}>
                            <RadioButton value="CASH" status={mode === 'CASH' ? 'checked' : 'unchecked'} onPress={() => { setMode('CASH'); setFile(null); }} />
                            <Text>Cash Payment</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[
                            styles.radioItem,
                            { borderColor: theme.colors.outline },
                            mode === 'ONLINE' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.secondaryContainer }
                        ]} onPress={() => setMode('ONLINE')}>
                            <RadioButton value="ONLINE" status={mode === 'ONLINE' ? 'checked' : 'unchecked'} onPress={() => setMode('ONLINE')} />
                            <Text>ONLINE with Proof</Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'ONLINE' && (
                        <View style={[styles.uploadContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
                            <Text variant="labelMedium" style={{ marginBottom: 5 }}>Upload Proof Document <Text style={{ color: theme.colors.error }}>*</Text></Text>
                            <TouchableOpacity style={[styles.uploadBox, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]} onPress={handleFilePick}>
                                <IconButton icon="cloud-upload" size={30} iconColor={theme.colors.primary} />
                                <Text>{file ? file.name : "Click to upload"}</Text>
                                {!file && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>PDF, JPG, PNG</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                </View>

                <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
                    <Button mode="outlined" onPress={onClose} disabled={loading} style={{ marginRight: 10 }}>Cancel</Button>
                    <Button mode="contained" onPress={submit} loading={loading} disabled={loading}>
                        {loading ? "Creating..." : "Create Payment"}
                    </Button>
                </View>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    style={{ backgroundColor: snackbarType === 'error' ? theme.colors.error : theme.colors.primary }}
                >
                    {snackbarMessage}
                </Snackbar>

            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        margin: 20,
        borderRadius: 12,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    iconContainer: {
        borderRadius: 8,
        marginRight: 15,
    },
    body: {
        gap: 15,
    },
    radioGroup: {
        gap: 10,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        padding: 5,
    },
    uploadContainer: {
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    uploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 8,
        alignItems: 'center',
        padding: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
    },
});

export default CreatePaymentModal;
