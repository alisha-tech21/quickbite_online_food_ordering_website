import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Utensils,
  Flame,
  Pizza,
  Soup,
  Coffee,
  IceCream,
  Sandwich,
} from "lucide-react";

import { getMenuCategoriesApi } from "../../api/menuItemApi";

const Categories = () => {
  const scrollRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getMenuCategoriesApi();
        setCategories(response.categories || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;

    const scrollAmount = 260;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };
  const handleCategoryClick = (event) => {
    event.preventDefault();

    const target = document.getElementById("popular-restaurants");

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const categoryIcons = {
    Biryani: Utensils,
    "BBQ & Grills": Flame,
    Burgers: Sandwich,
    "Artisan Pizza": Pizza,
    "Desi Food": Soup,
    "Fast Food": Utensils,
    Desserts: IceCream,
    "Chai & Drinks": Coffee,
  };

  const categoryColors = {
    Biryani: "bg-brand-50 text-brand-500",
    "BBQ & Grills": "bg-amber-50 text-amber-600",
    Burgers: "bg-brand-50 text-brand-500",
    "Artisan Pizza": "bg-brand-50 text-brand-500",
    "Desi Food": "bg-emerald-50 text-emerald-600",
    "Fast Food": "bg-slate-100 text-slate-700",
    Desserts: "bg-pink-50 text-pink-500",
    "Chai & Drinks": "bg-amber-50 text-amber-700",
  };

  return (
    <section className="border-y border-slate-200/60 bg-slate-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <div>
            <span className="font-sans text-[11px] font-extrabold uppercase tracking-wider text-brand-500 sm:text-xs">
              Cuisine Navigator
            </span>

            <h2 className="mt-0.5 font-sans text-xl font-extrabold text-slate-900 sm:text-2xl md:text-3xl">
              What are you craving?
            </h2>
          </div>

          {/* Scroll Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll categories left"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-500"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll categories right"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Categories - ONE LINE */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="min-w-[140px] shrink-0 animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4"
              >
                <div className="mx-auto mb-2 h-14 w-14 rounded-2xl bg-slate-200" />

                <div className="mx-auto h-3 w-16 rounded bg-slate-200" />

                <div className="mx-auto mt-2 h-2 w-12 rounded bg-slate-100" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="w-full py-6 text-center text-sm text-slate-500">
              No categories available yet.
            </div>
          ) : (
            categories.map((cat) => {
              const IconComponent = categoryIcons[cat.name] || Utensils;

              const colorClass =
                categoryColors[cat.name] || "bg-brand-50 text-brand-500";

              return (
                <a
                  key={cat.name}
                  href="#popular-restaurants"
                  onClick={handleCategoryClick}
                  className="group flex min-w-[140px] shrink-0 snap-start flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-500 hover:shadow-md"
                >
                  <div
                    className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-colors group-hover:bg-brand-500 group-hover:text-white ${colorClass}`}
                  >
                    <IconComponent size={26} />
                  </div>

                  <span className="whitespace-nowrap font-sans text-sm font-bold text-slate-900 transition-colors group-hover:text-brand-600">
                    {cat.name}
                  </span>

                  <span className="text-[11px] font-medium text-slate-500">
                    {cat.count} {cat.count === 1 ? "spot" : "spots"}
                  </span>
                </a>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
