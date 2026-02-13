
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, IconButton, Modal, Portal, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { DatePickerModal, enGB, registerTranslation } from "react-native-paper-dates";
import { useAuth } from "../../context/AuthContext";
import { getBranches } from "../../services/branch";
import { createCustomer, Customer, updateCustomer } from "../../services/customer";
import { getPincodeData } from "../../utils/pincodeData";

registerTranslation('en-GB', enGB);

interface Props {
    isOpen: boolean;
    initialData?: Customer;
    onClose: () => void;
    onSuccess?: (customer: Customer) => void;
}

const CustomerFormModal = ({ isOpen, initialData, onClose, onSuccess }: Props) => {
    const theme = useTheme();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [openDate, setOpenDate] = useState(false);
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [pincode, setPincode] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("India");
    const [remarks, setRemarks] = useState("");
    const [stateCode, setStateCode] = useState("");
    const [profileImage, setProfileImage] = useState<any | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const [branches, setBranches] = useState<any[]>([]);
    const [branchId, setBranchId] = useState<number | "">("");
    const [loading, setLoading] = useState(false);

    const { userRole } = useAuth();
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isEditMode = !!initialData;

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setPhone(initialData.phone || "");
            setDob(initialData.dob || "");
            setGender(initialData.gender || "");
            setAddress(initialData.address || "");
            setPincode(initialData.pincode || "");
            setCity(initialData.city || "");
            setState(initialData.state || "");
            setCountry(initialData.country || "India");
            setRemarks(initialData.remarks || "");
            setStateCode(initialData.state_code || "");
            if (initialData.profile_image) {
                setImagePreview(initialData.profile_image.startsWith('http') ? initialData.profile_image : `http://localhost:5000${initialData.profile_image}`);
            } else {
                setImagePreview("");
            }
            setBranchId(initialData.base_branch_id || "");
        } else {
            setName("");
            setPhone("");
            setDob("");
            setGender("");
            setAddress("");
            setPincode("");
            setCity("");
            setState("");
            setCountry("India");
            setStateCode("");
            setProfileImage(null);
            setImagePreview("");
            setBranchId("");
            setRemarks("");
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (isSuperAdmin && isOpen) {
            getBranches()
                .then((res) => setBranches(res.data))
                .catch(() => showSnackbar("Failed to load branches", 'error'));
        }
    }, [isSuperAdmin, isOpen]);

    const handlePincodeChange = (value: string) => {
        const trimmed = value.trim();
        setPincode(trimmed);
        if (trimmed.length === 6) {
            const data: any = getPincodeData(trimmed);
            if (data) {
                setCity(data.city);
                setState(data.state);
                setStateCode(data.state_code);
                showSnackbar(`Auto-filled for ${data.city}`, 'success');
            }
        }
    };

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setProfileImage(asset);
                setImagePreview(asset.uri);
            }
        } catch (e) {
            showSnackbar("Error picking image", 'error');
        }
    };

    const submit = async () => {
        if (!name.trim()) { showSnackbar("Customer name is required", 'error'); return; }
        if (!phone.trim()) { showSnackbar("Phone is required", 'error'); return; }
        if (phone.length < 10) { showSnackbar("Invalid phone number", 'error'); return; }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("phone", phone.trim());
            if (dob) formData.append("dob", dob);
            if (gender) formData.append("gender", gender);
            if (address) formData.append("address", address.trim());
            if (pincode) formData.append("pincode", pincode);
            if (city) formData.append("city", city);
            if (state) formData.append("state", state);
            if (country) formData.append("country", country);
            if (remarks) formData.append("remarks", remarks.trim());
            if (stateCode) formData.append("state_code", stateCode);

            if (profileImage) {
                const fileObj = {
                    uri: profileImage.uri,
                    name: profileImage.fileName || 'profile.jpg',
                    type: profileImage.mimeType || 'image/jpeg',
                } as any;
                formData.append("profile_image", fileObj);
            }

            if (isSuperAdmin && branchId) formData.append("base_branch_id", String(branchId));

            let response;
            if (isEditMode && initialData) {
                response = await updateCustomer(initialData.id, formData);
                showSnackbar("Customer updated successfully", 'success');
            } else {
                response = await createCustomer(formData);
                showSnackbar("Customer created successfully", 'success');
            }

            onSuccess?.(response.data.customer);
            setTimeout(() => onClose(), 1000);
        } catch (err: any) {
            const msg = err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} customer`;
            showSnackbar(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal visible={isOpen} onDismiss={onClose} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
                    <View>
                        <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{isEditMode ? "Edit Customer" : "Add New Customer"}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{isEditMode ? "Update info" : "Enter details"}</Text>
                    </View>
                    <IconButton icon="close" onPress={onClose} />
                </View>

                <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
                    {/* Image Upload */}
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={handleImagePick} style={[styles.imageContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant }]}>
                            {imagePreview ? (
                                <Image source={{ uri: imagePreview }} style={styles.image} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <IconButton icon="camera" size={30} iconColor={theme.colors.onSurfaceVariant} />
                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 5 }}>Max size: 2MB</Text>
                    </View>

                    <View style={styles.formGrid}>
                        <TextInput label="Full Name *" value={name} onChangeText={setName} mode="outlined" style={{ backgroundColor: theme.colors.surface }} />
                        <TextInput label="Phone Number *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" mode="outlined" style={{ backgroundColor: theme.colors.surface }} />
                        <View>
                            <TouchableOpacity onPress={() => setOpenDate(true)}>
                                <TextInput
                                    label="Date of Birth"
                                    value={dob ? dob : ""}
                                    mode="outlined"
                                    editable={false}
                                    right={<TextInput.Icon icon="calendar" onPress={() => setOpenDate(true)} />}
                                    style={{ backgroundColor: theme.colors.surface }}
                                />
                            </TouchableOpacity>
                            <DatePickerModal
                                locale="en-GB"
                                mode="single"
                                visible={openDate}
                                onDismiss={() => setOpenDate(false)}
                                date={dob ? new Date(dob) : undefined}
                                onConfirm={(params) => {
                                    setOpenDate(false);
                                    if (params.date) {
                                        // Adjust for timezone offset to ensure local date is used
                                        const localDate = new Date(params.date.getTime() - (params.date.getTimezoneOffset() * 60000));
                                        setDob(localDate.toISOString().split('T')[0]);
                                    }
                                }}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>Gender</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {['MALE', 'FEMALE', 'OTHER'].map(g => (
                                    <TouchableOpacity key={g} onPress={() => setGender(g)} style={[
                                        styles.choiceChip,
                                        { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant },
                                        gender === g && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                                    ]}>
                                        <Text style={{ color: gender === g ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TextInput label="Pincode" value={pincode} onChangeText={handlePincodeChange} keyboardType="numeric" mode="outlined" style={{ backgroundColor: theme.colors.surface }} />
                        <TextInput label="City" value={city} onChangeText={setCity} mode="outlined" style={{ backgroundColor: theme.colors.surface }} />
                        <TextInput label="State" value={state} onChangeText={setState} mode="outlined" style={{ backgroundColor: theme.colors.surface }} />
                        <TextInput label="State Code" value={stateCode} onChangeText={setStateCode} mode="outlined" style={{ backgroundColor: theme.colors.surface }} />
                        <TextInput label="Country" value={country} onChangeText={setCountry} mode="outlined" style={{ backgroundColor: theme.colors.surface }} />

                        {isSuperAdmin && (
                            <View style={styles.inputGroup}>
                                <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>Branch ID</Text>
                                <TextInput
                                    placeholder="Enter Branch ID"
                                    value={String(branchId)}
                                    onChangeText={(t) => setBranchId(Number(t))}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={{ backgroundColor: theme.colors.surface }}
                                />
                            </View>
                        )}

                        <TextInput label="Address" value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={2} style={{ backgroundColor: theme.colors.surface }} />
                        <TextInput label="Remarks" value={remarks} onChangeText={setRemarks} mode="outlined" multiline numberOfLines={2} style={{ backgroundColor: theme.colors.surface }} />

                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
                    <Button mode="outlined" onPress={onClose} disabled={loading} style={{ flex: 1, marginRight: 10 }}>Cancel</Button>
                    <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={{ flex: 1 }}>
                        {isEditMode ? "Save" : "Create"}
                    </Button>
                </View>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    style={{ backgroundColor: snackbarType === 'error' ? theme.colors.error : theme.colors.primary }}
                >
                    {snackbarMessage}
                </Snackbar>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        margin: 20,
        borderRadius: 12,
        height: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    body: {
        flex: 1,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    formGrid: {
        gap: 15,
    },
    inputGroup: {
        gap: 5,
        marginBottom: 5,
    },
    choiceChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    footer: {
        flexDirection: 'row',
        paddingTop: 15,
        borderTopWidth: 1,
    },
});

export default CustomerFormModal;
