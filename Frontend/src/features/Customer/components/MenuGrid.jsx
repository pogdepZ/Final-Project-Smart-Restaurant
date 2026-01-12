// src/pages/Menu/components/MenuGrid.jsx
import MenuItemCard from "./MenuItemCard";

export default function MenuGrid({ items, addedItems, onSelect, onAdd }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          added={addedItems.has(item.id)}
          onClick={() => onSelect(item)}
          onAdd={(e) => onAdd(e, item)}
        />
      ))}
    </div>
  );
}
