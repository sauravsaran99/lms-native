import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Chip, DataTable, Text } from 'react-native-paper';
import api from '../../services/api';

interface AuditLog {
    id: number;
    action_type: string;
    entity: string;
    entity_id: number;
    old_value: any;
    new_value: any;
    role: string;
    created_at: string;
    user_id: number;
    user_name: string;
    branch_id?: number;
    branch_name?: string;
}

import { useGlobalStyles } from '../globalStyles';

// ... interface AuditLog ...

export default function AuditLogsScreen() {
    const { viewStyles, textStyles, colors } = useGlobalStyles();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/audit-logs?page=${page + 1}&limit=${itemsPerPage}`);
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                setLogs(response.data.data);
                if (response.data.pagination && typeof response.data.pagination.total === 'number') {
                    setTotalItems(response.data.pagination.total);
                } else if (response.data.meta && typeof response.data.meta.total === 'number') {
                    setTotalItems(response.data.meta.total);
                } else {
                    setTotalItems(response.data.data.length);
                }
            } else if (Array.isArray(response.data)) {
                setLogs(response.data);
                setTotalItems(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [page]);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const renderValue = (value: any) => {
        if (value === null || value === undefined) return "None";
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return colors.success;
            case 'UPDATE': return colors.warning; // 'warning' might be amber/orange
            case 'DELETE': return colors.error;
            default: return colors.primary;
        }
    };

    return (
        <View style={viewStyles.container}>
            <View style={[styles.header, { marginBottom: 16 }]}>
                <Text variant="headlineMedium" style={textStyles.title}>Audit Logs</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                        {logs.map((log) => (
                            <Card key={log.id} style={[viewStyles.card, styles.card]} mode="elevated" onPress={() => toggleExpand(log.id)}>
                                <Card.Content>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: colors.onSurface }}>{log.entity} - {log.entity_id}</Text>
                                            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </Text>
                                        </View>
                                        <Chip
                                            mode="outlined"
                                            style={{ borderColor: getActionColor(log.action_type) }}
                                            textStyle={{ color: getActionColor(log.action_type) }}
                                        >
                                            {log.action_type}
                                        </Chip>
                                    </View>

                                    <View style={styles.cardBody}>
                                        <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                                            By: <Text style={{ fontWeight: 'bold' }}>{log.user_name}</Text> ({log.role})
                                        </Text>
                                        {log.branch_name && (
                                            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                                                Branch: {log.branch_name}
                                            </Text>
                                        )}
                                    </View>

                                    {expandedId === log.id && (
                                        <View style={[styles.details, { borderTopColor: colors.outlineVariant }]}>
                                            <View style={styles.detailRow}>
                                                <Text style={{ fontWeight: 'bold', color: colors.primary }}>New Value:</Text>
                                                <View style={[styles.codeBlock, { backgroundColor: colors.surfaceVariant }]}>
                                                    <Text style={{ fontFamily: 'monospace', fontSize: 12, color: colors.onSurfaceVariant }}>
                                                        {renderValue(log.new_value)}
                                                    </Text>
                                                </View>
                                            </View>
                                            {log.old_value && (
                                                <View style={styles.detailRow}>
                                                    <Text style={{ fontWeight: 'bold', color: colors.error }}>Old Value:</Text>
                                                    <View style={[styles.codeBlock, { backgroundColor: colors.surfaceVariant }]}>
                                                        <Text style={{ fontFamily: 'monospace', fontSize: 12, color: colors.onSurfaceVariant }}>
                                                            {renderValue(log.old_value)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </Card.Content>
                            </Card>
                        ))}
                    </ScrollView>

                    <DataTable>
                        <DataTable.Pagination
                            page={page}
                            numberOfPages={Math.ceil(totalItems / itemsPerPage)}
                            onPageChange={(page) => setPage(page)}
                            label={`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, totalItems)} of ${totalItems}`}
                            numberOfItemsPerPage={itemsPerPage}
                            showFastPaginationControls
                            selectPageDropdownLabel={'Rows per page'}
                        />
                    </DataTable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    card: {
        marginBottom: 12,
        borderRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardBody: {
        marginBottom: 8,
    },
    details: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    detailRow: {
        marginTop: 8,
    },
    codeBlock: {
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: 12,
        marginTop: 4,
    }
});
