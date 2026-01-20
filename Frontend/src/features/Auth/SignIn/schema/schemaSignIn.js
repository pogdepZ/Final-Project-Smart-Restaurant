import * as yup from "yup";

export const getSignInSchema = (t) =>
  yup.object({
    email: yup
      .string()
      .required(t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid")),
    password: yup
      .string()
      .required(t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMin6")),
  });

// Default schema for backward compatibility
export const signInSchema = yup.object({
  email: yup
    .string()
    .required("Please enter your email.")
    .email("Invalid email address."),
  password: yup
    .string()
    .required("Please enter your password.")
    .min(6, "Password must be at least 6 characters."),
});
