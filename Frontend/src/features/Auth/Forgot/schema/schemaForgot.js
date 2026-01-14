import * as yup from "yup";

export const forgotSchema = yup.object({
  email: yup.string().required("Vui lòng nhập email.").email("Email không hợp lệ."),
});
