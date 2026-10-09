import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  Settings as SettingsIcon,
  Store,
  Truck,
  CreditCard,
  ReceiptText,
  Phone,
  Mail,
  Save,
  RotateCcw,
  CheckCircle2,
  ShoppingBag,
  WalletCards,
  Clock3,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";

import AdminLayout from "../../components/adminLayout/AdminLayout";

import {
  getAdminSettingsApi,
  updateAdminSettingsApi,
} from "../../api/settingsApi";

const DEFAULT_SETTINGS = {
  storeBrandName: "QuickBite Flagship Kitchen",
  billingCurrency: "PKR",
  supportPhone: "",
  supportEmail: "",
  acceptingOnlineOrders: true,
  baseDeliveryFee: 100,
  freeDeliveryAbove: 1500,
  deliverySlaMinMinutes: 30,
  deliverySlaMaxMinutes: 45,
  paymentMethods: {
    jazzcash: true,
    easypaisa: true,
    card: true,
    cod: true,
  },
  taxPercentage: 0,
  packagingFee: 0,
};

const PAYMENT_METHODS = [
  {
    key: "jazzcash",
    label: "JazzCash",
    description: "Allow customers to pay using JazzCash.",
    icon: WalletCards,
  },
  {
    key: "easypaisa",
    label: "Easypaisa",
    description: "Allow customers to pay using Easypaisa.",
    icon: WalletCards,
  },
  {
    key: "card",
    label: "Credit / Debit Card",
    description: "Allow customers to pay with supported cards.",
    icon: CreditCard,
  },
  {
    key: "cod",
    label: "Cash on Delivery",
    description: "Allow customers to pay when the order arrives.",
    icon: ShoppingBag,
  },
];

const formatMoney = (value, currency = "PKR") => {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const Toggle = ({ enabled, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        enabled ? "bg-[#ff6247]" : "bg-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  step,
  prefix,
  suffix,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
            {prefix}
          </span>
        )}

        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#ff6247] focus:ring-2 focus:ring-[#ff6247]/10 ${
            prefix ? "pl-10" : ""
          } ${suffix ? "pr-14" : ""}`}
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, description }) => {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1ee] text-[#ff6247]">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>

        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
};

const Settings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminSettingsApi();
      const serverSettings = response?.settings || {};

      const normalized = {
        ...DEFAULT_SETTINGS,
        ...serverSettings,
        paymentMethods: {
          ...DEFAULT_SETTINGS.paymentMethods,
          ...(serverSettings.paymentMethods || {}),
        },
      };

      setSettings(normalized);
      setInitialSettings(normalized);
    } catch (err) {
      console.error("Failed to load admin settings:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to load settings. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateField = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateNumberField = (field, value) => {
    if (value === "") {
      setSettings((current) => ({
        ...current,
        [field]: "",
      }));

      return;
    }

    setSettings((current) => ({
      ...current,
      [field]: Number(value),
    }));
  };

  const updatePaymentMethod = (method, enabled) => {
    setSettings((current) => ({
      ...current,
      paymentMethods: {
        ...current.paymentMethods,
        [method]: enabled,
      },
    }));
  };

  const handleSave = async () => {
    if (!settings.storeBrandName.trim()) {
      toast.error("Store name is required.");
      return;
    }

    if (
      settings.supportEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)
    ) {
      toast.error("Please enter a valid support email.");
      return;
    }

    if (
      Number(settings.deliverySlaMinMinutes) >
      Number(settings.deliverySlaMaxMinutes)
    ) {
      toast.error("Minimum delivery time cannot exceed maximum delivery time.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        storeBrandName: settings.storeBrandName.trim(),
        billingCurrency: settings.billingCurrency || "PKR",
        supportPhone: settings.supportPhone?.trim() || "",
        supportEmail: settings.supportEmail?.trim() || "",

        acceptingOnlineOrders: Boolean(settings.acceptingOnlineOrders),

        baseDeliveryFee: Number(settings.baseDeliveryFee || 0),

        freeDeliveryAbove: Number(settings.freeDeliveryAbove || 0),

        deliverySlaMinMinutes: Number(settings.deliverySlaMinMinutes || 0),

        deliverySlaMaxMinutes: Number(settings.deliverySlaMaxMinutes || 0),

        paymentMethods: {
          jazzcash: Boolean(settings.paymentMethods?.jazzcash),
          easypaisa: Boolean(settings.paymentMethods?.easypaisa),
          card: Boolean(settings.paymentMethods?.card),
          cod: Boolean(settings.paymentMethods?.cod),
        },

        taxPercentage: Number(settings.taxPercentage || 0),

        packagingFee: Number(settings.packagingFee || 0),
      };

      const response = await updateAdminSettingsApi(payload);

      const saved = response?.settings || payload;

      const normalized = {
        ...DEFAULT_SETTINGS,
        ...saved,
        paymentMethods: {
          ...DEFAULT_SETTINGS.paymentMethods,
          ...(saved.paymentMethods || {}),
        },
      };

      setSettings(normalized);
      setInitialSettings(normalized);

      toast.success("Settings saved successfully.");
    } catch (err) {
      console.error("Failed to save settings:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to save settings. Please try again.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!hasChanges) {
      toast("There are no unsaved changes.");
      return;
    }

    setSettings(initialSettings);
    toast.success("Changes have been reset.");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[calc(100vh-82px)] bg-[#f8f7fb] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="animate-spin text-[#ff6247]" size={28} />
              <span className="text-sm">Loading settings...</span>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* IMPORTANT:
          This wrapper belongs inside AdminLayout.
          It does NOT create another sidebar or topbar.
      */}
      <div className="min-h-[calc(100vh-82px)] bg-[#f8f7fb]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          {/* PAGE HEADER */}
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <SettingsIcon size={14} />
                <span>Administration</span>
                <span>/</span>
                <span className="text-slate-500">Settings</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Settings & System Preferences
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Manage your store, delivery, payments and checkout preferences.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasChanges && (
                <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved changes
                </span>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ef5339] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}

                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Info size={18} />

              <span>{error}</span>

              <button
                type="button"
                onClick={loadSettings}
                className="ml-auto font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* LEFT / MAIN */}
            <div className="min-w-0 space-y-5 xl:col-span-2">
              {/* GENERAL */}
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={Store}
                  title="General Information"
                  description="Basic information shown across your QuickBite store."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Store / Brand Name"
                    value={settings.storeBrandName}
                    onChange={(value) => updateField("storeBrandName", value)}
                    placeholder="QuickBite Flagship Kitchen"
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Billing Currency
                    </label>

                    <select
                      value={settings.billingCurrency}
                      onChange={(e) =>
                        updateField("billingCurrency", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#ff6247] focus:ring-2 focus:ring-[#ff6247]/10"
                    >
                      <option value="PKR">PKR — Pakistani Rupee</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* DELIVERY */}
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={Truck}
                  title="Delivery & Orders"
                  description="Control delivery charges, free delivery and estimated delivery time."
                />

                <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff6247] shadow-sm">
                      <ShoppingBag size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        Accept Online Orders
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Customers can place new orders from the storefront.
                      </p>
                    </div>
                  </div>

                  <Toggle
                    enabled={settings.acceptingOnlineOrders}
                    onChange={() =>
                      updateField(
                        "acceptingOnlineOrders",
                        !settings.acceptingOnlineOrders,
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Base Delivery Fee"
                    type="number"
                    min="0"
                    step="1"
                    prefix={settings.billingCurrency || "PKR"}
                    value={settings.baseDeliveryFee}
                    onChange={(value) =>
                      updateNumberField("baseDeliveryFee", value)
                    }
                  />

                  <Field
                    label="Free Delivery Above"
                    type="number"
                    min="0"
                    step="1"
                    prefix={settings.billingCurrency || "PKR"}
                    value={settings.freeDeliveryAbove}
                    onChange={(value) =>
                      updateNumberField("freeDeliveryAbove", value)
                    }
                  />

                  <Field
                    label="Minimum Delivery Time"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.deliverySlaMinMinutes}
                    suffix="min"
                    onChange={(value) =>
                      updateNumberField("deliverySlaMinMinutes", value)
                    }
                  />

                  <Field
                    label="Maximum Delivery Time"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.deliverySlaMaxMinutes}
                    suffix="min"
                    onChange={(value) =>
                      updateNumberField("deliverySlaMaxMinutes", value)
                    }
                  />
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#fff8f6] p-4">
                  <Clock3
                    size={18}
                    className="mt-0.5 shrink-0 text-[#ff6247]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Current delivery promise
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Customers will see an estimated delivery time of{" "}
                      <span className="font-semibold text-slate-700">
                        {settings.deliverySlaMinMinutes}–
                        {settings.deliverySlaMaxMinutes} minutes
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </section>

              {/* PAYMENT */}
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={CreditCard}
                  title="Payment Methods"
                  description="Choose which payment options customers can use at checkout."
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;

                    const enabled = Boolean(
                      settings.paymentMethods?.[method.key],
                    );

                    return (
                      <div
                        key={method.key}
                        className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition ${
                          enabled
                            ? "border-[#ff6247]/20 bg-[#fffaf8]"
                            : "border-slate-100 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              enabled
                                ? "bg-[#fff0ec] text-[#ff6247]"
                                : "bg-white text-slate-400"
                            }`}
                          >
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {method.label}
                            </p>

                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                              {method.description}
                            </p>
                          </div>
                        </div>

                        <Toggle
                          enabled={enabled}
                          onChange={() =>
                            updatePaymentMethod(method.key, !enabled)
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Payment availability
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Disabled payment methods will no longer appear as
                      selectable options during checkout.
                    </p>
                  </div>
                </div>
              </section>

              {/* TAX & PACKAGING */}
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={ReceiptText}
                  title="Tax & Packaging"
                  description="Configure additional checkout charges applied to customer orders."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field
                    label="Tax Percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.taxPercentage}
                    suffix="%"
                    onChange={(value) =>
                      updateNumberField("taxPercentage", value)
                    }
                  />

                  <Field
                    label="Packaging Fee"
                    type="number"
                    min="0"
                    step="1"
                    prefix={settings.billingCurrency || "PKR"}
                    value={settings.packagingFee}
                    onChange={(value) =>
                      updateNumberField("packagingFee", value)
                    }
                  />
                </div>

                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs leading-5 text-slate-500">
                    Tax is calculated as a percentage of the applicable order
                    amount, while the packaging fee is added as a fixed checkout
                    charge.
                  </p>
                </div>
              </section>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="min-w-0 space-y-5">
              {/* CURRENT CONFIGURATION */}
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1ee] text-[#ff6247]">
                    <CheckCircle2 size={19} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900">
                      Current Configuration
                    </h2>

                    <p className="text-xs text-slate-500">
                      Live values from your settings
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Delivery Fee</span>

                    <span className="text-sm font-bold text-slate-800">
                      {formatMoney(
                        settings.baseDeliveryFee,
                        settings.billingCurrency,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">
                      Free Delivery
                    </span>

                    <span className="text-sm font-bold text-slate-800">
                      {formatMoney(
                        settings.freeDeliveryAbove,
                        settings.billingCurrency,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Tax</span>

                    <span className="text-sm font-bold text-slate-800">
                      {settings.taxPercentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Packaging</span>

                    <span className="text-sm font-bold text-slate-800">
                      {formatMoney(
                        settings.packagingFee,
                        settings.billingCurrency,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Online Orders
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        settings.acceptingOnlineOrders
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {settings.acceptingOnlineOrders ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </section>

              {/* SUPPORT */}
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionHeader
                  icon={Phone}
                  title="Support Information"
                  description="Contact details customers can use for help."
                />

                <div className="space-y-5">
                  <Field
                    label="Support Phone"
                    value={settings.supportPhone}
                    onChange={(value) => updateField("supportPhone", value)}
                    placeholder="+92 300 1234567"
                  />

                  <Field
                    label="Support Email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(value) => updateField("supportEmail", value)}
                    placeholder="support@quickbite.com"
                  />
                </div>
              </section>

              {/* STORE STATUS */}
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      settings.acceptingOnlineOrders
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <ShoppingBag size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      Store Status
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {settings.acceptingOnlineOrders
                        ? "Your store is accepting online orders."
                        : "Online ordering is currently disabled."}
                    </p>
                  </div>
                </div>
              </section>

              {/* INFO */}
              <section className="rounded-2xl bg-[#0a2540] p-5 text-white shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Info size={17} />
                  <h3 className="text-sm font-bold">Settings tip</h3>
                </div>

                <p className="text-xs leading-5 text-slate-300">
                  Changes saved here affect the storefront and checkout
                  configuration. Make sure delivery and payment settings are
                  correct before saving.
                </p>
              </section>
            </div>
          </div>

          {/* MOBILE SAVE */}
          {hasChanges && (
            <div className="sticky bottom-3 z-20 mt-6 flex justify-end lg:hidden">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#ef5339] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
export default Settings;
