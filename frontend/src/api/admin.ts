import API from "./axios";
import { AxiosError } from "axios";

// ═══════════════════════════════════════════
// ERROR HANDLING UTILITY
// ═══════════════════════════════════════════

interface ErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: any;
}

const handleError = (error: AxiosError<ErrorResponse>) => {
  const message =
    error.response?.data?.error ||
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred";
  throw new Error(message);
};

// ═══════════════════════════════════════════
// MENU ITEMS
// ═══════════════════════════════════════════

export const fetchMenuItems = async () => {
  try {
    const response = await API.get("/admin/menu/");
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const createMenuItem = async (data: any) => {
  try {
    const response = await API.post("/admin/menu/", data);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const updateMenuItem = async (id: number, data: any) => {
  try {
    const response = await API.put("/admin/menu/", { ...data, id });
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const deleteMenuItem = async (id: number) => {
  try {
    await API.delete("/admin/menu/", { data: { id } });
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════

export const fetchCategories = async () => {
  try {
    const response = await API.get("/admin/categories/");
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const createCategory = async (data: any) => {
  try {
    const response = await API.post("/admin/categories/", data);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const updateCategory = async (id: number, data: any) => {
  try {
    const response = await API.put("/admin/categories/", { ...data, id });
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const deleteCategory = async (id: number) => {
  try {
    await API.delete("/admin/categories/", { data: { id } });
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

// ═══════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════

export const fetchAllOrders = async () => {
  try {
    const response = await API.get("/admin/orders/");
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const fetchOrderById = async (id: number) => {
  try {
    const response = await API.get(`/admin/orders/${id}/`);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const updateOrderStatus = async (id: number, status: string) => {
  try {
    const response = await API.patch(`/admin/orders/${id}/`, { status });
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const cancelOrder = async (id: number) => {
  try {
    const response = await API.patch(`/admin/orders/${id}/`, {
      status: "cancelled",
    });
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

// ═══════════════════════════════════════════
// DASHSBOARD STATS
// ═══════════════════════════════════════════

export const getDashboardStats = async () => {
  try {
    const response = await API.get("/admin/stats/");
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

// ═══════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════

export const fetchAllUsers = async () => {
  try {
    const response = await API.get("/admin/users/");
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const createUser = async (data: any) => {
  try {
    const response = await API.post("/admin/users/", data);
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const updateUser = async (id: number, data: any) => {
  try {
    const response = await API.put("/admin/users/", { ...data, id });
    return response.data;
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};

export const deleteUser = async (id: number) => {
  try {
    await API.delete("/admin/users/", { data: { id } });
  } catch (error) {
    handleError(error as AxiosError<ErrorResponse>);
  }
};
