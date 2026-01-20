import React, { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import Input from "../../../Components/Input";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getResetSchema } from "./schema/schemaReset";
import { authApi } from "../../../services/authApi";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const token = sp.get("token");

  const tokenOk = useMemo(
    () => typeof token === "string" && token.length > 10,
    [token],
  );
  const schema = useMemo(() => getResetSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ password }) => {
    if (!tokenOk) {
      toast.error(t("auth.invalidLink"));
      return;
    }
    try {
      await authApi.resetPassword({ token, newPassword: password });
      toast.success(t("auth.resetSuccess"));
      navigate("/signin");
    } catch (e) {
      toast.error(e?.response?.data?.message || t("auth.resetFailed"));
    }
  };

  if (!tokenOk) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/3 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-black">{t("auth.invalidLink")}</h1>
          <p className="text-sm text-white/60 mt-2">
            {t("auth.invalidLinkDesc")}
          </p>
          <Link
            to="/forgot"
            className="inline-block mt-6 text-orange-400 font-bold"
          >
            {t("auth.resendResetLink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/3 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-black">{t("auth.resetPassword")}</h1>
        <p className="text-sm text-white/60 mt-2">
          {t("auth.resetPasswordDesc")}
        </p>

        <form className="space-y-5 mt-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label={t("auth.newPassword")}
            type="password"
            placeholder="••••••••"
            icon={Lock}
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label={t("auth.confirmPassword")}
            type="password"
            placeholder="••••••••"
            icon={ShieldCheck}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <button
            disabled={isSubmitting}
            className={[
              "w-full py-4 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500",
              "text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest",
              isSubmitting ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {isSubmitting ? t("common.processing") : t("auth.changePassword")}{" "}
            <ArrowRight size={18} />
          </button>

          <div className="text-center text-sm text-white/60">
            <Link
              to="/signin"
              className="text-orange-400 font-bold hover:text-orange-300"
            >
              {t("auth.backToLogin")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
