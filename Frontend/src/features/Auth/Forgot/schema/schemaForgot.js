import * as yup from "yup";

export const getForgotSchema = (t) =>
  yup.object({
    email: yup
      .string()
      .required(t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid")),
  });

// Default schema for backward compatibility
export const forgotSchema = yup.object({
  email: yup
    .string()
    .required("Please enter your email.")
    .email("Invalid email address."),
});
