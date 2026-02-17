import axios from "axios";

const api = axios.create({
  // baseURL: "https://lms-backend-production-f4eb.up.railway.app", // Replace with your actual API URL
  baseURL: "http://localhost:5000",
});

export const getTechnicians = () =>
  api.get("/users", {
    params: { role: "TECHNICIAN" },
  });

export const getUnassignedBookings = () =>
  api.get("/bookings", {
    params: { status: "CREATED" },
  });

export const assignTechnician = (bookingId: number, technicianId: number) =>
  api.post(`/bookings/${bookingId}/assign-technician`, {
    technician_id: technicianId,
  });


export const getTechnicianBookings = () => api.get("/technician/bookings");

export const collectSample = (bookingId: number) =>
  api.post(`/technician/bookings/${bookingId}/collect-sample`);

export const markBookingCompleted = (bookingId: number) =>
  api.post(`/technician/bookings/${bookingId}/complete`);

export const getCompletedBookings = () =>
  api.get("/technician/bookings/completed");

export const getDoctors = (params?: { page?: number; limit?: number }) =>
  api.get<any[]>("/doctors", { params });

export const uploadReport = (bookingId: number, file: any, taggedDoctorId?: number) => {
  const fd = new FormData();
  if (file) {
    fd.append("report", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/pdf',
    } as any);
  }
  if (taggedDoctorId) {
    fd.append("tagged_doctor_id", String(taggedDoctorId));
  }
  return api.post(`/bookings/technician/${bookingId}/upload-report`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getBookingPayments = (params?: {
  page?: number;
  limit?: number;
  test_id?: string;
  customer_id?: string;
  booking_number?: string;
}) => api.get("/payments/bookings", { params });

export const createRefund = (payload: {
  booking_number: string;
  amount: number;
  refund_mode: "CASH" | "ONLINE";
  reference_no?: string;
}) => {
  return api.post("/refunds", payload);
};

export const getTests = (params?: { page?: number; limit?: number }) =>
  api.get<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }>(
    "/tests",
    { params }
  );

export const searchCustomers = (q: string, myBranchOnly?: boolean) =>
  api.get<{ data: any[]; total: number }>(`/customers/search`, { params: { q, myBranchOnly } });

export const createPayment = (payload: any) => {
  // Check if payload is FormData
  if (payload instanceof FormData) {
    return api.post("/payments", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/payments", payload);
};

export const getCustomerBookings = () => {
  return api.get("/customers/bookings");
};

export const getCustomerBookingTests = (bookingId: number) => {
  return api.get(`/customers/bookings/${bookingId}/tests`);
};

export const getCustomerBookingReports = (bookingId: number) => {
  return api.get(`/customers/bookings/${bookingId}/reports`);
};

export const getCustomerBookingPayments = (bookingNumber: string) => {
  return api.get(`/customers/bookings/${bookingNumber}/payments`);
};

export default api;