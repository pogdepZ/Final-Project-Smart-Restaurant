import React from "react";

const MenuSkeletonCard = () => (
  <div className="flex gap-4 p-3 rounded-2xl border border-white/5 bg-white/0">
    <div className="w-28 h-28 rounded-xl bg-white/5 animate-pulse" />
    <div className="flex-1 py-1">
      <div className="h-5 w-2/3 bg-white/5 rounded animate-pulse" />
      <div className="mt-2 h-4 w-full bg-white/5 rounded animate-pulse" />
      <div className="mt-2 h-4 w-5/6 bg-white/5 rounded animate-pulse" />
      <div className="mt-4 flex items-end justify-between">
        <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
        <div className="h-9 w-9 bg-white/5 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

export default function MenuSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <MenuSkeletonCard key={i} />
      ))}
    </div>
  );
}
