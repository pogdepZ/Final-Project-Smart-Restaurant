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

export const signUpSchema = yup.object({
  fullName: yup
    .string()
    .required("Vui lòng nhập họ và tên.")
    .min(2, "Tên quá ngắn."),
  email: yup
    .string()
    .required("Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu.")
    .min(6, "Mật khẩu tối thiểu 6 ký tự."),
  confirmPassword: yup
    .string()
    .required("Vui lòng nhập lại mật khẩu.")
    .oneOf([yup.ref("password")], "Mật khẩu nhập lại không khớp."),
  terms: yup.boolean().oneOf([true], "Bạn cần đồng ý Điều khoản & Chính sách."),
});
