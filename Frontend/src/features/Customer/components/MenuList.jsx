import React from "react";
import MenuItemCard from "./MenuItemCard";
import MenuSentinel from "./MenuSentinel";

export default function MenuList({
  items,
  addedItems,
  onSelectFood,
  onAddToCart,
  sentinelRef,
  loadingMore,
  hasMore,
  error,
  onRetryLoadMore,
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onSelect={onSelectFood}
            onAddToCart={onAddToCart}
            added={addedItems.has(item.id)}
          />
        ))}
      </div>

      <MenuSentinel
        sentinelRef={sentinelRef}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={error}
        onRetryLoadMore={onRetryLoadMore}
      />
    </>
  );
}
