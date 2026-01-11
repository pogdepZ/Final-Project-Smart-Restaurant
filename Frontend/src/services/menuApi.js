import axiosClient from "../store/axiosClient";

export const menuApi = {
    getMenuItems: async () => {
        const response = await axiosClient.get("/menu/items");
        return response;
    },
    getMenuCategories: async () => {
        const response = await axiosClient.get("/menu/categories");
        return response;
    }
};
