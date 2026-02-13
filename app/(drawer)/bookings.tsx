
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, Checkbox, Divider, IconButton, Snackbar, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { DatePickerModal, enGB, registerTranslation, TimePickerModal } from 'react-native-paper-dates';

// Register translation for date picker
registerTranslation('en-GB', enGB);

import CreatePaymentModal from '../../components/bookings/CreatePaymentModal';
import CustomerFormModal from '../../components/customers/CustomerFormModal';
import { useAuth } from '../../context/AuthContext';
import { createBooking, Customer, DiscountPreview, getTests, previewDiscount, searchCustomers, Test } from '../../services/booking';

const Bookings = () => {
    const theme = useTheme();
    const router = useRouter();
    const { userRole } = useAuth();

    // State
    const [query, setQuery] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const [tests, setTests] = useState<Test[]>([]);
    const [selectedTests, setSelectedTests] = useState<number[]>([]);
    const [testPage, setTestPage] = useState(1);
    const [testHasMore, setTestHasMore] = useState(true);
    const [testIsLoadingMore, setTestIsLoadingMore] = useState(false);
    const testLimit = 10;

    const [discountType, setDiscountType] = useState("");
    const [discountValue, setDiscountValue] = useState<string>("0"); // controlled input need string
    const [amount, setAmount] = useState<DiscountPreview | null>(null);

    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState<{ hours: number; minutes: number } | undefined>(undefined);

    // Pickers visibility
    const [openDate, setOpenDate] = useState(false);
    const [openTime, setOpenTime] = useState(false);

    const [loading, setLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [bookingNumber, setBookingNumber] = useState<string | null>(null);

    // Redirect if not Receptionist
    useEffect(() => {
        if (userRole && userRole !== 'RECEPTIONIST') {
            router.replace('/(drawer)/dashboard');
        }
    }, [userRole]);

    const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    const loadTests = useCallback(
        async (page: number = 1, isInfinite: boolean = false, branchId?: number) => {
            try {
                if (isInfinite) {
                    setTestIsLoadingMore(true);
                } else {
                    // Only show global loading on first load if not keeping data
                    if (page === 1 && !isInfinite) {
                        // setLoading(true); // Maybe not block whole UI
                    }
                }

                console.log("Fetching tests with branch_id:", branchId);
                const res = await getTests({ page, limit: testLimit, branch_id: branchId });

                let newTests: Test[] = [];
                // Handle various response structures as per original code
                if (Array.isArray(res.data)) {
                    newTests = res.data;
                } else if (res.data?.data && Array.isArray(res.data.data)) {
                    newTests = res.data.data;
                }

                console.log(`Page ${page}: Got ${newTests.length} tests`);
                const shouldHaveMore = newTests.length === testLimit;

                if (isInfinite) {
                    setTests((prev) => {
                        // Avoid duplicates if any
                        const existingIds = new Set(prev.map(t => t.id));
                        const uniqueNewTests = newTests.filter(t => !existingIds.has(t.id));
                        return [...prev, ...uniqueNewTests];
                    });
                } else {
                    setTests(newTests);
                }

                setTestPage(page);
                setTestHasMore(shouldHaveMore);
            } catch (error) {
                console.error("Failed to load tests:", error);
                if (!isInfinite) {
                    showSnackbar("Failed to load tests", 'error');
                }
            } finally {
                if (isInfinite) {
                    setTestIsLoadingMore(false);
                } else {
                    setLoading(false);
                }
            }
        },
        [testLimit]
    );

    useEffect(() => {
        const branchId = selectedCustomer?.branch_id;
        console.log("Customer changed, reloading tests for branch:", branchId);
        setTestPage(1);
        loadTests(1, false, branchId);
    }, [loadTests, selectedCustomer]);

    const handleLoadMoreTests = () => {
        if (testHasMore && !testIsLoadingMore) {
            const branchId = selectedCustomer?.branch_id;
            loadTests(testPage + 1, true, branchId);
        }
    };

    const handleCustomerSearch = async () => {
        if (!query.trim()) return;
        try {
            setIsSearching(true);
            setSearchPerformed(true);
            const res = await searchCustomers(query);
            // Check structure
            let data: Customer[] = [];
            if (Array.isArray(res.data)) data = res.data;
            else if (res.data?.data) data = res.data.data;

            setCustomers(data);
        } catch {
            showSnackbar("Search failed", 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleTestToggle = (id: number) => {
        setSelectedTests((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
    };

    const handlePreviewDiscount = async () => {
        if (!discountType && Number(discountValue) > 0) {
            showSnackbar("Select discount type", 'error');
            return;
        }

        const total = tests
            .filter((t) => selectedTests.includes(t.id))
            .reduce((sum, t) => sum + Number(t.price), 0);

        try {
            const res = await previewDiscount({
                amount: total,
                discount_type: discountType,
                discount_value: Number(discountValue),
            });
            setAmount(res.data);
        } catch (e) {
            showSnackbar("Failed to calculate discount", 'error');
        }
    };

    const validateBooking = () => {
        if (!selectedCustomer) return "Please select a customer";
        if (selectedTests.length === 0) return "Select at least one test";
        if (!date) return "Select booking date";
        if (!time) return "Select booking time";
        return "";
    };

    const resetBookingForm = () => {
        setSelectedCustomer(null);
        setQuery("");
        setSelectedTests([]);
        setDiscountType("");
        setDiscountValue("0");
        setAmount(null);
        setDate(undefined);
        setTime(undefined);
        setCustomers([]);
        setBookingNumber(null);
        setShowPaymentModal(false);
    };

    const handleCreateBooking = async () => {
        const validationError = validateBooking();
        if (validationError) {
            showSnackbar(validationError, 'error');
            return;
        }

        try {
            setLoading(true);

            // Format date and time
            const dateStr = date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : "";
            const timeStr = time ? `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:00` : "";

            const response = await createBooking({
                customer_id: selectedCustomer!.id,
                test_ids: selectedTests,
                scheduled_date: dateStr,
                scheduled_time: timeStr,
                discount_type: discountType || undefined,
                discount_value: Number(discountValue) || undefined,
            });

            console.log("Create Booking Response:", response);
            // Extract booking number
            const bookingNum = response.data?.booking?.booking_number || response.data?.id || "Unknown";
            setBookingNumber(bookingNum);

            showSnackbar("Booking created successfully", 'success');
            setTimeout(() => setShowPaymentModal(true), 500); // Small delay
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to create booking";
            showSnackbar(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Date/Time pickers helpers
    const onDismissDate = useCallback(() => {
        setOpenDate(false);
    }, [setOpenDate]);

    const onConfirmDate = useCallback(
        (params: any) => {
            setOpenDate(false);
            setDate(params.date);
        },
        [setOpenDate, setDate]
    );

    const onDismissTime = useCallback(() => {
        setOpenTime(false);
    }, [setOpenTime]);

    const onConfirmTime = useCallback(
        ({ hours, minutes }: any) => {
            setOpenTime(false);
            setTime({ hours, minutes });
        },
        [setOpenTime, setTime]
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.header}>
                <Text variant="headlineLarge" style={{ fontWeight: 'bold' }}>Create Booking</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Schedule and manage test bookings</Text>
            </View>

            <View style={styles.section}>
                {/* Customer Section */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Avatar.Icon size={40} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />
                            <Text variant="titleMedium" style={{ marginLeft: 10, alignSelf: 'center' }}>Customer Information</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            <TextInput
                                label="Search Customer"
                                value={query}
                                onChangeText={setQuery}
                                style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
                                mode="outlined"
                                right={<TextInput.Icon icon="magnify" onPress={handleCustomerSearch} />}
                            />
                            <Button mode="outlined" onPress={() => setShowCustomerModal(true)} style={{ justifyContent: 'center' }}>
                                + New
                            </Button>
                        </View>

                        {isSearching && <ActivityIndicator animating={true} style={{ padding: 10 }} />}

                        {/* Selected Customer */}
                        {selectedCustomer && (
                            <Surface style={[styles.selectedCustomer, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="labelSmall" style={{ color: theme.colors.secondary }}>Selected Customer</Text>
                                    <Text variant="titleMedium">{selectedCustomer.name}</Text>
                                    <Text variant="bodySmall">{selectedCustomer.phone}</Text>
                                </View>
                                <IconButton icon="pencil" size={20} onPress={() => setShowCustomerModal(true)} />
                                <IconButton icon="close" size={20} onPress={() => { setSelectedCustomer(null); setQuery(""); }} />
                            </Surface>
                        )}

                        {/* Search Results */}
                        {!selectedCustomer && customers.length > 0 && (
                            <View style={[styles.searchResults, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
                                {customers.map((c) => (
                                    <TouchableOpacity key={c.id} style={styles.customerItem} onPress={() => {
                                        setSelectedCustomer(c);
                                        setCustomers([]);
                                        setQuery("");
                                    }}>
                                        <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>{c.name}</Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{c.phone}</Text>
                                        <Divider style={{ marginTop: 5 }} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {!selectedCustomer && searchPerformed && customers.length === 0 && !isSearching && (
                            <Text style={{ textAlign: 'center', marginTop: 10, color: theme.colors.error }}>No customer found</Text>
                        )}

                    </Card.Content>
                </Card>

                {/* Tests Section */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Avatar.Icon size={40} icon="flask" style={{ backgroundColor: theme.colors.tertiaryContainer }} color={theme.colors.tertiary} />
                            <Text variant="titleMedium" style={{ marginLeft: 10, alignSelf: 'center' }}>Select Tests</Text>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }} onScroll={({ nativeEvent }) => {
                            if (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 20) {
                                handleLoadMoreTests();
                            }
                        }} scrollEventThrottle={400}>
                            {tests.length === 0 ? (
                                <Text style={{ textAlign: 'center', padding: 20 }}>Loading tests...</Text>
                            ) : (
                                tests.map((test) => (
                                    <TouchableOpacity key={test.id} onPress={() => handleTestToggle(test.id)} style={[styles.testItem, { borderBottomColor: theme.colors.outlineVariant }]}>
                                        <Checkbox status={selectedTests.includes(test.id) ? 'checked' : 'unchecked'} />
                                        <View style={{ flex: 1 }}>
                                            <Text variant="bodyLarge">{test.name}</Text>
                                        </View>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>₹{test.price}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                            {testIsLoadingMore && <ActivityIndicator style={{ padding: 10 }} />}
                            {!testHasMore && tests.length > 0 && <Text style={{ textAlign: 'center', padding: 5, fontSize: 12 }}>No more tests</Text>}
                        </ScrollView>

                    </Card.Content>
                </Card>

                {/* Schedule Section */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Avatar.Icon size={40} icon="calendar-clock" style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.secondary} />
                            <Text variant="titleMedium" style={{ marginLeft: 10, alignSelf: 'center' }}>Schedule</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Button mode="outlined" onPress={() => setOpenDate(true)} style={{ flex: 1 }}>
                                {date ? date.toLocaleDateString() : "Select Date"}
                            </Button>
                            <Button mode="outlined" onPress={() => setOpenTime(true)} style={{ flex: 1 }}>
                                {time ? `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}` : "Select Time"}
                            </Button>
                        </View>
                        <DatePickerModal
                            locale="en-GB"
                            mode="single"
                            visible={openDate}
                            onDismiss={onDismissDate}
                            date={date}
                            onConfirm={onConfirmDate}
                        />
                        <TimePickerModal
                            visible={openTime}
                            onDismiss={onDismissTime}
                            onConfirm={onConfirmTime}
                            hours={time?.hours}
                            minutes={time?.minutes}
                        />

                    </Card.Content>
                </Card>

                {/* Discount Section */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <Avatar.Icon size={40} icon="sale" style={{ backgroundColor: theme.colors.errorContainer }} color={theme.colors.error} />
                            <Text variant="titleMedium" style={{ marginLeft: 10, alignSelf: 'center' }}>Apply Discount</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                                <Text>Type</Text>
                                {/* Simple Dropdown using Buttons for now or maybe just 2 buttons? */}
                                <View style={{ flexDirection: 'row', gap: 5, marginTop: 5 }}>
                                    <TouchableOpacity
                                        style={[styles.chip, discountType === 'FLAT' && { backgroundColor: theme.colors.primaryContainer }]}
                                        onPress={() => setDiscountType('FLAT')}
                                    >
                                        <Text>Flat</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.chip, discountType === 'PERCENTAGE' && { backgroundColor: theme.colors.primaryContainer }]}
                                        onPress={() => setDiscountType('PERCENTAGE')}
                                    >
                                        <Text>%</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.chip, discountType === '' && { backgroundColor: theme.colors.surfaceVariant }]}
                                        onPress={() => setDiscountType('')}
                                    >
                                        <Text>None</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <TextInput
                                    label="Value"
                                    value={discountValue}
                                    onChangeText={setDiscountValue}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    disabled={!discountType}
                                />
                            </View>
                        </View>
                        <Button mode="contained-tonal" style={{ marginTop: 10 }} onPress={handlePreviewDiscount}>Preview</Button>
                    </Card.Content>
                </Card>

                {/* Summary Section */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <Text variant="titleLarge">Booking Summary</Text>
                        <Divider style={{ marginVertical: 10 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text>Selected Tests</Text>
                            <Text style={{ fontWeight: 'bold' }}>{selectedTests.length}</Text>
                        </View>

                        {/* List selected tests briefly */}
                        {selectedTests.length > 0 && (
                            <View style={{ marginVertical: 10 }}>
                                {tests.filter(t => selectedTests.includes(t.id)).map(t => (
                                    <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
                                        <Text style={{ fontSize: 12 }}>{t.name}</Text>
                                        <Text style={{ fontSize: 12 }}>₹{t.price}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Divider style={{ marginVertical: 10 }} />

                        {amount && (
                            <>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text>Original</Text>
                                    <Text>₹{amount.original_amount.toFixed(2)}</Text>
                                </View>
                                {amount.discount_amount > 0 && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ color: theme.colors.error }}>Discount</Text>
                                        <Text style={{ color: theme.colors.error }}>-₹{amount.discount_amount.toFixed(2)}</Text>
                                    </View>
                                )}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                    <Text variant="titleMedium">Final Amount</Text>
                                    <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>₹{amount.final_amount.toFixed(2)}</Text>
                                </View>
                            </>
                        )}

                        <Button
                            mode="contained"
                            onPress={handleCreateBooking}
                            style={{ marginTop: 20 }}
                            loading={loading}
                            disabled={loading || !selectedCustomer || selectedTests.length === 0}
                        >
                            Create Booking
                        </Button>
                    </Card.Content>
                </Card>

            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: snackbarType === 'error' ? theme.colors.error : theme.colors.primary }}
            >
                {snackbarMessage}
            </Snackbar>

            {/* Modals */}
            {showPaymentModal && <CreatePaymentModal bookingNumber={bookingNumber} onClose={resetBookingForm} />}

            {/* Pass onSuccess to update local state */}
            <CustomerFormModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSuccess={(newCustomer) => {
                    setSelectedCustomer(newCustomer);
                    setShowCustomerModal(false);
                }}
            />

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 20,
    },
    section: {
        gap: 16,
    },
    card: {
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    selectedCustomer: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    searchResults: {
        marginTop: 10,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 4,
    },
    customerItem: {
        padding: 10,
    },
    testItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    chip: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ccc',
    }
});

export default Bookings;
