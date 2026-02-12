import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DataTable, Dialog, FAB, Menu, Portal, Text, TextInput } from 'react-native-paper';
import api from '../../services/api';

interface BranchAdmin {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    branch_name?: string;
    base_branch_id?: number;
}

interface Branch {
    id: number;
    name: string;
}

import { useGlobalStyles } from '../globalStyles';

// ... interfaces ...

export default function BranchAdminsScreen() {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [admins, setAdmins] = useState<BranchAdmin[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [editingAdmin, setEditingAdmin] = useState<BranchAdmin | null>(null);

    // Dialog State
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Optional on Edit
    const [baseBranchId, setBaseBranchId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Dropdown state
    const [showDropDown, setShowDropDown] = useState(false);

    const fetchBranchAdmins = async () => {
        try {
            const response = await api.get(`/branch-admin?page=${page + 1}&limit=${itemsPerPage}`);
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                setAdmins(response.data.data);
                const total =
                    response.data.pagination?.total ??
                    response.data.meta?.total ??
                    response.data.total ??
                    response.data.data.length;
                setTotalItems(Number(total) || 0);
            } else if (Array.isArray(response.data)) {
                setAdmins(response.data);
                setTotalItems(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching branch admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches?limit=100');
            if (response.data && response.data.data) {
                setBranches(response.data.data);
            } else if (Array.isArray(response.data)) {
                setBranches(response.data);
            }
        } catch (error) {
            console.error("Error fetching branches for dropdown:", error);
        }
    };

    useEffect(() => {
        fetchBranchAdmins();
        fetchBranches();
    }, [page]);

    const showDialog = (admin?: BranchAdmin) => {
        if (admin) {
            setEditingAdmin(admin);
            setName(admin.name);
            setEmail(admin.email);
            setPassword(''); // Don't prefill password
            setBaseBranchId(admin.base_branch_id ? admin.base_branch_id.toString() : '');
        } else {
            setEditingAdmin(null);
            setName('');
            setEmail('');
            setPassword('');
            setBaseBranchId('');
        }
        setVisible(true);
    };

    const hideDialog = () => {
        setVisible(false);
        setEditingAdmin(null);
        setName('');
        setEmail('');
        setPassword('');
        setBaseBranchId('');
    };

    const handleSave = async () => {
        if (!name || !email || !baseBranchId) {
            alert("Name, Email and Branch are required");
            return;
        }
        // Password required only on create
        if (!editingAdmin && !password) {
            alert("Password is required for new admins");
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                name,
                email,
                base_branch_id: parseInt(baseBranchId)
            };
            if (password) {
                payload.password = password;
            }

            if (editingAdmin) {
                await api.put(`/branch-admin/${editingAdmin.id}`, payload);
            } else {
                await api.post('/branch-admin', payload);
            }
            hideDialog();
            fetchBranchAdmins();
        } catch (error) {
            console.error("Error saving branch admin:", error);
            alert("Failed to save branch admin");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/branch-admin/${id}`);
            fetchBranchAdmins();
        } catch (error) {
            console.error("Error deleting branch admin:", error);
            alert("Failed to delete branch admin");
        }
    };

    return (
        <View style={viewStyles.container}>
            <View style={[styles.header, { marginBottom: 16 }]}>
                <Text variant="headlineMedium" style={textStyles.title}>Branch Admins</Text>
            </View>

            <DataTable style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <DataTable.Header style={{ backgroundColor: colors.background }}>
                    <DataTable.Title>Name</DataTable.Title>
                    <DataTable.Title>Email</DataTable.Title>
                    <DataTable.Title numeric>Actions</DataTable.Title>
                </DataTable.Header>

                {admins.map((item) => (
                    <DataTable.Row key={item.id}>
                        <DataTable.Cell style={{ flex: 1 }}>{item.name}</DataTable.Cell>
                        <DataTable.Cell style={{ flex: 2 }}>{item.email}</DataTable.Cell>
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
                    <Dialog.Title style={{ color: colors.primary }}>{editingAdmin ? 'Edit Admin' : 'Register Admin'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Name"
                            value={name}
                            onChangeText={setName}
                            style={viewStyles.input}
                            mode="outlined"
                            theme={{ colors: { text: colors.text } }}
                        />
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            style={viewStyles.input}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            theme={{ colors: { text: colors.text } }}
                        />
                        <TextInput
                            label={editingAdmin ? "Password (leave blank to keep)" : "Password"}
                            value={password}
                            onChangeText={setPassword}
                            style={viewStyles.input}
                            mode="outlined"
                            secureTextEntry
                            theme={{ colors: { text: colors.text } }}
                        />

                        {/* Simple Branch Select using Menu */}
                        <View style={styles.selectContainer}>
                            <Menu
                                visible={showDropDown}
                                onDismiss={() => setShowDropDown(false)}
                                anchor={
                                    <Button mode="outlined" onPress={() => setShowDropDown(true)} style={[viewStyles.input, { alignItems: 'flex-start', justifyContent: 'center' }]} textColor={colors.text}>
                                        {baseBranchId
                                            ? branches.find(b => b.id === parseInt(baseBranchId))?.name || "Select Branch"
                                            : "Select Branch"}
                                    </Button>
                                }
                            >
                                {branches.map((branch) => (
                                    <Menu.Item
                                        key={branch.id}
                                        onPress={() => {
                                            setBaseBranchId(branch.id.toString());
                                            setShowDropDown(false);
                                        }}
                                        title={branch.name}
                                    />
                                ))}
                            </Menu>
                        </View>

                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog} textColor={colors.muted}>Cancel</Button>
                        <Button onPress={handleSave} loading={submitting} disabled={submitting} buttonColor={colors.primary} textColor="#fff">
                            {editingAdmin ? 'Update' : 'Register'}
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
    },
    selectContainer: {
        marginBottom: 12,
    }
});
