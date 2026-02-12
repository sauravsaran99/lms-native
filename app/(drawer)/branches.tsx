import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DataTable, Dialog, FAB, Portal, Text, TextInput } from 'react-native-paper';
import api from '../../services/api';
import { useGlobalStyles } from '../globalStyles';

interface Branch {
    id: number;
    name: string;
    city: string;
    contact_number: string;
    is_active: boolean;
}

export default function BranchesScreen() {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [itemsPerPage] = useState(10);
    const [refreshing, setRefreshing] = useState(false);
    const [totalItems, setTotalItems] = useState(0);

    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    // Dialog State
    const [visible, setVisible] = useState(false);
    const [name, setBranchName] = useState('');
    const [city, setCity] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchBranches = async () => {
        try {
            const response = await api.get(`/branches?page=${page + 1}&limit=${itemsPerPage}`);
            if (response.data && Array.isArray(response.data.data)) {
                setBranches(response.data.data);
                if (response.data.pagination && typeof response.data.pagination.total === 'number') {
                    setTotalItems(response.data.pagination.total);
                } else if (response.data.meta && typeof response.data.meta.total === 'number') {
                    setTotalItems(response.data.meta.total);
                } else {
                    setTotalItems(response.data.data.length);
                }
            } else if (Array.isArray(response.data)) {
                setBranches(response.data);
                setTotalItems(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [page]);

    const showDialog = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setBranchName(branch.name);
            setCity(branch.city);
        } else {
            setEditingBranch(null);
            setBranchName('');
            setCity('');
        }
        setVisible(true);
    };

    const hideDialog = () => {
        setVisible(false);
        setEditingBranch(null);
        setBranchName('');
        setCity('');
    };

    const handleSave = async () => {
        if (!name || !city) {
            alert("Branch Name and City are required");
            return;
        }
        setSubmitting(true);
        try {
            if (editingBranch) {
                await api.put(`/branches/${editingBranch.id}`, { name, city });
            } else {
                await api.post('/branches', { name, city });
            }
            hideDialog();
            fetchBranches();
        } catch (error) {
            console.error("Error saving branch:", error);
            alert("Failed to save branch");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/branches/${id}`);
            fetchBranches();
        } catch (error) {
            console.error("Error deleting branch:", error);
            alert("Failed to delete branch");
        }
    };

    return (
        <View style={[viewStyles.container, { paddingBottom: 0 }]}>
            <View style={[styles.header, { marginBottom: 16 }]}>
                <Text variant="headlineMedium" style={textStyles.title}>Branches</Text>
            </View>

            <DataTable style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <DataTable.Header style={{ backgroundColor: colors.background }}>
                    <DataTable.Title>Branch Name</DataTable.Title>
                    <DataTable.Title>Status</DataTable.Title>
                    <DataTable.Title numeric>Actions</DataTable.Title>
                </DataTable.Header>

                {branches.map((item) => (
                    <DataTable.Row key={item.id}>
                        <DataTable.Cell>{item?.name}</DataTable.Cell>
                        <DataTable.Cell>
                            <Text style={{ color: colors.success, fontWeight: 'bold' }}>
                                {'Active'}
                            </Text>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
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
                    <Dialog.Title style={{ color: colors.primary }}>{editingBranch ? 'Edit Branch' : 'Create New Branch'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Branch Name"
                            value={name}
                            onChangeText={setBranchName}
                            style={viewStyles.input}
                            mode="outlined"
                            theme={{ colors: { text: colors.text } }}
                        />
                        <TextInput
                            label="City"
                            value={city}
                            onChangeText={setCity}
                            style={viewStyles.input}
                            mode="outlined"
                            theme={{ colors: { text: colors.text } }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog} textColor={colors.muted}>Cancel</Button>
                        <Button onPress={handleSave} loading={submitting} disabled={submitting} buttonColor={colors.primary} textColor="#fff">
                            {editingBranch ? 'Update' : 'Create'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
});
