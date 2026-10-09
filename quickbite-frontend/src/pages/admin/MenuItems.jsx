import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Store,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getAdminMenuItemsApi,
  createMenuItemApi,
  updateMenuItemApi,
  toggleMenuItemAvailabilityApi,
  deleteMenuItemApi,
} from "../../api/menuItemApi";
import AdminLayout from "../../components/adminLayout/AdminLayout";
import { uploadImageApi } from "../../api/uploadApi";
import {
  getRestaurantsApi,
  createRestaurantApi,
} from "../../api/restaurantApi";

const PRIMARY = "#ff6247";

const DEFAULT_FORM = {
  restaurant: "",
  name: "",
  description: "",
  category: "",
  price: "",
  imageUrl: "",
  imagePublicId: "",
  tags: "",
  isAvailable: true,
};
const DEFAULT_RESTAURANT_FORM = {
  name: "",
  tagline: "",
  coverImage: "",
  coverImagePublicId: "",
  logoUrl: "",
  logoPublicId: "",
  cuisines: "",
  badges: "",
  addressLine1: "",
  area: "",
  city: "",
  deliveryTimeMin: "20",
  deliveryTimeMax: "30",
  deliveryFee: "0",
  minOrder: "0",
  priceCategory: "moderate",
  openingHours: "11:00 AM - 11:30 PM",
  isOpen: true,
  isHalalCertified: true,
  isFeatured: false,
  isActive: true,
};

const CATEGORIES = [
  "Burgers",
  "Pizza",
  "BBQ & Karahi",
  "Chicken",
  "Rice",
  "Biryani",
  "Chinese",
  "Pasta",
  "Sandwiches",
  "Wraps",
  "Shakes & Drinks",
  "Desserts",
  "Sides",
  "Other",
];

function formatPrice(price) {
  const number = Number(price || 0);

  return `PKR ${number.toLocaleString("en-PK")}`;
}

function getRestaurantName(item) {
  if (!item?.restaurant) return "—";

  if (typeof item.restaurant === "object") {
    return item.restaurant.name || "Unknown Restaurant";
  }

  return "Restaurant";
}

function Modal({ children, onClose, title, width = "max-w-2xl" }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className={`w-full ${width} max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#ff6247]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#ff6247]">
        <UtensilsCrossed size={28} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        No menu items found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        There are no menu items matching your current filters.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f45137]"
      >
        <Plus size={17} />
        Add Menu Item
      </button>
    </div>
  );
}
function RestaurantModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(DEFAULT_RESTAURANT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ...DEFAULT_RESTAURANT_FORM,
      });
    }
  }, [open]);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleCoverUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingCover(true);

      const response = await uploadImageApi(
        file,
        "quickbite/restaurants/covers",
      );

      updateField("coverImage", response.imageUrl);
      updateField("coverImagePublicId", response.publicId);

      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Cover image upload failed",
      );
    } finally {
      setUploadingCover(false);
    }
  };
  const handleLogoUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingLogo(true);

      const response = await uploadImageApi(
        file,
        "quickbite/restaurants/logos",
      );

      updateField("logoUrl", response.imageUrl);
      updateField("logoPublicId", response.publicId);

      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter restaurant name");
      return;
    }

    const payload = {
      name: form.name.trim(),

      tagline: form.tagline.trim(),

      coverImage: form.coverImage.trim(),
      coverImagePublicId: form.coverImagePublicId || "",

      logoUrl: form.logoUrl.trim(),
      logoPublicId: form.logoPublicId || "",

      cuisines: form.cuisines
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      badges: form.badges
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      address: {
        line1: form.addressLine1.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
      },

      deliveryTimeMin: Number(form.deliveryTimeMin || 20),

      deliveryTimeMax: Number(form.deliveryTimeMax || 30),

      deliveryFee: Number(form.deliveryFee || 0),

      minOrder: Number(form.minOrder || 0),

      priceCategory: form.priceCategory,

      openingHours: form.openingHours.trim(),

      isOpen: Boolean(form.isOpen),

      isHalalCertified: Boolean(form.isHalalCertified),

      isFeatured: Boolean(form.isFeatured),

      isActive: Boolean(form.isActive),
    };

    try {
      setSaving(true);

      const response = await createRestaurantApi(payload);

      toast.success("Restaurant created successfully");

      const newRestaurant = response?.restaurant;

      if (onCreated) {
        onCreated(newRestaurant || null);
      }

      onClose();
    } catch (error) {
      console.error("Restaurant create error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create restaurant",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add New Restaurant"
      onClose={saving ? undefined : onClose}
      width="max-w-4xl"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(92vh-85px)] overflow-y-auto"
      >
        <div className="space-y-6 p-6">
          {/* Basic Information */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Store size={18} className="text-[#ff6247]" />

              <h3 className="text-sm font-bold text-slate-900">
                Basic Information
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Urban Grill & Smokehouse"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tagline
                </label>

                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Artisanal burgers • Smoked BBQ • Fresh drinks"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cuisines
                </label>

                <input
                  type="text"
                  value={form.cuisines}
                  onChange={(e) => updateField("cuisines", e.target.value)}
                  placeholder="Burgers, BBQ, Wings"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Separate cuisines with commas.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Badges
                </label>

                <input
                  type="text"
                  value={form.badges}
                  onChange={(e) => updateField("badges", e.target.value)}
                  placeholder="Chef Special, Free Delivery"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>

          {/* Images */}

          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Restaurant Images
            </h3>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Cover Image */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cover Image
                </label>

                <label className="flex min-h-[170px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#ff6247] hover:bg-orange-50">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      handleCoverUpload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                    disabled={uploadingCover}
                  />

                  {uploadingCover ? (
                    <div>
                      <RefreshCw className="mx-auto mb-2 h-7 w-7 animate-spin text-[#ff6247]" />

                      <p className="text-sm font-semibold text-slate-700">
                        Uploading cover...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-400" />

                      <p className="text-sm font-semibold text-slate-700">
                        Choose Cover Image
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        PNG, JPG or WEBP up to 5MB
                      </p>
                    </div>
                  )}
                </label>

                {form.coverImage && (
                  <div className="relative mt-3 h-40 overflow-hidden rounded-2xl border border-slate-200">
                    <img
                      src={form.coverImage}
                      alt={form.name || "Restaurant cover"}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        updateField("coverImage", "");
                        updateField("coverImagePublicId", "");
                      }}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-600 shadow hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Logo */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Restaurant Logo
                </label>

                <label className="flex min-h-[170px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#ff6247] hover:bg-orange-50">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      handleLogoUpload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                    disabled={uploadingLogo}
                  />

                  {uploadingLogo ? (
                    <div>
                      <RefreshCw className="mx-auto mb-2 h-7 w-7 animate-spin text-[#ff6247]" />

                      <p className="text-sm font-semibold text-slate-700">
                        Uploading logo...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-400" />

                      <p className="text-sm font-semibold text-slate-700">
                        Choose Logo
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        PNG, JPG or WEBP up to 5MB
                      </p>
                    </div>
                  )}
                </label>

                {form.logoUrl && (
                  <div className="relative mt-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={form.logoUrl}
                      alt={form.name || "Restaurant logo"}
                      className="h-full w-full object-contain p-4"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        updateField("logoUrl", "");
                        updateField("logoPublicId", "");
                      }}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-600 shadow hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Restaurant Location
            </h3>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Address
                </label>

                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                  placeholder="Main Boulevard, Building 12"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Area
                </label>

                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  placeholder="Gulberg III"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  City
                </label>

                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Lahore"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Delivery & Pricing
            </h3>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Min Delivery
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.deliveryTimeMin}
                  onChange={(e) =>
                    updateField("deliveryTimeMin", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Max Delivery
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.deliveryTimeMax}
                  onChange={(e) =>
                    updateField("deliveryTimeMax", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Delivery Fee
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.deliveryFee}
                  onChange={(e) => updateField("deliveryFee", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Minimum Order
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.minOrder}
                  onChange={(e) => updateField("minOrder", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Price Category
                </label>

                <select
                  value={form.priceCategory}
                  onChange={(e) => updateField("priceCategory", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                >
                  <option value="budget">Budget</option>
                  <option value="moderate">Moderate</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Opening Hours
                </label>

                <input
                  type="text"
                  value={form.openingHours}
                  onChange={(e) => updateField("openingHours", e.target.value)}
                  placeholder="11:00 AM - 11:30 PM"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Open Now</p>

                <p className="mt-1 text-xs text-slate-500">
                  Restaurant is accepting orders
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.isOpen}
                onChange={(e) => updateField("isOpen", e.target.checked)}
                className="h-5 w-5 accent-[#ff6247]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Halal Certified
                </p>

                <p className="mt-1 text-xs text-slate-500">Show halal badge</p>
              </div>

              <input
                type="checkbox"
                checked={form.isHalalCertified}
                onChange={(e) =>
                  updateField("isHalalCertified", e.target.checked)
                }
                className="h-5 w-5 accent-[#ff6247]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Featured</p>

                <p className="mt-1 text-xs text-slate-500">
                  Show as featured restaurant
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => updateField("isFeatured", e.target.checked)}
                className="h-5 w-5 accent-[#ff6247]"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f45137] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <RefreshCw size={16} className="animate-spin" />}

            {saving ? "Creating..." : "Create Restaurant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function MenuItemModal({
  open,
  onClose,
  editingItem,
  restaurants,
  onSaved,
  selectedRestaurantId,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      setForm({
        restaurant:
          typeof editingItem.restaurant === "object"
            ? editingItem.restaurant?._id || ""
            : editingItem.restaurant || "",
        name: editingItem.name || "",
        description: editingItem.description || "",
        category: editingItem.category || "",
        price: editingItem.price ?? "",
        imageUrl: editingItem.imageUrl || "",
        imagePublicId: editingItem.imagePublicId || "",
        tags: Array.isArray(editingItem.tags)
          ? editingItem.tags.join(", ")
          : "",
        isAvailable:
          editingItem.isAvailable === undefined
            ? true
            : Boolean(editingItem.isAvailable),
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        restaurant: selectedRestaurantId || "",
      });
    }
  }, [open, editingItem, selectedRestaurantId]);
  if (!open) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);

      const response = await uploadImageApi(file, "quickbite/menu-items");

      updateField("imageUrl", response.imageUrl);
      updateField("imagePublicId", response.publicId);

      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.restaurant) {
      toast.error("Please select a restaurant");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Please enter menu item name");
      return;
    }

    if (!form.category.trim()) {
      toast.error("Please select a category");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const payload = {
      restaurant: form.restaurant,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
      imagePublicId: form.imagePublicId || "",
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isAvailable: form.isAvailable,
    };

    try {
      setSaving(true);

      if (editingItem) {
        await updateMenuItemApi(editingItem._id, payload);
        toast.success("Menu item updated successfully");
      } else {
        await createMenuItemApi(payload);
        toast.success("Menu item created successfully");
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Menu item save error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to save menu item",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editingItem ? "Edit Menu Item" : "Add Menu Item"}
      onClose={saving ? undefined : onClose}
      width="max-w-3xl"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(92vh-85px)] overflow-y-auto"
      >
        <div className="space-y-5 p-6">
          {/* Restaurant + Category */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Restaurant <span className="text-red-500">*</span>
                </label>
              </div>

              <select
                value={form.restaurant}
                onChange={(e) => updateField("restaurant", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Select restaurant</option>

                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>

              {restaurants.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  No restaurants available. Please add a restaurant first.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Category <span className="text-red-500">*</span>
              </label>

              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Select category</option>

                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}

                {form.category && !CATEGORIES.includes(form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
              </select>
            </div>
          </div>

          {/* Name + Price */}
          <div className="grid gap-5 md:grid-cols-[1fr_180px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Item Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Zinger Burger"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Price (PKR) <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="599"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Image */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Menu Item Image
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <label className="flex min-h-[150px] flex-1 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#ff6247] hover:bg-orange-50">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    handleImageUpload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                  disabled={uploadingImage}
                />

                <div>
                  {uploadingImage ? (
                    <>
                      <RefreshCw className="mx-auto mb-2 h-7 w-7 animate-spin text-[#ff6247]" />

                      <p className="text-sm font-semibold text-slate-700">
                        Uploading image...
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-400" />

                      <p className="text-sm font-semibold text-slate-700">
                        Choose Image
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        PNG, JPG or WEBP up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </label>

              {form.imageUrl && (
                <div className="relative h-[150px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white sm:w-[180px]">
                  <img
                    src={form.imageUrl}
                    alt={form.name || "Menu item"}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      updateField("imageUrl", "");
                      updateField("imagePublicId", "");
                    }}
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-600 shadow hover:bg-white hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe this menu item..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tags
            </label>

            <input
              type="text"
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="bestseller, spicy, chef's pick"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-100"
            />

            <p className="mt-1.5 text-xs text-slate-400">
              Separate multiple tags with commas.
            </p>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Item Availability
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Available items can be displayed on the customer menu.
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateField("isAvailable", !form.isAvailable)}
              className={`relative h-7 w-12 rounded-full transition ${
                form.isAvailable ? "bg-[#ff6247]" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  form.isAvailable ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f45137] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <RefreshCw size={16} className="animate-spin" />}

            {saving ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DetailsModal({ item, onClose }) {
  if (!item) return null;

  return (
    <Modal title="Menu Item Details" onClose={onClose} width="max-w-2xl">
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-56 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-56 items-center justify-center text-slate-400">
                <ImageIcon size={40} />
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#ff6247]">
                {item.category || "Uncategorized"}
              </span>

              {item.isAvailable ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={13} />
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                  <XCircle size={13} />
                  Unavailable
                </span>
              )}
            </div>

            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              {item.name}
            </h3>

            <p className="mt-2 text-xl font-bold text-[#ff6247]">
              {formatPrice(item.price)}
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <Store size={16} />
              {getRestaurantName(item)}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Description
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description || "No description available."}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Tags
            </p>

            {Array.isArray(item.tags) && item.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No tags.</p>
            )}
          </div>

          {Array.isArray(item.options) && item.options.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Options
              </p>

              <div className="mt-3 space-y-3">
                {item.options.map((option, index) => (
                  <div
                    key={`${option.name}-${index}`}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {option.name || "Option"}
                    </p>

                    {Array.isArray(option.choices) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {option.choices.map((choice, choiceIndex) => (
                          <span
                            key={`${choice}-${choiceIndex}`}
                            className="rounded-md bg-white px-2.5 py-1 text-xs text-slate-600"
                          >
                            {choice}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function MenuItems() {
  const [items, setItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [limit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailsItem, setDetailsItem] = useState(null);
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [newRestaurantId, setNewRestaurantId] = useState("");

  const [actionId, setActionId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

  const loadRestaurants = async () => {
    try {
      setRestaurantsLoading(true);

      const response = await getRestaurantsApi({
        page: 1,
        limit: 100,
      });

      setRestaurants(response?.restaurants || []);
    } catch (err) {
      console.error("Restaurants load error:", err);

      toast.error(err?.response?.data?.message || "Failed to load restaurants");
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (restaurantFilter) {
        params.restaurant = restaurantFilter;
      }

      if (categoryFilter !== "All") {
        params.category = categoryFilter;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await getAdminMenuItemsApi(params);

      setItems(response?.items || []);
      setTotal(Number(response?.total || 0));
      setPages(Math.max(1, Number(response?.pages || 1)));
    } catch (err) {
      console.error("Menu items load error:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load menu items";

      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    loadItems();
  }, [page, search, restaurantFilter, categoryFilter, statusFilter]);

  const availableCount = useMemo(
    () => items.filter((item) => item.isAvailable).length,
    [items],
  );

  const unavailableCount = useMemo(
    () => items.filter((item) => !item.isAvailable).length,
    [items],
  );

  const restaurantCount = useMemo(() => {
    return new Set(
      items
        .map((item) => {
          if (typeof item.restaurant === "object") {
            return item.restaurant?._id;
          }

          return item.restaurant;
        })
        .filter(Boolean),
    ).size;
  }, [items]);

  const categoriesInItems = useMemo(() => {
    const values = items.map((item) => item.category).filter(Boolean);

    return [...new Set(values)];
  }, [items]);

  const categories = useMemo(() => {
    return [...new Set([...CATEGORIES, ...categoriesInItems])];
  }, [categoriesInItems]);

  const resetFilters = () => {
    setSearch("");
    setRestaurantFilter("");
    setCategoryFilter("All");
    setStatusFilter("all");
    setPage(1);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewRestaurantId("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setActionMenuId(null);
    setEditingItem(item);
    setModalOpen(true);
  };
  const openDetailsModal = (item) => {
    setActionMenuId(null);
    setDetailsItem(item);
  };

  const handleActionMenuToggle = (itemId) => {
    setActionMenuId((prev) => (prev === itemId ? null : itemId));
  };
  const handleRestaurantCreated = async (newRestaurant) => {
    await loadRestaurants();

    if (newRestaurant?._id) {
      setNewRestaurantId(newRestaurant._id);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      setActionId(item._id);

      await toggleMenuItemAvailabilityApi(item._id);

      toast.success(
        item.isAvailable ? "Item marked unavailable" : "Item marked available",
      );

      await loadItems();
    } catch (err) {
      console.error("Availability toggle error:", err);

      toast.error(
        err?.response?.data?.message || "Failed to update availability",
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`,
    );

    if (!confirmed) return;

    try {
      setActionId(item._id);

      await deleteMenuItemApi(item._id);

      toast.success("Menu item deleted successfully");

      if (items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadItems();
      }
    } catch (err) {
      console.error("Delete menu item error:", err);

      toast.error(err?.response?.data?.message || "Failed to delete menu item");
    } finally {
      setActionId(null);
    }
  };

  const handleSaved = async () => {
    await loadItems();
  };

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#f8f7fb] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <span>QuickBite</span>
            <span>/</span>
            <span>Portal</span>
            <span>/</span>
            <span className="font-medium text-slate-700">Menu Items</span>
          </div>

          {/* Header */}
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Menu Items
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage restaurant menu items, prices, categories and
                availability from one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setRestaurantModalOpen(true);
                  setActionMenuId(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6247]"
              >
                <Store size={18} />
                Add Restaurant
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6247] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#f45137] hover:shadow-md"
              >
                <Plus size={18} />
                Add Menu Item
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<UtensilsCrossed size={21} />}
              title="Total Items"
              value={total}
              description="Menu items matching filters"
            />

            <StatCard
              icon={<CheckCircle2 size={21} />}
              title="Available"
              value={availableCount}
              description="Available on current page"
            />

            <StatCard
              icon={<XCircle size={21} />}
              title="Unavailable"
              value={unavailableCount}
              description="Unavailable on current page"
            />

            <StatCard
              icon={<Store size={21} />}
              title="Restaurants"
              value={restaurantCount}
              description="Restaurants on current page"
            />
          </div>

          {/* Main Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            {/* Filters */}
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-4 xl:flex-row">
                {/* Search */}
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search menu items..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#ff6247] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* Restaurant */}
                <select
                  value={restaurantFilter}
                  onChange={(e) => {
                    setRestaurantFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff6247] focus:bg-white focus:ring-4 focus:ring-orange-100 xl:w-52"
                >
                  <option value="">All Restaurants</option>

                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>

                {/* Category */}
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff6247] focus:bg-white focus:ring-4 focus:ring-orange-100 xl:w-48"
                >
                  <option value="All">All Categories</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff6247] focus:bg-white focus:ring-4 focus:ring-orange-100 xl:w-44"
                >
                  <option value="all">All Status</option>
                  <option value="in_stock">Available</option>
                  <option value="out_of_stock">Unavailable</option>
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw size={16} />
                  Reset
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="px-6 py-20 text-center">
                <RefreshCw
                  size={30}
                  className="mx-auto animate-spin text-[#ff6247]"
                />

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading menu items...
                </p>
              </div>
            ) : error ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <XCircle size={26} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Unable to load menu items
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadItems}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            ) : items.length === 0 ? (
              <EmptyState onAdd={openAddModal} />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                          Item
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                          Restaurant
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                          Category
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                          Price
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                          Availability
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr
                          key={item._id}
                          className="transition hover:bg-slate-50/60"
                        >
                          {/* Item */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <UtensilsCrossed size={20} />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800">
                                  {item.name}
                                </p>

                                <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                                  {item.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Restaurant */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Store size={15} className="text-slate-400" />
                              {getRestaurantName(item)}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#ff6247]">
                              {item.category || "—"}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-slate-800">
                              {formatPrice(item.price)}
                            </span>
                          </td>

                          {/* Availability */}
                          <td className="px-5 py-4">
                            {item.isAvailable ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                                <CheckCircle2 size={14} />
                                Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                                <XCircle size={14} />
                                Unavailable
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="relative flex justify-end">
                              <button
                                type="button"
                                title="More actions"
                                onClick={() => handleActionMenuToggle(item._id)}
                                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                                  actionMenuId === item._id
                                    ? "border-orange-200 bg-orange-50 text-[#ff6247]"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6247]"
                                }`}
                              >
                                <MoreVertical size={18} />
                              </button>

                              {actionMenuId === item._id && (
                                <div className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl">
                                  {/* View Details */}
                                  <button
                                    type="button"
                                    onClick={() => openDetailsModal(item)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Eye size={17} />
                                    View Details
                                  </button>

                                  {/* Edit */}
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(item)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-orange-50 hover:text-[#ff6247]"
                                  >
                                    <Pencil size={17} />
                                    Edit
                                  </button>

                                  {/* Availability */}
                                  <button
                                    type="button"
                                    disabled={actionId === item._id}
                                    onClick={() => {
                                      setActionMenuId(null);
                                      handleToggleAvailability(item);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                                  >
                                    {actionId === item._id ? (
                                      <RefreshCw
                                        size={17}
                                        className="animate-spin"
                                      />
                                    ) : item.isAvailable ? (
                                      <XCircle size={17} />
                                    ) : (
                                      <CheckCircle2 size={17} />
                                    )}

                                    {item.isAvailable
                                      ? "Mark Unavailable"
                                      : "Mark Available"}
                                  </button>

                                  <div className="my-1 border-t border-slate-100" />

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    disabled={actionId === item._id}
                                    onClick={() => {
                                      setActionMenuId(null);
                                      handleDelete(item);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 size={17} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-4 p-4 lg:hidden">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                              <UtensilsCrossed size={22} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {item.name}
                              </h3>

                              <p className="mt-1 text-sm font-bold text-[#ff6247]">
                                {formatPrice(item.price)}
                              </p>
                            </div>

                            {item.isAvailable ? (
                              <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                                Available
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-400">Restaurant</p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {getRestaurantName(item)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-400">Category</p>
                          <p className="mt-1 font-semibold text-slate-700">
                            {item.category || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="relative mt-4 flex justify-end border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleActionMenuToggle(item._id)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                            actionMenuId === item._id
                              ? "border-orange-200 bg-orange-50 text-[#ff6247]"
                              : "border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6247]"
                          }`}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {actionMenuId === item._id && (
                          <div className="absolute right-0 top-14 z-30 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl">
                            <button
                              type="button"
                              onClick={() => openDetailsModal(item)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye size={17} />
                              View Details
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-[#ff6247]"
                            >
                              <Pencil size={17} />
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={actionId === item._id}
                              onClick={() => {
                                setActionMenuId(null);
                                handleToggleAvailability(item);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                            >
                              {item.isAvailable ? (
                                <XCircle size={17} />
                              ) : (
                                <CheckCircle2 size={17} />
                              )}

                              {item.isAvailable
                                ? "Mark Unavailable"
                                : "Mark Available"}
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              type="button"
                              disabled={actionId === item._id}
                              onClick={() => {
                                setActionMenuId(null);
                                handleDelete(item);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={17} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {items.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {total}
                    </span>{" "}
                    items
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-[#ff6247]">
                      Page {page} of {pages}
                    </div>

                    <button
                      type="button"
                      disabled={page >= pages}
                      onClick={() =>
                        setPage((prev) => Math.min(pages, prev + 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        <MenuItemModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setNewRestaurantId("");
          }}
          editingItem={editingItem}
          restaurants={restaurants}
          onSaved={handleSaved}
          selectedRestaurantId={newRestaurantId}
        />

        <RestaurantModal
          open={restaurantModalOpen}
          onClose={() => setRestaurantModalOpen(false)}
          onCreated={handleRestaurantCreated}
        />

        <DetailsModal item={detailsItem} onClose={() => setDetailsItem(null)} />
      </div>
    </AdminLayout>
  );
}
