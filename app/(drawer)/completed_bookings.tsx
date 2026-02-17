import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Avatar, Card, Text, useTheme } from 'react-native-paper';
import { getCompletedBookings } from "../../services/api";

const CompletedBookings = () => {
    const theme = useTheme();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const res = await getCompletedBookings();
            setBookings(res.data.data);
        } catch (error) {
            console.error("Failed to load completed bookings", error);
            // Optionally handle error with alert or toast
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return "-";
        try {
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return format(date, 'hh:mm a');
        } catch {
            return timeString;
        }
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "-";
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy hh:mm a');
        } catch {
            return dateString;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={styles.bookingIdContainer}>
                        <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
                        <Text variant="titleMedium" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.booking_number || "-"}</Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                </View>

                <View style={styles.customerInfo}>
                    <Avatar.Text
                        size={40}
                        label={item.Customer?.name?.charAt(0).toUpperCase() || "C"}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <View style={{ marginLeft: 12 }}>
                        <Text variant="titleSmall">{item.Customer?.name || "-"}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.Customer?.phone || ""}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.scheduleInfo}>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.secondary} />
                        <Text variant="bodyMedium" style={{ marginLeft: 8 }}>{formatDate(item.scheduled_date)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.secondary} />
                        <Text variant="bodyMedium" style={{ marginLeft: 8 }}>{formatTime(item.scheduled_time)}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>Completed at:</Text>
                    <Text variant="bodySmall" style={{ fontWeight: 'bold' }}> {formatDateTime(item.updated_at)}</Text>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Loading completed bookings...</Text>
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
                            <MaterialCommunityIcons name="clipboard-check-outline" size={64} color="gray" />
                            <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.secondary }}>No completed bookings yet</Text>
                            <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.secondary }}>You don't have any completed bookings to display.</Text>
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
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookingIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    scheduleInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 64,
    },
});

export default CompletedBookings;
