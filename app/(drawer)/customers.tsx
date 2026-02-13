import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, FAB, Text, useTheme } from 'react-native-paper';
import CustomerFormModal from '../../components/customers/CustomerFormModal';
import { useAuth } from '../../context/AuthContext';
import { Customer, getCustomers } from '../../services/customer';

const Customers = () => {
    const theme = useTheme();
    const router = useRouter();
    const { userRole } = useAuth();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Limit per page
    const LIMIT = 10;

    const fetchCustomers = useCallback(async (pageNum: number, refresh = false) => {
        if (loading) return;

        setLoading(true);
        try {
            const res = await getCustomers(pageNum, LIMIT, false);
            let newCustomers: Customer[] = [];

            if (res.data?.data && Array.isArray(res.data.data)) {
                newCustomers = res.data.data;
            } else if (res.data?.customers) {
                newCustomers = res.data.customers;
            } else if (Array.isArray(res.data)) {
                newCustomers = res.data;
            }

            if (refresh) {
                setCustomers(newCustomers);
            } else {
                setCustomers(prev => [...prev, ...newCustomers]);
            }

            setHasMore(newCustomers.length === LIMIT);
            setPage(pageNum);

        } catch (error) {
            console.error("Failed to fetch customers:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loading]);

    useEffect(() => {
        fetchCustomers(1, true);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        fetchCustomers(1, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchCustomers(page + 1);
        }
    };

    const renderItem = ({ item }: { item: Customer }) => (
        <View style={[styles.itemContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
            <View style={styles.avatarContainer}>
                {item.profile_image ? (
                    <Avatar.Image size={50} source={{ uri: item.profile_image.startsWith('http') ? item.profile_image : `http://localhost:5000${item.profile_image}` }} />
                ) : (
                    <Avatar.Text size={50} label={item.name.substring(0, 2).toUpperCase()} style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />
                )}
            </View>
            <View style={styles.infoContainer}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.name}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{item.phone}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{item.city}, {item.state}</Text>
            </View>
            {/* Edit Button - Optional, kept simple for now */}
            <FAB
                icon="pencil"
                style={[styles.editFab, { backgroundColor: theme.colors.secondaryContainer }]}
                color={theme.colors.onSecondaryContainer}
                size="small"
                onPress={() => {
                    setEditCustomer(item);
                    setShowModal(true);
                }}
            />
        </View>
    );

    const renderFooter = () => {
        if (!loading) return null;
        return <ActivityIndicator style={{ margin: 20 }} />;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 10 }}>Customers</Text>
            </View>

            <FlatList
                data={customers}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListFooterComponent={renderFooter}
                contentContainerStyle={{ paddingBottom: 80 }}
                ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 20 }}>No customers found.</Text> : null}
            />

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
                onPress={() => {
                    setEditCustomer(null);
                    setShowModal(true);
                }}
            />

            <CustomerFormModal
                isOpen={showModal}
                initialData={editCustomer || undefined}
                onClose={() => setShowModal(false)}
                onSuccess={(updatedCustomer) => {
                    // Optimistic update or refresh
                    onRefresh();
                    setShowModal(false);
                }}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 8,
        borderBottomWidth: 1,
        elevation: 1,
    },
    avatarContainer: {
        marginRight: 15,
    },
    infoContainer: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    editFab: {
        margin: 0,
        backgroundColor: 'transparent',
        elevation: 0,
    }
});

export default Customers;
