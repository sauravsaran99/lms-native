import api from "./api";

// Re-export types if needed or define them here
export interface Customer {
    id: number;
    name: string;
    phone: string;
    dob?: string;
    gender?: string;
    address?: string;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
    remarks?: string;
    state_code?: string;
    profile_image?: string;
    base_branch_id?: number;
}

export const searchCustomers = (q: string) => api.get(`/customers/search?q=${q}`);

export const createCustomer = (formData: FormData) => {
    return api.post("/customers", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const updateCustomer = (id: number, formData: FormData) => {
    return api.put(`/customers/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const getCustomers = (page: number = 1, limit: number = 10, myBranchOnly: boolean = false) => {
    return api.get(`/customers?page=${page}&limit=${limit}&myBranchOnly=${myBranchOnly}`);
};
