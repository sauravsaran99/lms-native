import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, DataTable, Text } from 'react-native-paper';
import { DatePickerInput, enGB, registerTranslation } from 'react-native-paper-dates';
import api from '../../services/api';
import { useGlobalStyles } from '../globalStyles';

registerTranslation('en-GB', enGB);

interface BranchBreakdown {
    branch_id: number;
    branch_name: string;
    total_bookings: number;
    completed_bookings: string;
    gross_revenue: string;
    discount_given: string;
    total_paid: string;
    total_refunded: string;
    net_revenue: string;
}

const BranchMonthlyBreakdown = () => {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<BranchBreakdown[]>([]);
    const [fromDate, setFromDate] = useState<Date | undefined>();
    const [toDate, setToDate] = useState<Date | undefined>();
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchBranchBreakdown = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        // Format dates as YYYY-MM-DD
        const fDate = fromDate.toISOString().split('T')[0];
        const tDate = toDate.toISOString().split('T')[0];

        try {
            const response = await api.get(`/reports/monthly-breakdown/branch?from_date=${fDate}&to_date=${tDate}`);
            setData(response.data);
            setPage(0); // Reset to first page on new fetch
        } catch (error) {
            console.error('Error fetching branch monthly breakdown:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranchBreakdown();
    }, []);

    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, data.length);

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
                        onPress={fetchBranchBreakdown}
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
                <Card style={viewStyles.card} mode="elevated">
                    <ScrollView horizontal>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={styles.colName}>Branch</DataTable.Title>
                                <DataTable.Title numeric style={styles.colNumeric}>Bookings</DataTable.Title>
                                <DataTable.Title numeric style={styles.colNumeric}>Completed</DataTable.Title>
                                <DataTable.Title numeric style={styles.colNumeric}>Gross Rev</DataTable.Title>
                                <DataTable.Title numeric style={styles.colNumeric}>Discount</DataTable.Title>
                                <DataTable.Title numeric style={styles.colNumeric}>Total Paid</DataTable.Title>
                                <DataTable.Title numeric style={styles.colNumeric}>Refunded</DataTable.Title>
                                <DataTable.Title numeric style={styles.colNumeric}>Net Rev</DataTable.Title>
                            </DataTable.Header>

                            {data.slice(from, to).map((item) => (
                                <DataTable.Row key={item.branch_id}>
                                    <DataTable.Cell style={styles.colName}>{item.branch_name}</DataTable.Cell>
                                    <DataTable.Cell numeric style={styles.colNumeric}>{item.total_bookings}</DataTable.Cell>
                                    <DataTable.Cell numeric style={styles.colNumeric}>{item.completed_bookings}</DataTable.Cell>
                                    <DataTable.Cell numeric style={styles.colNumeric}>₹{parseFloat(item.gross_revenue).toLocaleString()}</DataTable.Cell>
                                    <DataTable.Cell numeric style={styles.colNumeric}>₹{parseFloat(item.discount_given).toLocaleString()}</DataTable.Cell>
                                    <DataTable.Cell numeric style={styles.colNumeric}>₹{parseFloat(item.total_paid).toLocaleString()}</DataTable.Cell>
                                    <DataTable.Cell numeric style={styles.colNumeric}>₹{parseFloat(item.total_refunded).toLocaleString()}</DataTable.Cell>
                                    <DataTable.Cell numeric style={styles.colNumeric}>₹{parseFloat(item.net_revenue).toLocaleString()}</DataTable.Cell>
                                </DataTable.Row>
                            ))}

                            {data.length === 0 && (
                                <Text style={{ textAlign: 'center', margin: 20, color: colors.onSurfaceVariant }}>
                                    No data available for the selected period.
                                </Text>
                            )}

                            <DataTable.Pagination
                                page={page}
                                numberOfPages={Math.ceil(data.length / itemsPerPage)}
                                onPageChange={(page) => setPage(page)}
                                label={`${from + 1}-${to} of ${data.length}`}
                                numberOfItemsPerPageList={[5, 10, 20]}
                                numberOfItemsPerPage={itemsPerPage}
                                onItemsPerPageChange={setItemsPerPage}
                                showFastPaginationControls
                                selectPageDropdownLabel={'Rows per page'}
                            />
                        </DataTable>
                    </ScrollView>
                </Card>
            )}
        </ScrollView>
    );
};

export default function BranchBreakdownScreen() {
    const { viewStyles, textStyles } = useGlobalStyles();

    return (
        <View style={viewStyles.container}>
            <Text variant="headlineMedium" style={[textStyles.title, { marginBottom: 20 }]}>Branch Monthly Breakdown</Text>
            <BranchMonthlyBreakdown />
        </View>
    );
};

const styles = StyleSheet.create({
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    dateInput: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    colName: {
        width: 150,
        justifyContent: 'flex-start',
    },
    colNumeric: {
        width: 100,
        justifyContent: 'flex-end',
    }
});
