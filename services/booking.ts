
import api from "./api";

export interface Customer {
    id: number;
    name: string;
    phone: string;
    branch_id?: number;
}
export interface Test {
    id: number;
    name: string;
    price: number | string;
}
export interface DiscountPreview {
    original_amount: number;
    discount_amount: number;
    final_amount: number;
}
export interface BookingPayload {
    customer_id: number;
    test_ids: number[];
    scheduled_date: string;
    scheduled_time: string;
    discount_type?: string;
    discount_value?: number;
}

export const searchCustomers = (q: string) => api.get(`/customers/search?q=${q}`);

export const getTests = (params?: { page?: number; limit?: number; branch_id?: number }) =>
    api.get("/tests", { params });

export const previewDiscount = (payload: any) => api.post("/discounts/preview", payload);

export const createBooking = (payload: BookingPayload) => api.post("/bookings", payload);
