import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DataTable, Dialog, FAB, Portal, Text, TextInput } from 'react-native-paper';
import api from '../../services/api';

interface Doctor {
    id: number;
    name: string;
    specialization: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

import { useGlobalStyles } from '../globalStyles';

// ... interface Doctor ...

export default function DoctorMasterScreen() {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

    // Dialog State
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Helper function to handle varied pagination response structures
    const handleApiResponse = (response: any) => {
        // Structure 1: { data: [...], pagination: { total: ... } }
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
            setDoctors(response.data.data);
            // Check for pagination object or try to infer total
            if (response.data.pagination && typeof response.data.pagination.total === 'number') {
                setTotalItems(response.data.pagination.total);
            } else if (response.data.meta && typeof response.data.meta.total === 'number') {
                setTotalItems(response.data.meta.total);
            } else {
                setTotalItems(response.data.data.length); // Fallback
            }
        }
        // Structure 2: Direct array
        else if (Array.isArray(response.data)) {
            setDoctors(response.data);
            setTotalItems(response.data.length);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get(`/doctors?page=${page + 1}&limit=${itemsPerPage}`);
            handleApiResponse(response);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [page]);

    const showDialog = (doctor?: Doctor) => {
        if (doctor) {
            setEditingDoctor(doctor);
            setName(doctor.name);
            setSpecialization(doctor.specialization);
        } else {
            setEditingDoctor(null);
            setName('');
            setSpecialization('');
        }
        setVisible(true);
    };

    const hideDialog = () => {
        setVisible(false);
        setEditingDoctor(null);
        setName('');
        setSpecialization('');
    };

    const handleSave = async () => {
        if (!name || !specialization) {
            alert("Name and Specialization are required");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name,
                specialization
            };

            if (editingDoctor) {
                await api.put(`/doctors/${editingDoctor.id}`, payload);
            } else {
                await api.post('/doctors', payload);
            }
            hideDialog();
            fetchDoctors();
        } catch (error) {
            console.error("Error saving doctor:", error);
            alert("Failed to save doctor");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/doctors/${id}`);
            fetchDoctors();
        } catch (error) {
            console.error("Error deleting doctor:", error);
            alert("Failed to delete doctor");
        }
    };

    return (
        <View style={viewStyles.container}>
            <View style={[styles.header, { marginBottom: 16 }]}>
                <Text variant="headlineMedium" style={textStyles.title}>Doctor Master</Text>
            </View>

            <DataTable style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <DataTable.Header style={{ backgroundColor: colors.background }}>
                    <DataTable.Title>Name</DataTable.Title>
                    <DataTable.Title>Specialization</DataTable.Title>
                    <DataTable.Title>Status</DataTable.Title>
                    <DataTable.Title numeric>Actions</DataTable.Title>
                </DataTable.Header>

                {doctors.map((item) => (
                    <DataTable.Row key={item.id}>
                        <DataTable.Cell style={{ flex: 2 }}>{item.name}</DataTable.Cell>
                        <DataTable.Cell style={{ flex: 2 }}>{item.specialization}</DataTable.Cell>
                        <DataTable.Cell style={{ flex: 1 }}>
                            <Text style={{ color: item.is_active ? colors.success : colors.error }}>
                                {item.is_active ? 'Active' : 'Inactive'}
                            </Text>
                        </DataTable.Cell>
                        <DataTable.Cell numeric style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                <Button onPress={() => showDialog(item)} compact>
                                    <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                                </Button>
                                <Button onPress={() => handleDelete(item.id)} compact>
                                    <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                                </Button>
                            </View>
                        </DataTable.Cell>
                    </DataTable.Row>
                ))}

                <DataTable.Pagination
                    page={page}
                    numberOfPages={Math.ceil(totalItems / itemsPerPage)}
                    onPageChange={(page) => setPage(page)}
                    label={`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, totalItems)} of ${totalItems}`}
                    numberOfItemsPerPage={itemsPerPage}
                    showFastPaginationControls
                    selectPageDropdownLabel={'Rows per page'}
                />
            </DataTable>

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => showDialog()}
                color="white"
            />

            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title style={{ color: colors.primary }}>{editingDoctor ? 'Edit Doctor' : 'Create New Doctor'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Doctor Name"
                            value={name}
                            onChangeText={setName}
                            style={viewStyles.input}
                            mode="outlined"
                            theme={{ colors: { text: colors.text } }}
                        />
                        <TextInput
                            label="Specialization"
                            value={specialization}
                            onChangeText={setSpecialization}
                            style={viewStyles.input}
                            mode="outlined"
                            theme={{ colors: { text: colors.text } }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog} textColor={colors.muted}>Cancel</Button>
                        <Button onPress={handleSave} loading={submitting} disabled={submitting} buttonColor={colors.primary} textColor="#fff">
                            {editingDoctor ? 'Update' : 'Create'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    input: {
        marginBottom: 12,
    }
});
