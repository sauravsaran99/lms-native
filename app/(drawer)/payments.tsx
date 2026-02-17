import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, Menu, Searchbar, Text, TextInput, useTheme } from 'react-native-paper';
import CreatePaymentModal from '../../components/payments/CreatePaymentModal';
import RefundModal from '../../components/payments/RefundModal';
import { useAuth } from '../../context/AuthContext';
import { getBookingPayments, getTests, searchCustomers } from '../../services/api';

const Payments = () => {
    const theme = useTheme();
    const router = useRouter();
    const { userRole } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filters
    const [bookingNumber, setBookingNumber] = useState('');
    const [selectedTest, setSelectedTest] = useState<{ value: string; label: string } | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<{ value: string; label: string } | null>(null);

    // UI State
    const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [refundModalVisible, setRefundModalVisible] = useState(false);
    const [selectedBookingForAction, setSelectedBookingForAction] = useState<string | null>(null);
    const [refundBookingData, setRefundBookingData] = useState<any>(null);

    // Filter Menus/Search
    const [testMenuVisible, setTestMenuVisible] = useState(false);
    const [testOptions, setTestOptions] = useState<{ value: string; label: string }[]>([]);
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
    const [customerMenuVisible, setCustomerMenuVisible] = useState(false);

    const isCustomer = userRole === 'CUSTOMER';

    // Load Tests
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await getTests({ page: 1, limit: 100 });
                if (res.data?.data) {
                    setTestOptions(res.data.data.map((t: any) => ({
                        value: String(t.id),
                        label: t.name,
                    })));
                }
            } catch (e) {
                console.error("Failed to load tests", e);
            }
        };
        fetchTests();
    }, []);

    // Search Customers
    const loadCustomerOptions = async (query: string) => {
        if (!query) {
            setCustomerOptions([]);
            return;
        }
        try {
            const res = await searchCustomers(query);
            const options = res.data?.data.map((c: any) => ({
                value: String(c.id),
                label: `${c.name} (${c.phone})`,
            })) || [];
            setCustomerOptions(options);
            setCustomerMenuVisible(true);
        } catch (e) {
            console.error("Failed to search customers", e);
        }
    };

    const debouncedCustomerSearch = useCallback(debounce(loadCustomerOptions, 500), []);

    const loadData = useCallback(async (pageNum: number = 1, isInfinite: boolean = false) => {
        try {
            if (isInfinite) {
                setIsLoadingMore(true);
            } else {
                setLoading(true);
            }

            const res = await getBookingPayments({
                page: pageNum,
                limit: 10,
                test_id: selectedTest?.value,
                customer_id: selectedCustomer?.value,
                booking_number: bookingNumber || undefined,
            });

            const newBookings = res.data?.data || res.data || [];
            const shouldHaveMore = newBookings.length === 10;

            if (isInfinite) {
                setBookings(prev => [...prev, ...newBookings]);
            } else {
                setBookings(newBookings);
            }

            setPage(pageNum);
            setHasMore(shouldHaveMore);
        } catch (error: any) {
            console.error("Failed to load payments", error);
            if (!isInfinite) Alert.alert("Error", "Failed to load payments");
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsLoadingMore(false);
        }
    }, [selectedTest, selectedCustomer, bookingNumber]);

    useEffect(() => {
        if (!isCustomer) {
            loadData(1, false);
        }
    }, [loadData, isCustomer]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData(1, false);
    };

    const handleLoadMore = () => {
        if (hasMore && !isLoadingMore && !loading) {
            loadData(page + 1, true);
        }
    };

    const toggleExpand = (bookingNum: string) => {
        setExpandedBookings(prev => ({
            ...prev,
            [bookingNum]: !prev[bookingNum]
        }));
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return theme.colors.primary; // or green
            case 'PENDING': return theme.colors.error; // or orange
            case 'PARTIALLY_PAID': return theme.colors.secondary;
            default: return theme.colors.onSurfaceVariant;
        }
    };

    if (isCustomer) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <Text>Access Denied</Text>
            </View>
        );
    }

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return <ActivityIndicator style={{ margin: 20 }} />;
    };

    const renderItem = ({ item }: { item: any }) => {
        const isExpanded = expandedBookings[item.booking_number];
        const balance = Number(item.balance);
        const totalPaid = Number(item.total_paid);
        const totalRefunded = Number(item.total_refunded || 0);
        const netPaid = totalPaid - totalRefunded;

        return (
            <Card style={styles.card} mode="elevated">
                <Card.Content>
                    <View style={styles.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <TouchableOpacity onPress={() => toggleExpand(item.booking_number)} style={{ marginRight: 8 }}>
                                <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={theme.colors.onSurface} />
                            </TouchableOpacity>
                            <View>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>#{item.booking_number}</Text>
                                <Text variant="bodySmall" style={{ color: getPaymentStatusColor(item.payment_status) }}>
                                    {item.payment_status.replace(/_/g, " ")}
                                </Text>
                            </View>
                        </View>
                        < View style={{ alignItems: 'flex-end' }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>₹{Number(item.final_amount).toLocaleString('en-IN')}</Text>
                            <Text variant="bodySmall" style={{ color: balance > 0 ? theme.colors.error : theme.colors.primary }}>
                                Bal: ₹{balance.toLocaleString('en-IN')}
                            </Text>
                        </View>
                    </View>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.row}>
                        <View>
                            <Text variant="bodySmall">Paid</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>₹{netPaid.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {balance > 0 && (
                                <Button mode="contained" compact onPress={() => {
                                    setSelectedBookingForAction(item.booking_number);
                                    setPaymentModalVisible(true);
                                }}>
                                    Pay
                                </Button>
                            )}
                            {totalPaid > totalRefunded && (
                                <Button mode="outlined" compact onPress={() => {
                                    setRefundBookingData(item);
                                    setRefundModalVisible(true);
                                }} textColor={theme.colors.error} style={{ borderColor: theme.colors.error }}>
                                    Refund
                                </Button>
                            )}
                        </View>
                    </View>

                    {isExpanded && (
                        <View style={{ marginTop: 16, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 8 }}>
                            <Text variant="titleSmall" style={{ marginBottom: 8 }}>Payment History</Text>
                            {item.payments && item.payments.length > 0 ? (
                                item.payments.map((p: any, idx: number) => (
                                    <View key={p.id || idx} style={{ marginBottom: 8, paddingBottom: 8, borderBottomWidth: idx < item.payments.length - 1 ? 1 : 0, borderBottomColor: theme.colors.outlineVariant }}>
                                        <View style={styles.row}>
                                            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>₹{Number(p.amount).toLocaleString('en-IN')}</Text>
                                            <Text variant="bodySmall">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "-"}</Text>
                                        </View>
                                        <View style={styles.row}>
                                            <Text variant="bodySmall">{p.payment_mode}</Text>
                                            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>By: {p.collected_by_role}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text variant="bodySmall" style={{ fontStyle: 'italic', textAlign: 'center', padding: 8 }}>No payments recorded.</Text>
                            )}
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Filters */}
            <View style={{ padding: 16 }}>
                <Searchbar
                    placeholder="Search Booking Number"
                    onChangeText={(query) => {
                        setBookingNumber(query);
                        // Trigger reload via useEffect dependency
                    }}
                    value={bookingNumber}
                    style={{ marginBottom: 12 }}
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Test Filter */}
                    <Menu
                        visible={testMenuVisible}
                        onDismiss={() => setTestMenuVisible(false)}
                        anchor={
                            <Button mode="outlined" onPress={() => setTestMenuVisible(true)} style={{ flex: 1 }}>
                                {selectedTest ? selectedTest.label : "Filter by Test"}
                            </Button>
                        }
                    >
                        <Menu.Item onPress={() => { setSelectedTest(null); setTestMenuVisible(false); }} title="Clear Selection" />
                        <Divider />
                        {testOptions.map(t => (
                            <Menu.Item key={t.value} onPress={() => { setSelectedTest(t); setTestMenuVisible(false); }} title={t.label} />
                        ))}
                    </Menu>

                    {/* Customer Filter */}
                    <View style={{ flex: 1 }}>
                        <TextInput
                            placeholder="Search Customer"
                            mode="outlined"
                            style={{ height: 40, backgroundColor: theme.colors.surface }}
                            value={customerQuery}
                            onChangeText={(text) => {
                                setCustomerQuery(text);
                                debouncedCustomerSearch(text);
                            }}
                            right={selectedCustomer ? <TextInput.Icon icon="close" onPress={() => {
                                setSelectedCustomer(null);
                                setCustomerQuery('');
                            }} /> : null}
                        />
                        {/* Simple dropdown for results */}
                        {customerMenuVisible && customerOptions.length > 0 && (
                            <View style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                                {customerOptions.map(c => (
                                    <TouchableOpacity key={c.value} onPress={() => {
                                        setSelectedCustomer(c);
                                        setCustomerQuery(c.label);
                                        setCustomerMenuVisible(false);
                                    }} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
                                        <Text>{c.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {loading && !refreshing && !isLoadingMore ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Loading payments...</Text>
                </View>
            ) : bookings.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="cash-remove" size={64} color={theme.colors.secondary} />
                    <Text variant="headlineSmall" style={{ marginTop: 16 }}>No Payments Found</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.booking_number}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
            )}

            {/* Modals */}
            {selectedBookingForAction && (
                <CreatePaymentModal
                    bookingNumber={selectedBookingForAction}
                    visible={paymentModalVisible}
                    onClose={() => {
                        setPaymentModalVisible(false);
                        setSelectedBookingForAction(null);
                    }}
                    onSuccess={() => {
                        handleRefresh();
                    }}
                />
            )}

            {refundBookingData && (
                <RefundModal
                    bookingNumber={refundBookingData.booking_number}
                    refundableAmount={Number(refundBookingData.total_paid) - Number(refundBookingData.total_refunded || 0)}
                    visible={refundModalVisible}
                    onClose={() => {
                        setRefundModalVisible(false);
                        setRefundBookingData(null);
                    }}
                    onSuccess={() => {
                        handleRefresh();
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdown: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderWidth: 1,
        borderRadius: 4,
        maxHeight: 200,
    }
});

export default Payments;
