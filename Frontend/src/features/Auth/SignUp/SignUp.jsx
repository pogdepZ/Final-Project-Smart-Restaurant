import React, { useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  ShieldCheck,
  Star,
  Utensils,
} from "lucide-react";
import Input from "../../../Components/Input";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { signUpSchema } from "./schema/schemaSignUp";
import { registerThunk, setCredentials } from "../../../store/slices/authSlice";
import { useDispatch } from "react-redux";
import { authApi } from "../../../services/authApi";
import axiosClient from "../../../store/axiosClient";

const SignUp = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const debounceRef = useRef(null);

  const checkEmailRealtime = (rawEmail) => {
    const email = String(rawEmail || "")
      .trim()
      .toLowerCase();

    // nếu đang lỗi format email thì không check server
    const okFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || !okFormat) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authApi.checkEmail(email);

        if (res?.exists) {
          setError("email", {
            type: "manual",
            message: "Email này đã được sử dụng.",
          });
        } else {
          // chỉ clear nếu lỗi hiện tại là do exists
          if (errors.email?.message === "Email này đã được sử dụng.") {
            clearErrors("email");
          }
        }
      } catch (e) {
        // không block user nếu API lỗi
      }
    }, 500); // 400-700ms tuỳ bạn
  };

  const dispatch = useDispatch();
  const onSubmit = async (values) => {
    const { fullName, password, email } = values;
    const data = {
      name: fullName,
      password,
      email,
    };
    const res = await dispatch(registerThunk(data));
  };

  const googleBtnRef = useRef(null);
  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await axiosClient.post("/auth/google", {
            credential: response.credential,
          });

          dispatch(
            setCredentials({ accessToken: res.accessToken, user: res.user })
          );

          const role = res?.user?.role;
          if (role === "admin") navigate("/admin");
          else if (role === "waiter") navigate("/waiter");
          else if (role === "kitchen") navigate("/kitchen");
          else navigate("/");
        } catch (e) {
          console.log("Google signup/signin failed:", e);
        }
      },
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "signup_with",
    });
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans bg-neutral-950">
      {/* 1. Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80"
          alt="Fine Dining"
          className="w-full h-full object-cover opacity-30 lg:opacity-50"
        />
        <div className="absolute inset-0 bg-neutral-950/80 lg:bg-linear-to-r lg:from-neutral-950/80 lg:via-neutral-950/40 lg:to-transparent"></div>
      </div>

      {/* 2. Left Desktop */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-48 z-10 overflow-hidden">
        <div className="flex flex-col leading-none">
          <span className="font-display text-5xl text-orange-400">Lumière</span>
          <span className="font-sans text-[10px] tracking-[0.4em] uppercase mt-2 text-white/60 font-black">
            Bistro
          </span>
        </div>

        <div className="max-w-md space-y-8">
          <h2 className="text-4xl font-black text-white leading-tight">
            Trở thành <span className="text-orange-500">Hội Viên</span> <br />
            Nhận ngay ưu đãi đặc quyền.
          </h2>

          <div className="space-y-5 text-white/80">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 mt-1">
                <Star size={20} />
              </div>
              <div>
                <p className="font-bold text-white italic">
                  Giảm 10% cho lần đặt bàn đầu tiên
                </p>
                <p className="text-xs text-white/50">
                  Áp dụng cho toàn bộ menu tại nhà hàng.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 mt-1">
                <Utensils size={20} />
              </div>
              <div>
                <p className="font-bold text-white italic">Tích điểm đổi quà</p>
                <p className="text-xs text-white/50">
                  Mỗi bữa ăn đều mang lại giá trị tích lũy lâu dài.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-white/30 text-[10px] tracking-widest uppercase italic">
          Join the Elite Taste — Since 2026
        </div>
      </div>

      {/* 3. Form */}
      <div className="relative z-10 w-full lg:w-1/2 flex justify-center items-center px-4 py-10">
        <div className="w-full max-w-md bg-white/3 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <p className="font-display text-4xl text-orange-400">Lumière</p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tighter">
              Tạo Tài{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                Khoản
              </span>
            </h2>
            <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-light">
              Bắt đầu hành trình ẩm thực của bạn
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="Nguyễn Văn A"
              icon={User}
              error={errors.fullName?.message}
              {...register("fullName")}
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="example@lumiere.com"
              icon={Mail}
              error={errors.email?.message}
              {...register("email", {
                onChange: (e) => checkEmailRealtime(e.target.value),
              })}
            />

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                {...register("password")}
              />
              <Input
                label="Confirm"
                type="password"
                placeholder="••••••••"
                icon={ShieldCheck}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 px-1">
              <input
                type="checkbox"
                id="terms"
                className="mt-0.5 w-4 h-4 accent-orange-500 rounded border-white/10"
                {...register("terms")}
              />
              <label
                htmlFor="terms"
                className="text-[11px] text-gray-400 leading-snug"
              >
                Tôi đồng ý với{" "}
                <span className="text-white underline cursor-pointer">
                  Điều khoản & Chính sách
                </span>{" "}
                của nhà hàng.
              </label>
            </div>
            {errors.terms?.message ? (
              <p className="text-xs text-red-300 px-1">
                {errors.terms.message}
              </p>
            ) : null}

            {/* Submit */}
            <button
              disabled={isSubmitting}
              className={[
                "w-full py-4 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500",
                "text-white font-black rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all",
                "transform active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest mt-4",
                isSubmitting ? "opacity-70 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {isSubmitting ? "Đang tạo..." : "Đăng Ký Thành Viên"}{" "}
              <ArrowRight size={18} />
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase text-gray-500 tracking-[0.2em]">
                <span className="bg-[#080808] px-2 lg:bg-transparent">
                  Hoặc nhanh hơn với
                </span>
              </div>
            </div>

            {/* Social */}
            <div className="grid grid-cols-1 gap-4">
              <div className="w-full">
                <div
                  ref={googleBtnRef}
                  className="w-full flex justify-center"
                />
              </div>
            </div>
          </form>

          <p className="text-center text-gray-500 text-xs mt-8 uppercase tracking-wider">
            Đã có tài khoản?
            <Link
              to="/signin"
              className="text-white ml-2 font-black hover:text-orange-400 transition-colors border-b border-orange-500/30"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
