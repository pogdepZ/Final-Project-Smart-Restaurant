import React from "react";
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

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { signInSchema } from "./schema/schemaSignIn";
import { useDispatch } from "react-redux";
import { loginThunk } from "../../../store/slices/authSlice";

const SignIn = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await dispatch(loginThunk(values));
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

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
            Nơi hương vị <span className="text-orange-500">Châu Âu</span> <br />
            gặp gỡ tâm hồn Việt.
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <Star size={20} />
              </div>
              <p className="text-sm">
                Trải nghiệm Fine Dining 5 sao với đầu bếp quốc tế.
              </p>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <UtensilsCrossed size={20} />
              </div>
              <p className="text-sm">
                Thực đơn đa dạng từ Steak đến Pasta thủ công.
              </p>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <Clock size={20} />
              </div>
              <p className="text-sm">Mở cửa hàng ngày: 09:00 AM - 10:00 PM.</p>
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
              Chào mừng{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                đến với
              </span>
            </h2>
            <p className="text-gray-400 text-xl mt-2 font-light tracking-wide italic font-display">
              Lumière Bistro
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email Address"
              type="email"
              placeholder="waiter@lumiere.com"
              icon={Mail}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
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
                Quên mật khẩu?
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
              {isSubmitting ? "Đang đăng nhập..." : "Đăng Nhập"}
              <ArrowRight size={18} />
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="px-3 text-gray-400 tracking-[0.3em]">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            {/* Social Logins (giữ nguyên UI, chưa xử lý logic) */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-xl transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-xl transition-all"
              >
                <svg
                  className="w-5 h-5 text-[#1877F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </form>

          <p className="text-center text-gray-500 text-[13px] mt-8">
            Chưa có tài khoản?
            <Link
              to="/signup"
              className="text-white ml-2 font-bold hover:text-orange-400 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>

          {/* Tip dev để test nhanh */}
          <p className="text-center text-gray-600 text-[11px] mt-4">
            Tip dev: dùng email chứa{" "}
            <span className="text-gray-300 font-bold">waiter</span> hoặc{" "}
            <span className="text-gray-300 font-bold">kitchen</span> để auto vào
            trang tương ứng.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
