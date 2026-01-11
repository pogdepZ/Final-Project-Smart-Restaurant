import * as yup from "yup";

export const signInSchema = yup.object({
  email: yup
    .string()
    .required("Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu.")
    .min(6, "Mật khẩu tối thiểu 6 ký tự."),
});
