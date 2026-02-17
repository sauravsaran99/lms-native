import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Menu, Modal, Portal, RadioButton, Text, useTheme } from 'react-native-paper';
import { getDoctors, uploadReport } from '../../services/api';

const UploadReportModal = ({ booking, onClose, onSuccess }: any) => {
    const theme = useTheme();
    const [file, setFile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [doctors, setDoctors] = useState<{ id: number; name: string; specialization?: string }[]>([]);
    const [tagType, setTagType] = useState<"SELF" | "DOCTOR">("SELF");
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const [doctorMenuVisible, setDoctorMenuVisible] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const { data } = await getDoctors({ page: 1, limit: 100 });
                setDoctors(data);
            } catch (e) {
                console.error("Failed to fetch doctors", e);
            }
        };
        fetchDoctors();
    }, []);

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
        if (!file) {
            Alert.alert("Error", "Please select a report file");
            return;
        }

        if (tagType === "DOCTOR" && !selectedDoctorId) {
            Alert.alert("Error", "Please select a doctor");
            return;
        }

        setIsLoading(true);
        try {
            await uploadReport(
                booking.id,
                file,
                tagType === "DOCTOR" ? selectedDoctorId! : undefined
            );
            Alert.alert("Success", "Report uploaded successfully");
            onSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            Alert.alert("Error", e.response?.data?.message || "Failed to upload report");
        } finally {
            setIsLoading(false);
        }
    };

    const getSelectedDoctorName = () => {
        if (!selectedDoctorId) return "Select a Doctor";
        const doc = doctors.find(d => d.id === selectedDoctorId);
        return doc ? doc.name : "Select a Doctor";
    };

    return (
        <Portal>
            <Modal visible={true} onDismiss={onClose} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="file-upload" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text variant="titleMedium">Upload Test Report</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>PDF, JPG, or PNG (Max 10MB)</Text>
                    </View>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={pickDocument} style={[styles.uploadArea, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant }]}>
                    {file ? (
                        <View style={{ alignItems: 'center' }}>
                            <MaterialCommunityIcons name="file-check" size={32} color={theme.colors.primary} />
                            <Text style={{ marginTop: 8, fontWeight: 'bold' }}>{file.name}</Text>
                            <Text variant="bodySmall">{(file.size / 1024).toFixed(2)} KB</Text>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <MaterialCommunityIcons name="cloud-upload" size={32} color={theme.colors.secondary} />
                            <Text style={{ marginTop: 8 }}>Click to upload file</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text variant="bodyMedium" style={{ marginTop: 16, marginBottom: 8 }}>Tag Report To</Text>
                <RadioButton.Group onValueChange={value => setTagType(value as "SELF" | "DOCTOR")} value={tagType}>
                    <View style={styles.radioRow}>
                        <RadioButton.Item label="Self (Patient)" value="SELF" position="leading" labelStyle={{ textAlign: 'left' }} />
                        <RadioButton.Item label="Doctor" value="DOCTOR" position="leading" labelStyle={{ textAlign: 'left' }} />
                    </View>
                </RadioButton.Group>

                {tagType === 'DOCTOR' && (
                    <Menu
                        visible={doctorMenuVisible}
                        onDismiss={() => setDoctorMenuVisible(false)}
                        anchor={
                            <Button mode="outlined" onPress={() => setDoctorMenuVisible(true)} style={{ marginTop: 8 }}>
                                {getSelectedDoctorName()}
                            </Button>
                        }
                    >
                        {doctors.map(doc => (
                            <Menu.Item
                                key={doc.id}
                                onPress={() => {
                                    setSelectedDoctorId(doc.id);
                                    setDoctorMenuVisible(false);
                                }}
                                title={`${doc.name} (${doc.specialization || "General"})`}
                            />
                        ))}
                    </Menu>
                )}

                <View style={styles.actions}>
                    <Button onPress={onClose} disabled={isLoading} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button mode="contained" onPress={submit} loading={isLoading} disabled={isLoading || !file}>
                        Upload Report
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
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(100, 0, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadArea: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
    },
});

export default UploadReportModal;
