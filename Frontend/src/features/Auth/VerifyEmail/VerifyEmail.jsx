import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axiosClient from "../../../store/axiosClient";
import { useTranslation } from "react-i18next";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = params.get("token");
        const email = params.get("email");
        const res = await axiosClient.post("/auth/verify-email", {
          token,
          email,
        });
        setMsg(res?.message || t("auth.verifySuccess"));
        setStatus("ok");
      } catch (e) {
        setMsg(e?.response?.data?.message || t("auth.verifyFailed"));
        setStatus("fail");
      }
    })();
  }, [params, t]);

  if (status === "loading")
    return <div className="p-6 text-white">{t("auth.verifying")}</div>;

  return (
    <div className="p-6 text-white">
      <p className="mb-4">{msg}</p>
      <Link className="text-orange-400 underline" to="/signin">
        {t("auth.goToLogin")}
      </Link>
    </div>
  );
}
