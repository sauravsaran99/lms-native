import api from "./api";

export const createPayment = (formData: FormData) => {
    return api.post("/payments", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
