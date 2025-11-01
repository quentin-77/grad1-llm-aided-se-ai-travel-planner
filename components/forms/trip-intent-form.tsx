'use client';

import { useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TripIntentPayload } from "@/lib/types/plan";

const tripIntentSchema = z
  .object({
    destination: z.string().min(1, "请输入旅行目的地"),
    startDate: z.string().min(1, "请选择出发日期"),
    endDate: z.string().min(1, "请选择结束日期"),
    budget: z.coerce
      .number()
      .min(0, "预算需大于 0")
      .max(1_000_000, "预算过大，请确认"),
    currency: z.string().min(1, "请选择预算币种"),
    adults: z.coerce.number().min(1, "至少需要一位成人"),
    children: z.coerce.number().min(0),
    seniors: z.coerce.number().min(0).default(0),
    travelThemes: z.array(z.string()).default([]),
    notes: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    "结束日期需晚于开始日期"
  );

export type TripIntentFormValues = z.infer<typeof tripIntentSchema>;

const THEME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "culinary", label: "美食" },
  { value: "family", label: "亲子" },
  { value: "culture", label: "文化" },
  { value: "nature", label: "自然" },
  { value: "adventure", label: "冒险" },
  { value: "relaxation", label: "度假" },
  { value: "shopping", label: "购物" },
  { value: "nightlife", label: "夜生活" },
];

interface TripIntentFormProps {
  defaultValues?: Partial<TripIntentFormValues>;
  isSubmitting?: boolean;
  onSubmit?: (payload: TripIntentPayload) => void | Promise<void>;
}

export function TripIntentForm({
  defaultValues,
  isSubmitting,
  onSubmit,
}: TripIntentFormProps) {
  const form = useForm<TripIntentFormValues>({
    resolver: zodResolver(tripIntentSchema),
    defaultValues: {
      destination: "",
      startDate: "",
      endDate: "",
      budget: 10000,
      currency: "CNY",
      adults: 2,
      children: 0,
      seniors: 0,
      travelThemes: ["culinary", "culture"],
      notes: "",
      ...defaultValues,
    },
  });

  const latestDefaultsRef = useRef<Partial<TripIntentFormValues> | undefined>(defaultValues);

  useEffect(() => {
    if (!defaultValues) return;
    const prev = latestDefaultsRef.current;
    const prevSerialized = prev ? JSON.stringify(prev) : null;
    const nextSerialized = JSON.stringify(defaultValues);
    if (prevSerialized !== nextSerialized) {
      form.reset({
        ...form.getValues(),
        ...defaultValues,
      });
      latestDefaultsRef.current = defaultValues;
    }
  }, [defaultValues, form]);

  const currentlySelectedThemes = useWatch({
    control: form.control,
    name: "travelThemes",
  });

  const themeLookup = useMemo(() => {
    return new Map(THEME_OPTIONS.map((item) => [item.value, item.label]));
  }, []);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: TripIntentPayload = {
      destination: values.destination,
      startDate: values.startDate,
      endDate: values.endDate,
      budget: values.budget,
      currency: values.currency,
      travelers: {
        adults: values.adults,
        children: values.children,
        seniors: values.seniors,
      },
      preferences: {
        themes: values.travelThemes.map((theme) => {
          return theme as TripIntentPayload["preferences"]["themes"][number];
        }),
      },
      notes: values.notes,
    };

    if (onSubmit) {
      await onSubmit(payload);
    } else {
      console.info("[TripIntentForm] submit payload", payload);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            旅行目的地
          </label>
          <input
            type="text"
            placeholder="例如：日本东京"
            {...form.register("destination")}
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
          {form.formState.errors.destination ? (
            <p className="mt-1 text-xs text-red-500">
              {form.formState.errors.destination.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              出发日期
            </label>
            <input
              type="date"
              {...form.register("startDate")}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
            />
            {form.formState.errors.startDate ? (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.startDate.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              返回日期
            </label>
            <input
              type="date"
              {...form.register("endDate")}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
            />
            {form.formState.errors.endDate ? (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.endDate.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              成人
            </label>
            <input
              type="number"
              min={1}
              {...form.register("adults", { valueAsNumber: true })}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
            />
            {form.formState.errors.adults ? (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.adults.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              儿童
            </label>
            <input
              type="number"
              min={0}
              {...form.register("children", { valueAsNumber: true })}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
            />
            {form.formState.errors.children ? (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.children.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              老人
            </label>
            <input
              type="number"
              min={0}
              {...form.register("seniors", { valueAsNumber: true })}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
            />
            {form.formState.errors.seniors ? (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.seniors.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              预算金额
            </label>
            <input
              type="number"
              min={0}
              {...form.register("budget", { valueAsNumber: true })}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
            />
            {form.formState.errors.budget ? (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.budget.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              币种
            </label>
            <select
              {...form.register("currency")}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="CNY">人民币 (CNY)</option>
              <option value="USD">美元 (USD)</option>
              <option value="JPY">日元 (JPY)</option>
              <option value="EUR">欧元 (EUR)</option>
              <option value="HKD">港币 (HKD)</option>
            </select>
            {form.formState.errors.currency ? (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.currency.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          旅行偏好
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_OPTIONS.map((option) => {
            const selected = currentlySelectedThemes?.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const updated = new Set(currentlySelectedThemes ?? []);
                  if (selected) {
                    updated.delete(option.value);
                  } else {
                    updated.add(option.value);
                  }
                  form.setValue("travelThemes", Array.from(updated));
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {currentlySelectedThemes?.length ? (
          <p className="mt-2 text-xs text-neutral-500">
            已选择：
            {currentlySelectedThemes
              .map((value) => themeLookup.get(value))
              .join(" / ")}
          </p>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">请选择 1-3 个偏好主题</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          补充说明
        </label>
        <textarea
          rows={4}
          placeholder="例如：希望安排 1 天迪士尼并体验当地特色美食"
          {...form.register("notes")}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="reset"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          onClick={() => form.reset()}
        >
          重置
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {isSubmitting ? "正在生成…" : "生成智能行程"}
        </button>
      </div>
    </form>
  );
}
