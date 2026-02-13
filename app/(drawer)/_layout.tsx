import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const CustomDrawerContent = (props: any) => {
    const router = useRouter();
    const theme = useTheme();
    const { userRole } = useAuth();
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isBranchAdmin = userRole === 'BRANCH_ADMIN';
    const isReceptionist = userRole === 'RECEPTIONIST';

    const [reportsExpanded, setReportsExpanded] = useState(false);
    const [branchAdminExpanded, setBranchAdminExpanded] = useState(false);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.surface }}>
                <DrawerItemList {...props} />

                {/* Expandable Reports Section - Hidden for RECEPTIONIST */}
                {!isReceptionist && (
                    <TouchableOpacity
                        onPress={() => setReportsExpanded(!reportsExpanded)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 18,
                            paddingVertical: 12,
                            paddingHorizontal: 18,
                        }}
                    >
                        <MaterialCommunityIcons
                            name="chart-box-outline"
                            size={24}
                            color={theme.colors.onSurfaceVariant}
                            style={{ marginRight: 32 }}
                        />
                        <Text style={{ fontSize: 16, color: theme.colors.onSurface, flex: 1, fontWeight: '500' }}>
                            Reports
                        </Text>
                        <MaterialCommunityIcons
                            name={reportsExpanded ? "chevron-up" : "chevron-down"}
                            size={24}
                            color={theme.colors.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}

                {!isReceptionist && reportsExpanded && (
                    <View style={{ marginLeft: 32, borderLeftWidth: 1, borderLeftColor: theme.colors.outlineVariant }}>
                        <DrawerItem
                            label="Summary Report"
                            onPress={() => router.push('/(drawer)/reports')}
                            labelStyle={{ fontSize: 14, color: theme.colors.onSurface }}
                        />
                        <DrawerItem
                            label="Branch Breakdown"
                            onPress={() => router.push('/(drawer)/branch_monthly_breakdown')}
                            labelStyle={{ fontSize: 14, color: theme.colors.onSurface }}
                            style={{ marginTop: -5 }}
                        />
                        <DrawerItem
                            label="Test Breakdown"
                            onPress={() => router.push('/(drawer)/test_monthly_breakdown')}
                            labelStyle={{ fontSize: 14, color: theme.colors.onSurface }}
                            style={{ marginTop: -5 }}
                        />
                    </View>
                )}

                {/* Expandable Branch Admin Section - Only for Branch Admin */}
                {isBranchAdmin && (
                    <>
                        <TouchableOpacity
                            onPress={() => setBranchAdminExpanded(!branchAdminExpanded)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 18,
                                paddingVertical: 12,
                                paddingHorizontal: 18,
                            }}
                        >
                            <MaterialCommunityIcons
                                name="account-tie"
                                size={24}
                                color={theme.colors.onSurfaceVariant}
                                style={{ marginRight: 32 }}
                            />
                            <Text style={{ fontSize: 16, color: theme.colors.onSurface, flex: 1, fontWeight: '500' }}>
                                Branch Admin
                            </Text>
                            <MaterialCommunityIcons
                                name={branchAdminExpanded ? "chevron-up" : "chevron-down"}
                                size={24}
                                color={theme.colors.onSurfaceVariant}
                            />
                        </TouchableOpacity>

                        {branchAdminExpanded && (
                            <View style={{ marginLeft: 32, borderLeftWidth: 1, borderLeftColor: theme.colors.outlineVariant }}>
                                <DrawerItem
                                    label="Users"
                                    onPress={() => router.push('/(drawer)/branch_users')}
                                    labelStyle={{ fontSize: 14, color: theme.colors.onSurface }}
                                />
                            </View>
                        )}
                    </>
                )}
            </DrawerContentScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                <DrawerItem
                    label="Settings"
                    icon={({ color, size }) => (
                        <MaterialCommunityIcons name="cog" size={size} color={color} />
                    )}
                    onPress={() => router.push('/(drawer)/settings')}
                    labelStyle={{ fontSize: 16, color: theme.colors.onSurface }}
                />
            </View>
        </View>
    );
};

export default function DrawerLayout() {
    const theme = useTheme();
    const { userRole } = useAuth();
    const isBranchAdmin = userRole === 'BRANCH_ADMIN';
    const isReceptionist = userRole === 'RECEPTIONIST';

    // Hide logic
    const hideIfBranchAdmin: { display: "none" | "flex" | undefined } = isBranchAdmin ? { display: 'none' } : { display: undefined };
    const hideIfReceptionist: { display: "none" | "flex" | undefined } = isReceptionist ? { display: 'none' } : { display: undefined };

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.onPrimary,
                drawerStyle: { backgroundColor: theme.colors.surface },
                drawerActiveTintColor: theme.colors.primary,
                drawerInactiveTintColor: theme.colors.onSurfaceVariant,
                drawerLabelStyle: { fontSize: 16 },
            }}
        >
            <Drawer.Screen
                name="dashboard"
                options={{
                    drawerLabel: 'Dashboard',
                    title: 'Dashboard',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                    drawerItemStyle: hideIfReceptionist,
                }}
                redirect={isReceptionist}
            />

            <Drawer.Screen
                name="branches"
                options={{
                    drawerLabel: 'Branches',
                    title: 'Manage Branches',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="store" size={size} color={color} />
                    ),
                    drawerItemStyle: isReceptionist ? { display: 'none' } : hideIfBranchAdmin,
                }}
                redirect={isBranchAdmin || isReceptionist}
            />
            <Drawer.Screen
                name="testmaster"
                options={{
                    drawerLabel: 'Test Master',
                    title: 'Test Master',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="flask" size={size} color={color} />
                    ),
                    drawerItemStyle: isReceptionist ? { display: 'none' } : hideIfBranchAdmin,
                }}
                redirect={isBranchAdmin || isReceptionist}
            />
            <Drawer.Screen
                name="doctormaster"
                options={{
                    drawerLabel: 'Doctor Master',
                    title: 'Doctor Master',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="doctor" size={size} color={color} />
                    ),
                    drawerItemStyle: isReceptionist ? { display: 'none' } : hideIfBranchAdmin,
                }}
                redirect={isBranchAdmin || isReceptionist}
            />
            <Drawer.Screen
                name="branchadmins"
                options={{
                    drawerLabel: 'Branch Admins',
                    title: 'Branch Admins',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-tie" size={size} color={color} />
                    ),
                    drawerItemStyle: isReceptionist ? { display: 'none' } : hideIfBranchAdmin,
                }}
                redirect={isBranchAdmin || isReceptionist}
            />
            <Drawer.Screen
                name="auditlogs"
                options={{
                    drawerLabel: 'Audit Logs',
                    title: 'Audit Logs',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="file-document-outline" size={size} color={color} />
                    ),
                    drawerItemStyle: isReceptionist ? { display: 'none' } : hideIfBranchAdmin,
                }}
                redirect={isBranchAdmin || isReceptionist}
            />
            <Drawer.Screen
                name="bookings"
                options={{
                    drawerLabel: 'Bookings',
                    title: 'Bookings',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-check" size={size} color={color} />
                    ),
                    drawerItemStyle: !isReceptionist ? { display: 'none' } : undefined,
                }}
                redirect={!isReceptionist}
            />
            <Drawer.Screen
                name="customers"
                options={{
                    drawerLabel: 'Customers',
                    title: 'Customers',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-group" size={size} color={color} />
                    ),
                    drawerItemStyle: !isReceptionist ? { display: 'none' } : undefined,
                }}
                redirect={!isReceptionist}
            />
            <Drawer.Screen
                name="reports"
                options={{
                    drawerLabel: 'Reports',
                    title: 'Reports',
                    drawerItemStyle: { display: 'none' }, // Always hide from main list (handled in CustomDrawerContent)
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="chart-box-outline" size={size} color={color} />
                    ),
                }}
                redirect={isReceptionist}
            />
            <Drawer.Screen
                name="branch_monthly_breakdown"
                options={{
                    drawerLabel: 'Branch Breakdown',
                    title: 'Branch Monthly Breakdown',
                    drawerItemStyle: { display: 'none' }, // Always hide from main list
                }}
                redirect={isReceptionist}
            />
            <Drawer.Screen
                name="test_monthly_breakdown"
                options={{
                    drawerLabel: 'Test Breakdown',
                    title: 'Test Monthly Breakdown',
                    drawerItemStyle: { display: 'none' }, // Always hide from main list
                }}
                redirect={isReceptionist}
            />
            <Drawer.Screen
                name="settings"
                options={{
                    drawerLabel: 'Settings',
                    title: 'Settings',
                    drawerItemStyle: { display: 'none' }, // Always hide from main list
                }}
            />
            <Drawer.Screen
                name="branch_users"
                options={{
                    drawerLabel: 'Branch Users',
                    title: 'Branch Users',
                    drawerItemStyle: { display: 'none' }, // Always hide from main list
                }}
                redirect={isReceptionist}
            />
        </Drawer>
    );
}
