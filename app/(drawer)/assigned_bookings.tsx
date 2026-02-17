import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Avatar, Badge, Button, Card, Dialog, Divider, Portal, Text, useTheme } from 'react-native-paper';
import CompleteBookingPopup from "../../components/technician/CompleteBookingPopup";
import { collectSample, getTechnicianBookings } from "../../services/api";

const AssignedBookings = () => {
    const theme = useTheme();
    // const { user } = useAuth(); // Not used
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [collectDialog, setCollectDialog] = useState({ visible: false, bookingId: 0 });
    const [popupState, setPopupState] = useState({
        isOpen: false,
        bookingId: 0,
        booking: null as any,
        bookingNumber: "",
        customerName: "",
        pendingAmount: 0,
    });

    const loadBookings = async () => {
        try {
            const res = await getTechnicianBookings();
            setBookings(res.data.data);
        } catch (error) {
            console.error("Failed to load assigned bookings", error);
            // Toast or Alert
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const handleCollectSample = (bookingId: number) => {
        setCollectDialog({ visible: true, bookingId });
    };

    const confirmCollectSample = async () => {
        try {
            const bookingId = collectDialog.bookingId;
            setCollectDialog({ visible: false, bookingId: 0 });
            await collectSample(bookingId);
            Alert.alert("Success", "Sample collected");
            loadBookings();
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Action failed");
        }
    };

    const handleComplete = (bookingId: number, booking: any) => {
        setPopupState({
            isOpen: true,
            bookingId,
            booking,
            bookingNumber: booking.booking_number || "",
            customerName: booking.Customer?.name || "",
            pendingAmount: booking.pending_amount || 0,
        });
    };

    const handleClosePopup = () => {
        setPopupState({
            isOpen: false,
            bookingId: 0,
            booking: null,
            bookingNumber: "",
            customerName: "",
            pendingAmount: 0,
        });
    };

    const handlePopupSuccess = () => {
        loadBookings();
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'orange';
            case 'confirmed': return 'blue';
            case 'completed': return 'green';
            case 'cancelled': return theme.colors.error;
            case 'tech_assigned': return theme.colors.primary;
            case 'sample_collected': return 'purple';
            default: return theme.colors.outline;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            // Assuming dateString is YYYY-MM-DD
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch (e) {
            return dateString;
        }
    };

    // Helper for time formatting if needed. Assuming time is string "HH:MM"
    const formatTime = (timeString: string) => {
        if (!timeString) return "-";
        try {
            // Convert "14:30" to "02:30 PM"
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return format(date, 'hh:mm a');
        } catch {
            return timeString;
        }
    };


    const renderItem = ({ item }: { item: any }) => (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={styles.bookingIdContainer}>
                        <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
                        <Text variant="titleMedium" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.booking_number}</Text>
                    </View>
                    <Badge style={{ backgroundColor: getStatusColor(item.status), color: theme.colors.surface }}>
                        {item.status?.replace('_', ' ')}
                    </Badge>
                </View>

                <View style={styles.customerInfo}>
                    <Avatar.Text
                        size={40}
                        label={item.Customer?.name?.charAt(0).toUpperCase() || "C"}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <View style={{ marginLeft: 12 }}>
                        <Text variant="titleSmall">{item.Customer?.name || "Unknown"}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.Customer?.phone || "No phone"}</Text>
                    </View>
                </View>

                <Divider style={{ marginVertical: 12 }} />

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

            </Card.Content>
            <Card.Actions style={{ justifyContent: 'flex-end', paddingTop: 0 }}>
                {item.status === 'TECH_ASSIGNED' && (
                    <Button
                        mode="contained"
                        onPress={() => handleCollectSample(item.id)}
                        buttonColor={theme.colors.primary}
                        icon="test-tube"
                    >
                        Collect Sample
                    </Button>
                )}
                {item.status === 'SAMPLE_COLLECTED' && (
                    <Button
                        mode="contained"
                        onPress={() => handleComplete(item.id, item)}
                        buttonColor="purple"
                        icon="check-circle"
                    >
                        Mark Completed
                    </Button>
                )}
                {item.status === 'COMPLETED' && (
                    <Button
                        mode="text"
                        disabled
                        icon="check-all"
                    >
                        Completed
                    </Button>
                )}
            </Card.Actions>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Loading bookings...</Text>
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
                            <MaterialCommunityIcons name="clipboard-text-off-outline" size={64} color="gray" />
                            <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.secondary }}>No assigned bookings yet</Text>
                        </View>
                    }
                />
            )}

            <CompleteBookingPopup
                isOpen={popupState.isOpen}
                onClose={handleClosePopup}
                bookingId={popupState.bookingId}
                booking={popupState.booking}
                bookingNumber={popupState.bookingNumber}
                customerName={popupState.customerName}
                pendingAmount={popupState.pendingAmount}
                onSuccess={handlePopupSuccess}
            />

            <Portal>
                <Dialog visible={collectDialog.visible} onDismiss={() => setCollectDialog({ visible: false, bookingId: 0 })}>
                    <Dialog.Title>Confirm Sample Collection</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">Are you sure you want to collect the sample for this booking?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setCollectDialog({ visible: false, bookingId: 0 })}>Cancel</Button>
                        <Button onPress={confirmCollectSample}>Collect</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
    },
    scheduleInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 64,
    },
});

export default AssignedBookings;
