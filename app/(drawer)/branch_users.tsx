import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Checkbox, Chip, DataTable, Dialog, FAB, Menu, Portal, Text, TextInput } from 'react-native-paper';
import api from '../../services/api';
import { useGlobalStyles } from '../globalStyles';

interface BranchUser {
    id: number;
    name: string;
    email: string;
    role_id: number;
    base_branch_id: number;
    is_active: boolean;
    Role: {
        name: string;
    };
}

interface Branch {
    id: number;
    name: string;
}

export default function BranchUsersScreen() {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [users, setUsers] = useState<BranchUser[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Dialog & Form State
    const [visible, setVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<BranchUser | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'RECEPTIONIST' | 'TECHNICIAN'>('RECEPTIONIST');
    const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
    const [roleMenuVisible, setRoleMenuVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchBranchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/branch-admin/users?page=${page + 1}&limit=${itemsPerPage}`);
            if (response.data && response.data.data) {
                setUsers(response.data.data);
                const total = response.data.pagination?.total || response.data.data.length;
                setTotalItems(Number(total) || 0);
            } else if (Array.isArray(response.data)) {
                setUsers(response.data);
                setTotalItems(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching branch users:', error);
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
            console.error("Error fetching branches:", error);
        }
    };

    useEffect(() => {
        fetchBranchUsers();
        fetchBranches();
    }, [page]);

    const showDialog = (user?: BranchUser) => {
        if (user) {
            setEditingUser(user);
            setName(user.name);
            setEmail(user.email);
            setPassword(''); // Don't prefill password
            const userRoleName = user.Role?.name?.toUpperCase();
            const mappedRole = userRoleName === 'TECHNICIAN' ? 'TECHNICIAN' : 'RECEPTIONIST';
            setRole(mappedRole);
            // Partial support for branches: pre-select base branch if technician
            // Ideally we should fetch full user details to get all branches
            if (mappedRole === 'TECHNICIAN' && user.base_branch_id) {
                setSelectedBranchIds([user.base_branch_id]);
            } else {
                setSelectedBranchIds([]);
            }
        } else {
            setEditingUser(null);
            setName('');
            setEmail('');
            setPassword('');
            setRole('RECEPTIONIST');
            setSelectedBranchIds([]);
        }
        setVisible(true);
    };

    const hideDialog = () => {
        setVisible(false);
        setEditingUser(null);
    };

    const handleBranchToggle = (branchId: number) => {
        setSelectedBranchIds(prev => {
            if (prev.includes(branchId)) {
                return prev.filter(id => id !== branchId);
            } else {
                return [...prev, branchId];
            }
        });
    };

    const handleStatusChange = async (id: number, currentStatus: boolean) => {
        try {
            await api.patch(`/branch-admin/users/${id}/status`);
            // Optimistic update or refresh
            fetchBranchUsers();
        } catch (error) {
            console.error("Error changing status:", error);
            alert("Failed to update status");
        }
    };

    const handleSave = async () => {
        if (!name || !email) {
            alert("Name and Email are required");
            return;
        }

        // Password required for creation, optional for edit
        if (!editingUser && !password) {
            alert("Password is required for new users");
            return;
        }

        if (role === 'TECHNICIAN' && selectedBranchIds.length === 0) {
            alert("Please select at least one branch for Technician");
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                name,
                email,
                role,
                branchIds: role === 'TECHNICIAN' ? selectedBranchIds : []
            };

            if (password) {
                payload.password = password;
            }

            if (editingUser) {
                await api.put(`/branch-admin/users/${editingUser.id}`, payload);
            } else {
                await api.post('/branch-admin/users', payload);
            }

            hideDialog();
            fetchBranchUsers();
        } catch (error: any) {
            console.error("Error saving user:", error);
            alert(error.response?.data?.message || "Failed to save user");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={viewStyles.container}>
            <View style={[styles.header, { marginBottom: 16 }]}>
                <Text variant="headlineMedium" style={textStyles.title}>Branch Users</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <DataTable style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                    <DataTable.Header style={{ backgroundColor: colors.background }}>
                        <DataTable.Title style={{ flex: 2 }}>Name</DataTable.Title>
                        <DataTable.Title style={{ flex: 2 }}>Email</DataTable.Title>
                        <DataTable.Title>Role</DataTable.Title>
                        <DataTable.Title>Status</DataTable.Title>
                        <DataTable.Title numeric>Actions</DataTable.Title>
                    </DataTable.Header>

                    {users.map((item) => (
                        <DataTable.Row key={item.id}>
                            <DataTable.Cell style={{ flex: 2 }}>{item.name}</DataTable.Cell>
                            <DataTable.Cell style={{ flex: 2 }}>{item.email}</DataTable.Cell>
                            <DataTable.Cell>{item.Role?.name || 'N/A'}</DataTable.Cell>
                            <DataTable.Cell>
                                <Chip
                                    mode="outlined"
                                    style={{ backgroundColor: item.is_active ? '#E8F5E9' : '#FFEBEE', borderColor: 'transparent' }}
                                    textStyle={{ color: item.is_active ? '#2E7D32' : '#C62828', fontSize: 12 }}
                                >
                                    {item.is_active ? 'Active' : 'Inactive'}
                                </Chip>
                            </DataTable.Cell>
                            <DataTable.Cell numeric>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <Button onPress={() => showDialog(item)} compact style={{ minWidth: 0, paddingHorizontal: 0 }}>
                                        <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                                    </Button>
                                    <Button onPress={() => handleStatusChange(item.id, item.is_active)} compact style={{ minWidth: 0, paddingHorizontal: 0 }}>
                                        <MaterialCommunityIcons
                                            name={item.is_active ? "account-off" : "account-check"}
                                            size={20}
                                            color={item.is_active ? colors.error : colors.primary}
                                        />
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
            )}

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => showDialog()}
                color="white"
            />

            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog} style={{ maxHeight: '80%' }}>
                    <Dialog.Title>{editingUser ? 'Edit User' : 'Add New User'}</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
                            <TextInput
                                label="Name"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.input}
                            />
                            <TextInput
                                label={editingUser ? "Password (leave blank to keep)" : "Password"}
                                value={password}
                                onChangeText={setPassword}
                                mode="outlined"
                                secureTextEntry
                                style={styles.input}
                            />

                            <View style={styles.input}>
                                <Menu
                                    visible={roleMenuVisible}
                                    onDismiss={() => setRoleMenuVisible(false)}
                                    anchor={
                                        <Button mode="outlined" onPress={() => setRoleMenuVisible(true)} contentStyle={{ justifyContent: 'flex-start' }}>
                                            {role}
                                        </Button>
                                    }
                                >
                                    <Menu.Item onPress={() => { setRole('RECEPTIONIST'); setRoleMenuVisible(false); }} title="RECEPTIONIST" />
                                    <Menu.Item onPress={() => { setRole('TECHNICIAN'); setRoleMenuVisible(false); }} title="TECHNICIAN" />
                                </Menu>
                            </View>

                            {role === 'TECHNICIAN' && (
                                <View style={{ marginTop: 10 }}>
                                    <Text variant="bodyMedium" style={{ marginBottom: 8, fontWeight: 'bold' }}>Select Branches:</Text>
                                    {branches.map((branch) => (
                                        <Checkbox.Item
                                            key={branch.id}
                                            label={branch.name}
                                            status={selectedBranchIds.includes(branch.id) ? 'checked' : 'unchecked'}
                                            onPress={() => handleBranchToggle(branch.id)}
                                            style={{ paddingVertical: 0 }}
                                        />
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={hideDialog} textColor={colors.muted}>Cancel</Button>
                        <Button onPress={handleSave} loading={submitting} disabled={submitting}>
                            {editingUser ? 'Update' : 'Save'}
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
});
