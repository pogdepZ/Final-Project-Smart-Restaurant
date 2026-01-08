import axiosClient from '../../api/axiosClient';

// Gọi API lấy danh sách
const fetchData = async () => {
  try {
    // Không cần gõ http://localhost:5000 nữa
    // Không cần gõ header Authorization thủ công nữa
    const res = await axiosClient.get('/menu/items');
    console.log(res.data);
  } catch (error) {
    console.error("Lỗi:", error);
  }
}