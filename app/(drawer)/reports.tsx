import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { DatePickerInput, enGB, registerTranslation } from 'react-native-paper-dates';
import api from '../../services/api';
import { useGlobalStyles } from '../globalStyles';

registerTranslation('en-GB', enGB);

interface SummaryReportData {
    total_bookings: number;
    completed_bookings: string;
    total_paid: string;
    discount_given: string;
    discounted_revenue: string;
    pending_payments: string;
    total_refunded: string;
}

const SummaryReport = () => {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SummaryReportData | null>(null);
    const [fromDate, setFromDate] = useState<Date | undefined>();
    const [toDate, setToDate] = useState<Date | undefined>();

    const fetchSummaryReport = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        // Format dates as YYYY-MM-DD
        const fDate = fromDate.toISOString().split('T')[0];
        const tDate = toDate.toISOString().split('T')[0];

        try {
            const response = await api.get(`/reports/summary?from_date=${fDate}&to_date=${tDate}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching summary report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummaryReport();
    }, []);

    const stats = [
        { label: 'Total Bookings', value: data?.total_bookings, icon: 'calendar-check', color: '#4CAF50' },
        { label: 'Completed', value: data?.completed_bookings, icon: 'check-circle', color: '#2196F3' },
        { label: 'Total Paid', value: data?.total_paid ? `₹${parseFloat(data.total_paid).toLocaleString()}` : '-', icon: 'cash', color: '#FF9800' },
        { label: 'Discount Given', value: data?.discount_given ? `₹${parseFloat(data.discount_given).toLocaleString()}` : '-', icon: 'sale', color: '#E91E63' },
        { label: 'Discounted Revenue', value: data?.discounted_revenue ? `₹${parseFloat(data.discounted_revenue).toLocaleString()}` : '-', icon: 'chart-line', color: '#9C27B0' },
        { label: 'Pending Payments', value: data?.pending_payments, icon: 'clock-alert', color: '#F44336' },
        { label: 'Total Refunded', value: data?.total_refunded ? `₹${parseFloat(data.total_refunded).toLocaleString()}` : '-', icon: 'cash-minus', color: '#795548' },
    ];

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Card style={[viewStyles.card, { marginBottom: 20 }]} mode="elevated">
                <Card.Content>
                    <View style={styles.dateContainer}>
                        <View style={styles.dateInput}>
                            <DatePickerInput
                                locale="en-GB"
                                label="From"
                                value={fromDate}
                                onChange={(d) => setFromDate(d)}
                                inputMode="start"
                                mode="outlined"
                            />
                        </View>
                        <View style={styles.dateInput}>
                            <DatePickerInput
                                locale="en-GB"
                                label="To"
                                value={toDate}
                                onChange={(d) => setToDate(d)}
                                inputMode="start"
                                mode="outlined"
                            />
                        </View>
                    </View>
                    <Button
                        mode="contained"
                        onPress={fetchSummaryReport}
                        loading={loading}
                        style={{ marginTop: 10 }}
                    >
                        Apply Filter
                    </Button>
                </Card.Content>
            </Card>

            {loading ? (
                <View style={viewStyles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <Card key={index} style={[viewStyles.card, styles.statCard]} mode="elevated">
                            <Card.Content style={styles.statContent}>
                                <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                                    <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: colors.onSurface }}>
                                        {stat.value ?? '-'}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                                        {stat.label}
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

export default function ReportsScreen() {
    const { viewStyles, textStyles } = useGlobalStyles();

    return (
        <View style={viewStyles.container}>
            <Text variant="headlineMedium" style={[textStyles.title, { marginBottom: 20 }]}>Summary Report</Text>
            <SummaryReport />
        </View>
    );
};

const styles = StyleSheet.create({
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        marginBottom: 16,
    },
    statContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    dateInput: {
        flex: 1,
        backgroundColor: 'transparent',
    }
});
