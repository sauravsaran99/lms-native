import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DataTable, Dialog, FAB, Portal, Text, TextInput } from 'react-native-paper';
import api from '../../services/api';

interface Test {
    id: number;
    name: string;
    category: string;
    price: number;
    is_active: boolean;
}

import { useGlobalStyles } from '../globalStyles';

// ... interface Test ...

export default function TestMasterScreen() {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [editingTest, setEditingTest] = useState<Test | null>(null);

    // Dialog State
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTests = async () => {
        try {
            const response = await api.get(`/tests?page=${page + 1}&limit=${itemsPerPage}`);
            if (response.data && Array.isArray(response.data.data)) {
                setTests(response.data.data);
                if (response.data.pagination && typeof response.data.pagination.total === 'number') {
                    setTotalItems(response.data.pagination.total);
                } else if (response.data.meta && typeof response.data.meta.total === 'number') {
                    setTotalItems(response.data.meta.total);
                } else {
                    setTotalItems(response.data.data.length);
                }
            } else if (Array.isArray(response.data)) {
                setTests(response.data);
                setTotalItems(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, [page]);

    const showDialog = (test?: Test) => {
        if (test) {
            setEditingTest(test);
            setName(test.name);
            setCategory(test.category);
            setPrice(test.price.toString());
        } else {
            setEditingTest(null);
            setName('');
            setCategory('');
            setPrice('');
        }
        setVisible(true);
    };

    const hideDialog = () => {
        setVisible(false);
        setEditingTest(null);
        setName('');
        setCategory('');
        setPrice('');
    };

    const handleSave = async () => {
        if (!name || !category || !price) {
            alert("All fields are required");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name,
                category,
                price: parseFloat(price)
            };

            if (editingTest) {
                await api.put(`/tests/${editingTest.id}`, payload);
            } else {
                await api.post('/tests', payload);
            }
            hideDialog();
            fetchTests();
        } catch (error) {
            console.error("Error saving test:", error);
            alert("Failed to save test");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/tests/${id}`);
            fetchTests();
        } catch (error) {
            console.error("Error deleting test:", error);
            alert("Failed to delete test");
        }
    };

    return (
        <View style={viewStyles.container}>
            <View style={[styles.header, { marginBottom: 16 }]}>
                <Text variant="headlineMedium" style={textStyles.title}>Test Master</Text>
            </View>

            <DataTable style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <DataTable.Header style={{ backgroundColor: colors.background }}>
                    <DataTable.Title>Name</DataTable.Title>
                    <DataTable.Title>Category</DataTable.Title>
                    <DataTable.Title numeric>Price</DataTable.Title>
                    <DataTable.Title numeric>Actions</DataTable.Title>
                </DataTable.Header>

                {tests.map((item) => (
                    <DataTable.Row key={item.id}>
                        <DataTable.Cell style={{ flex: 2 }}>{item.name}</DataTable.Cell>
                        <DataTable.Cell style={{ flex: 1.5 }}>{item.category}</DataTable.Cell>
                        <DataTable.Cell numeric style={{ flex: 1 }}>₹{item.price}</DataTable.Cell>
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
                    <Dialog.Title style={{ color: colors.primary }}>{editingTest ? 'Edit Test' : 'Create New Test'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Test Name"
                            value={name}
                            onChangeText={setName}
                            style={viewStyles.input}
                            mode="outlined"
                            theme={{ colors: { text: colors.text } }}
                        />
                        <TextInput
                            label="Category"
                            value={category}
                            onChangeText={setCategory}
                            style={viewStyles.input}
                            mode="outlined"
                            theme={{ colors: { text: colors.text } }}
                        />
                        <TextInput
                            label="Price"
                            value={price}
                            onChangeText={setPrice}
                            style={viewStyles.input}
                            mode="outlined"
                            keyboardType="numeric"
                            theme={{ colors: { text: colors.text } }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog} textColor={colors.muted}>Cancel</Button>
                        <Button onPress={handleSave} loading={submitting} disabled={submitting} buttonColor={colors.primary} textColor="#fff">
                            {editingTest ? 'Update' : 'Create'}
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
