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
      .min(8, t("auth.validation.passwordMin8")),
  });

export const getSignUpSchema = (t) =>
  yup.object({
    fullName: yup
      .string()
      .required(t("auth.validation.nameRequired"))
      .min(2, t("auth.validation.nameTooShort")),
    email: yup
      .string()
      .required(t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid")),
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
    terms: yup.boolean().oneOf([true], t("auth.validation.termsRequired")),
  });

// Default schemas for backward compatibility
export const signInSchema = yup.object({
  email: yup
    .string()
    .required("Please enter your email.")
    .email("Invalid email address."),
  password: yup
    .string()
    .required("Please enter your password.")
    .min(8, "Password must be at least 8 characters."),
});

export const signUpSchema = yup.object({
  fullName: yup
    .string()
    .required("Please enter your full name.")
    .min(2, "Name is too short."),
  email: yup
    .string()
    .required("Please enter your email.")
    .email("Invalid email address."),
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
  terms: yup.boolean().oneOf([true], "You must agree to the Terms & Policy."),
});
