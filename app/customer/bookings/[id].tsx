import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { getCustomerBookingReports, getCustomerBookingTests } from "../../../services/api";

const BookingDetails = () => {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [tests, setTests] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const bookingId = Number(id);
                // Run in parallel for speed
                const [testsRes, reportsRes] = await Promise.all([
                    getCustomerBookingTests(bookingId),
                    getCustomerBookingReports(bookingId)
                ]);
                setTests(testsRes.data.data);
                setReports(reportsRes.data.data);
            } catch (error) {
                console.error("Failed to load booking details", error);
                Alert.alert("Error", "Failed to load booking details");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const downloadReport = async (fileUrl: string, fileName?: string) => {
        try {
            // For web, use Linking to open in new tab
            if (Platform.OS === 'web') {
                const baseUrl = "http://localhost:5000"; // Should come from environment variable
                Linking.openURL(`${baseUrl}/${fileUrl}`);
                return;
            }

            // For mobile
            const baseUrl = "http://localhost:5000"; // Should come from environment variable
            const downloadUrl = `${baseUrl}/${fileUrl}`;
            const fileUri = FileSystem.documentDirectory + (fileName || 'report.pdf');

            const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri);

            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(downloadRes.uri);
            } else {
                // Android: View or Share
                // Sharing.shareAsync works well for both usually
                await Sharing.shareAsync(downloadRes.uri);
            }

        } catch (error) {
            console.error("Download failed", error);
            Alert.alert("Error", "Failed to download report");
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <View style={{ flex: 1 }}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Booking Details</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>View tests and reports for this booking</Text>
                </View>
                <Button
                    mode="outlined"
                    onPress={() => router.back()}
                    icon="arrow-left"
                    compact
                >
                    Back
                </Button>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 16 }}>Loading details...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Tests Section */}
                    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                        <Card.Title
                            title="Tests"
                            subtitle={`${tests.length} test(s) included`}
                            left={(props) => <MaterialCommunityIcons {...props} name="flask-outline" size={24} color={theme.colors.primary} />}
                        />
                        <Card.Content>
                            {tests.length > 0 ? (
                                tests.map((test, index) => (
                                    <View key={test.id}>
                                        {index > 0 && <Divider style={{ marginVertical: 8 }} />}
                                        <View style={styles.testItem}>
                                            <MaterialCommunityIcons name="check-circle-outline" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text variant="titleSmall">{test.Test?.name || "Test Name"}</Text>
                                                {test.Test?.description && (
                                                    <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{test.Test.description}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ textAlign: 'center', color: theme.colors.secondary, padding: 16 }}>No tests included.</Text>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Reports Section */}
                    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                        <Card.Title
                            title="Reports"
                            subtitle={`${reports.length} report(s) available`}
                            left={(props) => <MaterialCommunityIcons {...props} name="file-document-outline" size={24} color={theme.colors.secondary} />}
                        />
                        <Card.Content>
                            {reports.length > 0 ? (
                                reports.map((report, idx) => (
                                    <View key={report.id}>
                                        {idx > 0 && <Divider style={{ marginVertical: 8 }} />}
                                        <View style={styles.reportItem}>
                                            <View style={[styles.reportIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                                                <MaterialCommunityIcons name="file-pdf-box" size={24} color={theme.colors.onSecondaryContainer} />
                                            </View>
                                            <View style={{ flex: 1, marginHorizontal: 12 }}>
                                                <Text variant="titleSmall">Test Report {idx + 1}</Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>Click to download</Text>
                                            </View>
                                            <Button
                                                mode="text"
                                                onPress={() => downloadReport(report.file_url, `report-${idx + 1}.pdf`)}
                                                icon="download"
                                            >
                                                Download
                                            </Button>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={{ alignItems: 'center', padding: 24 }}>
                                    <MaterialCommunityIcons name="file-hidden" size={48} color={theme.colors.onSurfaceDisabled} />
                                    <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.secondary }}>No reports available yet</Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>

                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        elevation: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    testItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    reportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    reportIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BookingDetails;
