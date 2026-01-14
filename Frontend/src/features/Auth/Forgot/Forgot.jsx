import React from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import Input from "../../../Components/Input";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {forgotSchema} from "./schema/schemaForgot"
import { authApi } from "../../../services/authApi";
import { toast } from "react-toastify";

export default function Forgot() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgotPassword(email);
      // ✅ Không nói “email có tồn tại hay không”
      toast.success("Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không gửi được email, thử lại sau.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/3 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-black">Quên mật khẩu</h1>
        <p className="text-sm text-white/60 mt-2">
          Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>

        <form className="space-y-5 mt-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
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
            {isSubmitting ? "Đang gửi..." : "Gửi link"} <ArrowRight size={18} />
          </button>

          <div className="text-center text-sm text-white/60">
            <Link to="/signin" className="text-orange-400 font-bold hover:text-orange-300">
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
