import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import Input from "../../../Components/Input";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getForgotSchema } from "./schema/schemaForgot";
import { authApi } from "../../../services/authApi";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function Forgot() {
  const { t } = useTranslation();
  const schema = useMemo(() => getForgotSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgotPassword(email);
      toast.success(t("auth.resetLinkSent"));
    } catch (e) {
      toast.error(e?.response?.data?.message || t("auth.sendEmailFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/3 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-black">{t("auth.forgotPasswordTitle")}</h1>
        <p className="text-sm text-white/60 mt-2">
          {t("auth.forgotPasswordDesc")}
        </p>

        <form className="space-y-5 mt-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label={t("auth.email")}
            type="email"
            placeholder="example@lumiere.com"
            icon={Mail}
            error={errors.email?.message}
            {...register("email")}
          />

          <button
            disabled={isSubmitting}
            className={[
              "w-full py-4 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500",
              "text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest",
              isSubmitting ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {isSubmitting ? t("auth.sending") : t("auth.sendResetLink")}{" "}
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
