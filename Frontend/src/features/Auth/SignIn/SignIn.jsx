import React, { useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  UtensilsCrossed,
  Star,
  Clock,
} from "lucide-react";
import Input from "../../../Components/Input";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getSignInSchema } from "./schema/schemaSignIn";
import { useDispatch } from "react-redux";
import { loginThunk, setCredentials } from "../../../store/slices/authSlice";
import axiosClient from "../../../store/axiosClient";
import { useTranslation } from "react-i18next";

const SignIn = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const schema = useMemo(() => getSignInSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const result = await dispatch(loginThunk(values)).unwrap();

      toast.success(t("auth.loginSuccess"));

      const role = result?.user?.role;

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "waiter") {
        navigate("/waiter");
      } else if (role === "kitchen") {
        navigate("/kitchen");
      } else {
        navigate("/");
      }
    } catch (error) {
      const message =
        error ||
        error?.message ||
        error?.response?.data?.message ||
        t("auth.loginFailed");

      toast.error(`${message}`);
    }
  };
  const googleBtnRef = useRef(null);
  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        // response.credential = Google ID token
        const res = await axiosClient.post("/auth/google", {
          credential: response.credential,
        });

        // lưu token/user giống loginThunk
        dispatch(
          setCredentials({ accessToken: res.accessToken, user: res.user }),
        );

        // điều hướng theo role
        const role = res?.user?.role;
        if (role === "admin") navigate("/admin");
        else if (role === "waiter") navigate("/waiter");
        else if (role === "kitchen") navigate("/kitchen");
        else navigate("/");
      },
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
    });
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans bg-neutral-950">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80"
          alt="Restaurant Interior"
          className="w-full h-full object-cover shadow-2xl opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-r from-neutral-950/80 via-neutral-950/40 to-transparent" />
      </div>

      {/* Left column */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 z-10 overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col leading-none">
            <span className="font-display text-5xl text-orange-400">
              Lumière
            </span>
            <span className="font-sans text-[10px] tracking-[0.4em] uppercase mt-2 text-white/60 font-black">
              Bistro
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <h2 className="text-4xl font-black text-white font-sans leading-tight">
            {t("auth.heroTitle1")}{" "}
            <span className="text-orange-500">{t("auth.heroTitle2")}</span>{" "}
            <br />
            {t("auth.heroTitle3")}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <Star size={20} />
              </div>
              <p className="text-sm">{t("auth.feature1")}</p>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <UtensilsCrossed size={20} />
              </div>
              <p className="text-sm">{t("auth.feature2")}</p>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <Clock size={20} />
              </div>
              <p className="text-sm">{t("auth.openingHours")}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-[10px] tracking-widest uppercase italic">
          High Quality Hospitality — Since 2026
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/3 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white leading-tight">
              {t("auth.welcome")}{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                {t("auth.welcomeTo")}
              </span>
            </h2>
            <p className="text-gray-400 text-xl mt-2 font-light tracking-wide italic font-display">
              Lumière Bistro
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label={t("auth.email")}
              type="email"
              placeholder="waiter@lumiere.com"
              icon={Mail}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label={t("auth.password")}
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot"
                className="text-xs font-bold text-orange-400 hover:text-orange-300 uppercase tracking-tighter"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button
              disabled={isSubmitting}
              className={[
                "w-full py-4 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500",
                "text-white font-black rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all",
                "transform active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest",
                isSubmitting ? "opacity-70 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
              <ArrowRight size={18} />
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="px-3 text-gray-400 tracking-[0.3em]">
                  {t("auth.orLoginWith")}
                </span>
              </div>
            </div>

            {/* Social Logins (giữ nguyên UI, chưa xử lý logic) */}
            <div className="grid grid-cols-1 gap-4">
              <div ref={googleBtnRef} className="w-full flex justify-center" />
            </div>
          </form>

          <p className="text-center text-gray-500 text-[13px] mt-8">
            {t("auth.noAccount")}
            <Link
              to="/signup"
              className="text-white ml-2 font-bold hover:text-orange-400 transition-colors"
            >
              {t("auth.registerNow")}
            </Link>
          </p>

          {/* Dev tip for quick testing */}
          <p className="text-center text-gray-600 text-[11px] mt-4">
            {t("auth.devTip")}{" "}
            <span className="text-gray-300 font-bold">waiter</span>{" "}
            {t("common.or")}{" "}
            <span className="text-gray-300 font-bold">kitchen</span>{" "}
            {t("auth.devTipEnd")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
