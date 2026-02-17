import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Badge, Card, Divider, Text, useTheme } from 'react-native-paper';
import { getCustomerBookings } from "../../services/api";

const MyBookings = () => {
    const theme = useTheme();
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const res = await getCustomerBookings();
            setBookings(res.data.data);
        } catch (error) {
            console.error("Failed to load customer bookings", error);
            // Toast logic could go here
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

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'orange';
            case 'confirmed': return 'blue';
            case 'completed': return 'green';
            case 'cancelled': return theme.colors.error;
            default: return theme.colors.outline;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
            {/* Card Header */}
            <View style={[styles.cardHeader, { backgroundColor: theme.colors.primaryContainer }]}>
                <View>
                    <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, letterSpacing: 1 }}>BOOKING ID</Text>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}>{item.booking_number}</Text>
                </View>
                <Badge style={{ backgroundColor: getStatusColor(item.status), color: theme.colors.surface, alignSelf: 'flex-start', marginTop: 4 }}>
                    {item.status?.toUpperCase()}
                </Badge>
            </View>

            <Card.Content style={{ paddingTop: 16 }}>
                {/* Date */}
                <View style={styles.infoRow}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                        <MaterialCommunityIcons name="calendar" size={20} color="#2196F3" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>Scheduled Date</Text>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{formatDate(item.scheduled_date)}</Text>
                    </View>
                </View>

                {/* Test Count */}
                <View style={[styles.infoRow, { marginTop: 12 }]}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                        <MaterialCommunityIcons name="flask-outline" size={20} color="#9C27B0" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>Tests</Text>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                            {item.tests_count || 0} test{item.tests_count !== 1 ? "s" : ""}
                        </Text>
                    </View>
                </View>
            </Card.Content>

            <Divider style={{ marginVertical: 12 }} />

            <View style={{ padding: 16, paddingTop: 0 }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: theme.colors.primary,
                        paddingVertical: 10,
                        borderRadius: 20,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        elevation: 2
                    }}
                    onPress={() => {
                        console.log('Navigating to booking:', item.id);
                        router.push(`/customer/bookings/${item.id}`);
                    }}
                >
                    <MaterialCommunityIcons name="eye" size={20} color={theme.colors.onPrimary} style={{ marginRight: 8 }} />
                    <Text variant="labelLarge" style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>View Details</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Loading your bookings...</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="file-document-outline" size={64} color={theme.colors.onSurfaceDisabled} />
                            <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.secondary }}>No bookings yet</Text>
                            <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.secondary }}>You don't have any bookings at the moment.</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        <View style={{ marginBottom: 16 }}>
                            <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>My Bookings</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>Track and manage all your test bookings</Text>
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
    card: {
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 32,
    },
});

export default MyBookings;
