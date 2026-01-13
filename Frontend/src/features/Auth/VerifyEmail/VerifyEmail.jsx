import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axiosClient from "../../../store/axiosClient";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = params.get("token");
        const email = params.get("email");
        const res = await axiosClient.post("/auth/verify-email", { token, email });
        setMsg(res?.message || "Xác thực thành công");
        setStatus("ok");
      } catch (e) {
        setMsg(e?.response?.data?.message || "Xác thực thất bại");
        setStatus("fail");
      }
    })();
  }, [params]);

  if (status === "loading") return <div className="p-6 text-white">Đang xác thực...</div>;

  return (
    <div className="p-6 text-white">
      <p className="mb-4">{msg}</p>
      <Link className="text-orange-400 underline" to="/signin">
        Về trang đăng nhập
      </Link>
    </div>
  );
}
