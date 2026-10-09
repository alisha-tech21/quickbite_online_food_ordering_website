import React, { useEffect, useMemo, useState } from "react";
import {
  FiX,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiStar,
  FiCheck,
} from "react-icons/fi";

const CustomizeItemModal = ({
  isOpen,
  onClose,
  item,
  onConfirm,
  mode = "add",
}) => {
  const [quantity, setQuantity] = useState(1);

  const [selectedOptions, setSelectedOptions] = useState({
    extraSauce: false,
    extraSpicy: false,
    boiledEgg: false,
  });

  useEffect(() => {
    if (!isOpen || !item) return;

    setQuantity(Math.max(1, Math.min(99, Number(item.quantity || 1))));

    setSelectedOptions({
      extraSauce: false,
      extraSpicy: false,
      boiledEgg: false,
    });
  }, [isOpen, item]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const basePrice = Number(item?.price || 0);

  const options = [
    {
      id: "extraSauce",
      label: "Extra Sauce / Raita",
      price: 40,
    },
    {
      id: "extraSpicy",
      label: "Extra Spicy",
      price: 0,
    },
    {
      id: "boiledEgg",
      label: "Boiled Egg",
      price: 50,
    },
  ];

  const optionsTotal = useMemo(() => {
    return options.reduce((total, option) => {
      if (!selectedOptions[option.id]) return total;
      return total + option.price;
    }, 0);
  }, [selectedOptions]);

  const unitTotal = basePrice + optionsTotal;
  const totalPrice = unitTotal * quantity;

  if (!isOpen || !item) return null;

  const image =
    item.image ||
    item.imageUrl ||
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900";

  const badge =
    item.badge ||
    (Array.isArray(item.tags) ? item.tags[0] : "") ||
    "CHEF'S SIGNATURE";

  const rating = item.rating ?? 4.8;

  const handleOptionChange = (id) => {
    setSelectedOptions((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(99, current + 1));
  };

  const handleConfirm = () => {
    onConfirm?.({
      ...item,
      quantity,
      selectedOptions,
      optionsTotal,
      unitPrice: unitTotal,
      totalPrice,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-item-title"
        className="relative flex w-full max-w-[540px] max-h-[92vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
      >
        {/* IMAGE */}
        <div className="relative h-[230px] shrink-0 overflow-hidden sm:h-[270px]">
          <img
            src={image}
            alt={item.name || "Food item"}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white hover:scale-105"
            aria-label="Close"
          >
            <FiX size={21} />
          </button>

          {/* Badge */}
          <div className="absolute bottom-4 left-4 rounded-lg bg-[#ff5a36] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
            {badge}
          </div>

          {/* Rating */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800 shadow-md">
            <FiStar size={13} className="fill-orange-500 text-orange-500" />
            {rating}
          </div>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 overflow-y-auto">
          <div className="p-5 sm:p-6">
            {/* Title + Price */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="customize-item-title"
                  className="text-[22px] font-extrabold leading-tight text-[#101828] sm:text-[25px]"
                >
                  {item.name}
                </h2>

                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {item.category || "MENU ITEM"}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xl font-extrabold text-[#ff5a36]">
                  Rs. {unitTotal.toLocaleString()}
                </div>

                <div className="mt-1 text-[10px] text-slate-400">
                  {optionsTotal > 0
                    ? "Including selected options"
                    : "Base portion"}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-5">
              <h3 className="text-xs font-extrabold text-slate-800">
                Description
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                {item.description ||
                  item.desc ||
                  "Freshly prepared to order using quality ingredients."}
              </p>
            </div>

            {/* Ingredients */}
            {Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-extrabold text-slate-800">
                  Fresh Ingredients
                </h3>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.ingredients.map((ingredient, index) => (
                    <span
                      key={`${ingredient}-${index}`}
                      className="rounded-full bg-[#f1f3fd] px-2.5 py-1 text-[10px] font-medium text-slate-600"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customization */}
            <div className="mt-5 rounded-2xl bg-[#f1f3fd] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800">
                  Customize Your Order
                </h3>

                <span className="text-[10px] font-medium text-slate-400">
                  Optional add-ons
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {options.map((option) => {
                  const checked = selectedOptions[option.id];

                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleOptionChange(option.id)}
                          className="h-4 w-4 cursor-pointer accent-[#ff5a36]"
                        />

                        <span className="text-[11px] font-medium text-slate-700">
                          {option.label}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold ${
                          option.price > 0
                            ? "text-slate-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {option.price > 0 ? `+Rs. ${option.price}` : "Free"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            {/* Quantity */}
            <div className="flex h-12 shrink-0 items-center rounded-full border border-slate-200 bg-white px-1 shadow-sm">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiMinus size={16} />
              </button>

              <span className="w-7 text-center text-sm font-bold text-slate-800">
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={quantity >= 99}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff5a36] text-white transition hover:bg-[#e94e2d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiPlus size={16} />
              </button>
            </div>

            {/* Confirm */}
            <button
              type="button"
              onClick={handleConfirm}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#ff5a36] px-4 text-xs font-extrabold text-white shadow-md transition hover:bg-[#e94e2d] active:scale-[0.99]"
            >
              <FiShoppingBag size={16} />

              {mode === "edit"
                ? `Update Cart • Rs. ${totalPrice.toLocaleString()}`
                : `Add to Cart • Rs. ${totalPrice.toLocaleString()}`}
            </button>
          </div>

          <div className="mt-2 text-center text-[10px] text-slate-400">
            Final amount updates automatically with selected options.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeItemModal;
