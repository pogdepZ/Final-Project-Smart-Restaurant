import * as yup from "yup";

export const resetSchema = yup.object({
   password: yup
      .string()
      .required("Vui lòng nhập mật khẩu.")
      .min(8, "Mật khẩu tối thiểu 8 ký tự.")
      .matches(/[A-Z]/, "Mật khẩu cần ít nhất 1 chữ hoa.")
      .matches(/[a-z]/, "Mật khẩu cần ít nhất 1 chữ thường.")
      .matches(/[0-9]/, "Mật khẩu cần ít nhất 1 số.")
      .matches(/[^A-Za-z0-9]/, "Mật khẩu cần ít nhất 1 ký tự đặc biệt."),
    confirmPassword: yup
      .string()
      .required("Vui lòng nhập lại mật khẩu.")
      .oneOf([yup.ref("password")], "Mật khẩu nhập lại không khớp."),
});
