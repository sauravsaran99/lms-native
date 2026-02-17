export interface PincodeInfo {
    city: string;
    state: string;
    state_code: string;
}

export const pincodeData: Record<string, PincodeInfo> = {
    "400001": { city: "Mumbai", state: "Maharashtra", state_code: "MH" },
    "400002": { city: "Mumbai", state: "Maharashtra", state_code: "MH" },
    "110001": { city: "New Delhi", state: "Delhi", state_code: "DL" },
    "110002": { city: "New Delhi", state: "Delhi", state_code: "DL" },
    "560001": { city: "Bengaluru", state: "Karnataka", state_code: "KA" },
    "560002": { city: "Bengaluru", state: "Karnataka", state_code: "KA" },
    "600001": { city: "Chennai", state: "Tamil Nadu", state_code: "TN" },
    "600002": { city: "Chennai", state: "Tamil Nadu", state_code: "TN" },
    "700001": { city: "Kolkata", state: "West Bengal", state_code: "WB" },
    "700002": { city: "Kolkata", state: "West Bengal", state_code: "WB" },
    "500001": { city: "Hyderabad", state: "Telangana", state_code: "TS" },
    "500002": { city: "Hyderabad", state: "Telangana", state_code: "TS" },
    "380001": { city: "Ahmedabad", state: "Gujarat", state_code: "GJ" },
    "380002": { city: "Ahmedabad", state: "Gujarat", state_code: "GJ" },
    "302001": { city: "Jaipur", state: "Rajasthan", state_code: "RJ" },
    "302002": { city: "Jaipur", state: "Rajasthan", state_code: "RJ" },
    "226001": { city: "Lucknow", state: "Uttar Pradesh", state_code: "UP" },
    "226002": { city: "Lucknow", state: "Uttar Pradesh", state_code: "UP" },
    "440001": { city: "Nagpur", state: "Maharashtra", state_code: "MH" },
    "452001": { city: "Indore", state: "Madhya Pradesh", state_code: "MP" },
    "411001": { city: "Pune", state: "Maharashtra", state_code: "MH" },
    "122001": { city: "Gurugram", state: "Haryana", state_code: "HR" },
    "201301": { city: "Noida", state: "Uttar Pradesh", state_code: "UP" },
    "400601": { city: "Thane", state: "Maharashtra", state_code: "MH" },
    // Add more as needed or use a mock data generator
};

export const getPincodeData = (pincode: string): PincodeInfo | null => {
    return pincodeData[pincode] || null;
};
