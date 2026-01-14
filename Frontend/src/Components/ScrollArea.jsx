// components/ScrollArea.jsx
import React from "react";

export default function ScrollArea({ children, className = "" }) {
  return (
    <div
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent ${className}`}
    >
      {children}
    </div>
  );
}
