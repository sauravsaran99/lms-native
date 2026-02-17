import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, Dialog, Divider, Portal, RadioButton, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { assignTechnician, getTechnicians, getUnassignedBookings } from '../../services/api';

const TechnicianAssignment = () => {
    const theme = useTheme();
    const router = useRouter();
    const { userRole } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [assignmentDialogVisible, setAssignmentDialogVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
    const [assigningLoading, setAssigningLoading] = useState(false);

    const canAssign = userRole === 'SUPER_ADMIN' || userRole === 'BRANCH_ADMIN' || userRole === 'RECEPTIONIST';

    const loadData = async () => {
        try {
            if (!refreshing) setLoading(true);
            const [bRes, tRes] = await Promise.all([getUnassignedBookings(), getTechnicians()]);
            setBookings(bRes.data.data);
            setTechnicians(tRes.data.data);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (canAssign) {
            loadData();
        }
    }, [canAssign]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const openAssignmentDialog = (booking: any) => {
        setSelectedBooking(booking);
        setSelectedTechnicianId(null);
        setAssignmentDialogVisible(true);
    };

    const closeAssignmentDialog = () => {
        setAssignmentDialogVisible(false);
        setSelectedBooking(null);
        setSelectedTechnicianId(null);
    };

    const handleConfirmAssignment = async () => {
        if (!selectedBooking || !selectedTechnicianId) return;

        try {
            setAssigningLoading(true);
            await assignTechnician(selectedBooking.id, selectedTechnicianId);
            Alert.alert("Success", "Technician assigned successfully");
            closeAssignmentDialog();
            loadData(); // Reload to refresh list
        } catch (error) {
            console.error("Failed to assign technician", error);
            Alert.alert("Error", "Failed to assign technician");
        } finally {
            setAssigningLoading(false);
        }
    };

    if (!canAssign) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
                <Text variant="headlineSmall" style={{ color: theme.colors.error, marginTop: 16 }}>Access Denied</Text>
                <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                    You don't have permission to access this page. Only administrators and receptionists can assign technicians.
                </Text>
            </View>
        );
    }

    const renderBookingItem = ({ item }: { item: any }) => (
        <Card style={styles.card} mode="elevated">
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={styles.bookingIdContainer}>
                        <View style={[styles.statusDot, { backgroundColor: theme.colors.primary }]} />
                        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>#{item.booking_number}</Text>
                    </View>
                    <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.status}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                    <Avatar.Text
                        size={40}
                        label={item.Customer?.name?.charAt(0)?.toUpperCase() || "U"}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text variant="titleMedium">{item.Customer?.name || "Unknown"}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.Customer?.phone || "No phone"}</Text>
                    </View>
                </View>

                <View style={[styles.infoRow, { marginTop: 12 }]}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.secondary} />
                    <View style={{ marginLeft: 12 }}>
                        <Text variant="bodyMedium">{item.scheduled_date}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.scheduled_time}</Text>
                    </View>
                </View>

            </Card.Content>
            <Card.Actions style={{ justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 16 }}>
                <Button
                    mode="contained-tonal"
                    onPress={() => openAssignmentDialog(item)}
                    icon="account-check"
                >
                    Assign Technician
                </Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Loading pending bookings...</Text>
                </View>
            ) : bookings.length === 0 ? (
                <ScrollView
                    contentContainerStyle={styles.emptyContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                >
                    <MaterialCommunityIcons name="clipboard-check-outline" size={64} color={theme.colors.secondary} />
                    <Text variant="headlineSmall" style={{ marginTop: 16, color: theme.colors.onSurface }}>No Pending Assignments</Text>
                    <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.secondary, textAlign: 'center' }}>
                        All bookings have been assigned to technicians.
                    </Text>
                </ScrollView>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            )}

            <Portal>
                <Dialog visible={assignmentDialogVisible} onDismiss={closeAssignmentDialog}>
                    <Dialog.Title>Assign Technician</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                            Select a technician for Booking #{selectedBooking?.booking_number}
                        </Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            <RadioButton.Group
                                onValueChange={(value) => setSelectedTechnicianId(Number(value))}
                                value={selectedTechnicianId?.toString() || ""}
                            >
                                {technicians.map((tech) => (
                                    <View key={tech.id} style={styles.radioItem}>
                                        <RadioButton.Item
                                            label={tech.name}
                                            value={tech.id.toString()}
                                            position="leading"
                                            labelStyle={{ textAlign: 'left' }}
                                        />
                                    </View>
                                ))}
                            </RadioButton.Group>
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeAssignmentDialog}>Cancel</Button>
                        <Button
                            onPress={handleConfirmAssignment}
                            disabled={!selectedTechnicianId || assigningLoading}
                            loading={assigningLoading}
                        >
                            Confirm
                        </Button>
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
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
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    divider: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioItem: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
});

export default TechnicianAssignment;
