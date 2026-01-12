import { useState } from "react";
import { adminMenuApi } from "../services/adminMenuApi";

export function useToggleChefRecommended() {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = async (id, value) => {
    try {
      setLoading(true);
      setError("");
      const res = await adminMenuApi.toggleChefRecommended(id, value);
      return res; // { id, isChefRecommended }
    } catch (e) {
      console.error("toggleChefRecommended error:", e);
      setError(e?.message || "Không cập nhật được Chef recommended.");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { toggle, isLoading, error };
}
