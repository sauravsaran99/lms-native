import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper';
import { getCustomerBookingPayments, getCustomerBookings } from "../../services/api";

interface Payment {
    id: number;
    booking_number: string;
    amount: number;
    payment_date: string;
    payment_mode: string;
    status: string;
}

const CustomerPayments = () => {
    const theme = useTheme();
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const bookingsRes = await getCustomerBookings();
            const bookings = bookingsRes.data.data;
            const allPayments: Payment[] = [];

            // Fetch payments for each booking in parallel (or sequential if too many requests)
            // Parallel is faster but might hit rate limits. For now, Promise.all.
            const paymentPromises = bookings.map((b: any) => getCustomerBookingPayments(b.booking_number));
            const paymentResults = await Promise.all(paymentPromises);

            paymentResults.forEach((res) => {
                allPayments.push(...res.data.data);
            });

            // Sort by date descending (optional but good UI)
            allPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

            setPayments(allPayments);
        } catch (error) {
            console.error("Failed to load customer payments", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const getPaymentModeBadgeColor = (mode: string) => {
        if (mode?.toUpperCase() === "CASH") return { bg: '#E8F5E9', text: '#2E7D32' }; // Green
        if (mode?.toUpperCase() === "ONLINE") return { bg: '#E3F2FD', text: '#1565C0' }; // Blue
        return { bg: '#F5F5F5', text: '#616161' }; // Grey
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const cashAmount = payments.filter((p) => p.payment_mode?.toUpperCase() === "CASH").reduce((sum, p) => sum + Number(p.amount), 0);
    const onlineAmount = payments.filter((p) => p.payment_mode?.toUpperCase() === "ONLINE").reduce((sum, p) => sum + Number(p.amount), 0);

    const renderSummaryCard = (title: string, amount: number, icon: any, color: string) => (
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.summaryHeader}>
                <Text variant="labelSmall" style={{ color: theme.colors.secondary, flex: 1 }} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
                <View style={[styles.iconBoxSmall, { backgroundColor: color + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={16} color={color} />
                </View>
            </View>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginTop: 8 }} numberOfLines={1} adjustsFontSizeToFit>₹{amount.toLocaleString()}</Text>
        </Card>
    );

    const renderItem = ({ item }: { item: Payment }) => {
        const badgeColors = getPaymentModeBadgeColor(item.payment_mode);
        return (
            <Card style={{ marginBottom: 12, backgroundColor: theme.colors.surface }} mode="elevated">
                <View style={styles.paymentRow}>
                    <View style={{ flex: 1 }}>
                        <Text variant="bodyLarge" style={{ fontWeight: '600' }}>{item.booking_number}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{formatDate(item.payment_date)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>₹{Number(item.amount).toLocaleString()}</Text>
                        <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
                            <Text style={[styles.badgeText, { color: badgeColors.text }]}>{item.payment_mode?.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            </Card>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Loading payments...</Text>
                </View>
            ) : (
                <FlatList
                    data={payments}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListHeaderComponent={
                        <View style={{ marginBottom: 24 }}>
                            <View style={{ marginBottom: 24 }}>
                                <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>Payment History</Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>Track all your payments and transactions</Text>
                            </View>

                            <View style={styles.summaryContainer}>
                                {renderSummaryCard('Total Paid', totalAmount, 'cash-multiple', '#2196F3')}
                                {renderSummaryCard('Cash', cashAmount, 'cash', '#4CAF50')}
                                {renderSummaryCard('Online', onlineAmount, 'credit-card', '#9C27B0')}
                            </View>

                            <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 8, fontWeight: 'bold' }}>Transactions</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="cash-remove" size={64} color={theme.colors.onSurfaceDisabled} />
                            <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.secondary }}>No payments yet</Text>
                            <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.secondary }}>You don't have any payments at the moment.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    summaryCard: {
        flexBasis: '30%',
        flexGrow: 1,
        minWidth: 100,
        padding: 12,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconBoxSmall: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 32,
    },
});

export default CustomerPayments;
