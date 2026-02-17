import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Modal, Portal, ProgressBar, Text, useTheme } from 'react-native-paper';
import { markBookingCompleted } from '../../services/api';
import CreatePaymentModal from '../payments/CreatePaymentModal';
import UploadReportModal from './UploadReportModal';

interface CompleteBookingPopupProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: number;
    booking?: any;
    bookingNumber?: string;
    customerName?: string;
    onSuccess?: () => void;
    pendingAmount: string | number;
}

const CompleteBookingPopup = ({
    isOpen,
    onClose,
    bookingId,
    booking,
    bookingNumber = "",
    customerName = "",
    onSuccess,
    pendingAmount = 0,
}: CompleteBookingPopupProps) => {
    const theme = useTheme();
    const [step, setStep] = useState<"confirm" | "report" | "payment">("confirm");
    const [isLoading, setIsLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await markBookingCompleted(bookingId);
            setStep("report");
            Alert.alert("Success", "Booking marked as completed");
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to complete booking");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReportUploadComplete = () => {
        setShowReportModal(false);
        setStep("payment");
        Alert.alert("Success", "Report uploaded successfully");
    };

    const handlePaymentModalClose = () => {
        setShowPaymentModal(false);
        setStep("confirm"); // Reset step for next time or just close
        onClose();
        onSuccess?.();
    };

    const handleSkipReport = () => {
        setStep("payment");
    };

    if (!isOpen) return null;

    // Show CreatePaymentModal if payment step is active (managed locally or via state)
    // Actually, following the user's logic, "payment" step shows a summary, THEN clicking "Process Payment" opens the modal?
    // User code: if (step === "payment" && !showReportModal) return <CreatePaymentModal ... />
    // So "payment" step immediately SHOWS the modal in the user's web version?
    // In React Native, I can just render the modal on top or switch content.
    // I'll render the components conditionally.

    if (showPaymentModal) {
        return (
            <CreatePaymentModal
                visible={true}
                onClose={handlePaymentModalClose}
                bookingNumber={bookingNumber}
                onSuccess={() => {
                    handlePaymentModalClose();
                }}
                initialAmount={Number(pendingAmount)}
            />
        );
    }

    if (showReportModal) {
        return (
            <UploadReportModal
                booking={booking || { id: bookingId }}
                onClose={() => setShowReportModal(false)}
                onSuccess={handleReportUploadComplete}
            />
        );
    }

    return (
        <Portal>
            <Modal visible={true} onDismiss={onClose} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                {/* Header with Steps */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons
                            name={step === 'confirm' ? "check-circle-outline" : step === 'report' ? "file-upload-outline" : "credit-card-outline"}
                            size={24}
                            color={theme.colors.primary}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text variant="titleMedium">
                            {step === "confirm" && "Confirm Completion"}
                            {step === "report" && "Upload Report"}
                            {step === "payment" && "Process Payment"}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                            Step {step === "confirm" ? 1 : step === "report" ? 2 : 3} of 3
                        </Text>
                    </View>
                    {!isLoading && (
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Progress Bar */}
                <ProgressBar progress={step === "confirm" ? 0.33 : step === "report" ? 0.66 : 1} color={theme.colors.primary} style={{ marginBottom: 20, height: 4, borderRadius: 2 }} />

                {/* Content */}
                {step === "confirm" && (
                    <View>
                        <Text style={{ marginBottom: 16 }}>
                            Are you sure you want to mark this booking as completed? This action cannot be undone.
                        </Text>
                        <View style={[styles.infoBox, { backgroundColor: theme.colors.secondaryContainer }]}>
                            <View style={styles.infoRow}>
                                <Text variant="labelLarge">Booking ID</Text>
                                <Text variant="bodyMedium">{bookingNumber}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text variant="labelLarge">Customer</Text>
                                <Text variant="bodyMedium">{customerName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text variant="labelLarge">Pending Amount</Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.error }}>₹{pendingAmount}</Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <Button onPress={onClose} disabled={isLoading} style={{ marginRight: 8 }}>Cancel</Button>
                            <Button mode="contained" onPress={handleConfirm} loading={isLoading} disabled={isLoading}>
                                Confirm & Continue
                            </Button>
                        </View>
                    </View>
                )}

                {step === "report" && (
                    <View>
                        <Text style={{ marginBottom: 16 }}>
                            Would you like to upload a test report? This is optional but recommended.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => setShowReportModal(true)}
                            icon="file-upload"
                            style={{ marginBottom: 12 }}
                        >
                            Upload Test Report
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={handleSkipReport}
                        >
                            Skip & Continue to Payment
                        </Button>
                    </View>
                )}

                {step === "payment" && (
                    <View>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <MaterialCommunityIcons name="check-circle" size={48} color={theme.colors.primary} />
                            <Text variant="titleMedium" style={{ marginTop: 8 }}>All Set!</Text>
                            <Text variant="bodyMedium">Booking completed. Ready for payment.</Text>
                        </View>
                        <Button
                            mode="contained"
                            onPress={() => setShowPaymentModal(true)}
                            icon="credit-card"
                            buttonColor={theme.colors.tertiary}
                        >
                            Process Payment
                        </Button>
                    </View>
                )}

            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBox: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});

export default CompleteBookingPopup;
