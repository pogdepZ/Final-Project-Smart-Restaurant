import React, { useEffect, useMemo, useState } from "react";

export default function Avatar({ url, name, size = 56, className = "" }) {
  const initial = useMemo(() => (name?.trim()?.[0] || "A").toUpperCase(), [name]);
  const [ok, setOk] = useState(!!url);

  useEffect(() => setOk(!!url), [url]);

  const boxStyle = { width: size, height: size };

  return (
    <div
      style={boxStyle}
      className={`rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center ${className}`}
    >
      {url && ok ? (
        <img
          src={url}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="text-xl font-black text-orange-200">{initial}</div>
      )}
    </div>
  );
}
