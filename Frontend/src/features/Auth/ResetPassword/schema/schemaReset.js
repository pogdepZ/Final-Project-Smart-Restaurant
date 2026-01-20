import * as yup from "yup";

export const getResetSchema = (t) =>
  yup.object({
    password: yup
      .string()
      .required(t("auth.validation.passwordRequired"))
      .min(8, t("auth.validation.passwordMin8"))
      .matches(/[A-Z]/, t("auth.validation.passwordUppercase"))
      .matches(/[a-z]/, t("auth.validation.passwordLowercase"))
      .matches(/[0-9]/, t("auth.validation.passwordNumber"))
      .matches(/[^A-Za-z0-9]/, t("auth.validation.passwordSpecial")),
    confirmPassword: yup
      .string()
      .required(t("auth.validation.confirmRequired"))
      .oneOf([yup.ref("password")], t("auth.validation.passwordMismatch")),
  });

// Default schema for backward compatibility
export const resetSchema = yup.object({
  password: yup
    .string()
    .required("Please enter your password.")
    .min(8, "Password must be at least 8 characters.")
    .matches(/[A-Z]/, "Password must have at least 1 uppercase letter.")
    .matches(/[a-z]/, "Password must have at least 1 lowercase letter.")
    .matches(/[0-9]/, "Password must have at least 1 number.")
    .matches(
      /[^A-Za-z0-9]/,
      "Password must have at least 1 special character.",
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password.")
    .oneOf([yup.ref("password")], "Passwords do not match."),
});
