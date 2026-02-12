import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, DataTable, Text, useTheme } from 'react-native-paper';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryPie, VictoryTheme, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

// Types based on the User's API response
interface Summary {
  total_bookings: number;
  completed_bookings: string;
  total_paid: string;
  discount_given: string;
  net_revenue: string;
  pending_payments: string;
}

interface ChartData {
  dates: string[];
  bookings: number[];
  revenue: number[];
}

interface RecentBooking {
  booking_number: string;
  status: string;
  final_amount: string;
  customer_name: string;
  tests: string;
}

interface PaymentHealth {
  Paid: number;
  Partial: number;
  Pending: number;
}

interface FunnelStep {
  status: string;
  count: number;
}

interface TopTest {
  test_name: string;
  bookings_count: number;
  revenue: string;
}

interface TechnicianPerformance {
  technician_id: number;
  technician_name: string;
  assigned_bookings: number;
  completed_bookings: string;
  revenue_generated: string;
  revenue_collected: string;
}

interface DashboardData {
  summary: Summary;
  chart: ChartData;
  recent_bookings: RecentBooking[];
  payment_health: PaymentHealth;
  booking_funnel: FunnelStep[];
  top_tests: TopTest[];
  technician_performance: TechnicianPerformance[];
}

// ... imports ...
import { useGlobalStyles } from '../globalStyles';

// ... interfaces ...

const DashboardScreen = () => {
  const { viewStyles, textStyles, colors } = useGlobalStyles();
  const theme = useTheme(); // Keep for specific paper props if needed
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [itemsPerPage] = useState(5);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard?period=all_time');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={viewStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  const {
    total_bookings = 0,
    completed_bookings = "0",
    total_paid = "0.00",
    discount_given = "0.00",
    net_revenue = "0.00",
    pending_payments = "0"
  } = data.summary || {};

  const chart = data.chart || { dates: [], bookings: [], revenue: [] };
  const recentBookings = data.recent_bookings || [];
  const paymentHealth = data.payment_health || { Paid: 0, Partial: 0, Pending: 0 };
  const bookingFunnel = data.booking_funnel || [];
  const topTests = data.top_tests || [];

  const transformedChartData = chart.dates.map((date, index) => ({
    date,
    bookings: chart.bookings[index] || 0,
    revenue: chart.revenue[index] || 0,
    label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  const paymentPieData = [
    { x: "Paid", y: paymentHealth.Paid },
    { x: "Partial", y: paymentHealth.Partial },
    { x: "Pending", y: paymentHealth.Pending }
  ].filter(d => d.y > 0);

  const stats = [
    { label: 'Total Bookings', value: total_bookings, icon: 'calendar-check', color: '#4CAF50' },
    { label: 'Completed', value: completed_bookings, icon: 'check-circle', color: '#2196F3' },
    { label: 'Total Paid', value: `₹${parseFloat(total_paid).toLocaleString()}`, icon: 'cash', color: '#FF9800' },
    { label: 'Discount', value: `₹${parseFloat(discount_given).toLocaleString()}`, icon: 'sale', color: '#E91E63' },
    { label: 'Net Revenue', value: `₹${parseFloat(net_revenue).toLocaleString()}`, icon: 'chart-line', color: '#9C27B0' },
    { label: 'Pending', value: `₹${pending_payments}`, icon: 'clock-alert', color: '#F44336' },
  ];

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, recentBookings.length);

  const chartTheme = {
    axis: {
      style: {
        tickLabels: { fill: colors.text, fontSize: 10, padding: 5 },
        axis: { stroke: colors.onSurfaceVariant },
      }
    },
  };

  return (
    <ScrollView
      style={viewStyles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text variant="headlineMedium" style={textStyles.title}>Dashboard</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <Card key={index} style={[viewStyles.card, styles.statCard]} mode="elevated">
            <Card.Content style={styles.statContent}>
              <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: 'bold', color: colors.onSurface }}
                >
                  {stat.value}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {stat.label}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Bookings Trend */}
      <Card style={viewStyles.card} mode="elevated">
        <Card.Title title="Bookings Trend" subtitle="Daily Bookings Count" left={(props) => <MaterialCommunityIcons {...props} name="trending-up" color={colors.primary} />} titleStyle={{ color: colors.onSurface }} subtitleStyle={{ color: colors.onSurfaceVariant }} />
        <Card.Content>
          {transformedChartData.length > 0 ? (
            <VictoryChart theme={VictoryTheme.material} width={width - 60} height={250} containerComponent={<VictoryVoronoiContainer />}>
              <VictoryAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10, padding: 5, angle: -45 } }} />
              <VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10, padding: 5 } }} />
              <VictoryLine
                data={transformedChartData}
                x="label"
                y="bookings"
                style={{
                  data: { stroke: colors.primary, strokeWidth: 3 },
                }}
                labels={({ datum }) => `${datum.bookings}`}
                labelComponent={<VictoryTooltip renderInPortal={false} />}
              />
            </VictoryChart>
          ) : (
            <Text style={{ textAlign: 'center', margin: 20, color: colors.onSurface }}>No bookings data available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Revenue Trend */}
      <Card style={viewStyles.card} mode="elevated">
        <Card.Title title="Revenue Trend" subtitle="Daily Revenue Performance" left={(props) => <MaterialCommunityIcons {...props} name="currency-inr" color={colors.success} />} titleStyle={{ color: colors.onSurface }} subtitleStyle={{ color: colors.onSurfaceVariant }} />
        <Card.Content>
          {transformedChartData.length > 0 ? (
            <VictoryChart theme={VictoryTheme.material} width={width - 60} height={250} domainPadding={{ x: 20 }}>
              <VictoryAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10, padding: 5, angle: -45 } }} />
              <VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10, padding: 5 } }} tickFormat={(t) => `${t / 1000}k`} />
              <VictoryBar
                data={transformedChartData}
                x="label"
                y="revenue"
                style={{ data: { fill: colors.success } }}
                labels={({ datum }) => `${datum.revenue}`}
              />
            </VictoryChart>
          ) : (
            <Text style={{ textAlign: 'center', margin: 20, color: colors.onSurface }}>No revenue data available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Payment Health (Pie Chart) */}
      <Card style={viewStyles.card} mode="elevated">
        <Card.Title title="Payment Health" subtitle="Payment Status Breakdown" left={(props) => <MaterialCommunityIcons {...props} name="chart-bar-stacked" color={colors.warning} />} titleStyle={{ color: colors.onSurface }} subtitleStyle={{ color: colors.onSurfaceVariant }} />
        <Card.Content>
          <View style={{ alignItems: 'center' }}>
            <VictoryPie
              data={paymentPieData}
              colorScale={["#4CAF50", "#FF9800", "#F44336"]}
              width={width - 60}
              height={300}
              innerRadius={50}
              labels={({ datum }) => `${datum.x}: ${datum.y}`}
              style={{ labels: { fontSize: 14, fill: colors.onSurface } }}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Top Tests */}
      <Card style={viewStyles.card} mode="elevated">
        <Card.Title title="Top Tests" subtitle="Most Booked Tests" left={(props) => <MaterialCommunityIcons {...props} name="flask" color={colors.tertiary} />} titleStyle={{ color: colors.onSurface }} subtitleStyle={{ color: colors.onSurfaceVariant }} />
        <Card.Content>
          <VictoryChart theme={VictoryTheme.material} width={width - 60} height={250} domainPadding={{ x: 20 }}>
            <VictoryAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10, padding: 5 } }} />
            <VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.onSurface, fontSize: 10, padding: 5 } }} />
            <VictoryBar
              data={topTests}
              x="test_name"
              y="bookings_count"
              horizontal
              style={{ data: { fill: "#9C27B0", width: 20 } }}
              labels={({ datum }) => `${datum.bookings_count}`}
            />
          </VictoryChart>
        </Card.Content>
      </Card>

      {/* Recent Bookings */}
      <Card style={viewStyles.card} mode="elevated">
        <Card.Title title="Recent Bookings" left={(props) => <MaterialCommunityIcons {...props} name="table-large" color={colors.primary} />} titleStyle={{ color: colors.onSurface }} />
        <DataTable>
          <DataTable.Header>
            <DataTable.Title textStyle={{ color: colors.onSurface }}>Customer</DataTable.Title>
            <DataTable.Title numeric textStyle={{ color: colors.onSurface }}>Amount</DataTable.Title>
            <DataTable.Title numeric textStyle={{ color: colors.onSurface }}>Status</DataTable.Title>
          </DataTable.Header>

          {recentBookings.slice(from, to).map((item, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell textStyle={{ color: colors.onSurface }}>{item.customer_name}</DataTable.Cell>
              <DataTable.Cell numeric textStyle={{ color: colors.onSurface }}>₹{parseFloat(item.final_amount).toLocaleString()}</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ color: item.status === 'COMPLETED' ? 'green' : 'orange', fontWeight: 'bold', fontSize: 12 }}>
                  {item.status}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(recentBookings.length / itemsPerPage)}
            onPageChange={(page) => setPage(page)}
            label={<Text style={{ color: colors.onSurface }}>{`${from + 1}-${to} of ${recentBookings.length}`}</Text>}
          />
        </DataTable>
      </Card>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4, // Reduce padding to give more space for text
  },
  iconContainer: {
    width: 36, // Slightly smaller icon container
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});

export default DashboardScreen;
