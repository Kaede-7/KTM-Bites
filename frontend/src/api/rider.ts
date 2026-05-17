import API from "./axios";

export interface RiderProfileData {
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  license_number: string;
  is_available: boolean;
  rating?: number;
  rating_count?: number;
}

/** Fetch the current rider's profile */
export const fetchRiderProfile = async (): Promise<RiderProfileData> => {
  const { data } = await API.get("/rider/profile/");
  return data;
};

/** Update the rider's profile */
export const updateRiderProfile = async (payload: Partial<RiderProfileData>): Promise<{ message: string }> => {
  const { data } = await API.put("/rider/profile/", payload);
  return data;
};
