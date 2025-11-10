'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { TripPlan } from "@/lib/types/plan";

type AMapMap = {
  add: (overlays: Array<AMapMarker | AMapPolyline>) => void;
  addControl: (control: unknown) => void;
  setFitView: (
    overlayList?: Array<AMapMarker | AMapPolyline> | null,
    immediate?: boolean,
    margin?: [number, number, number, number]
  ) => void;
  destroy: () => void;
};

type AMapMarker = {
  setMap: (map: AMapMap | null) => void;
};

type AMapPolyline = {
  setMap: (map: AMapMap | null) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMap;
  Marker: new (options: Record<string, unknown>) => AMapMarker;
  Polyline: new (options: Record<string, unknown>) => AMapPolyline;
  ToolBar: new () => unknown;
};

interface MapViewProps {
  plan: TripPlan;
}

export function MapView({ plan }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mapKey = process.env.NEXT_PUBLIC_AMAP_WEB_KEY;

  type LocationPoint = NonNullable<TripPlan["itinerary"][number]["items"][number]["location"]> & {
    latitude: number;
    longitude: number;
  };

  // 基于 Day 1 的地点名称，动态调用后端进行地理编码
  const day1PlaceNames = useMemo(() => {
    const first = plan.itinerary[0];
    if (!first) return [] as string[];
    const names = first.items
      .map((it) => it.location?.name?.trim())
      .filter((v): v is string => Boolean(v));
    // 去重，避免重复请求
    return Array.from(new Set(names));
  }, [plan]);

  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [polylines, setPolylines] = useState<Array<Array<{ longitude: number; latitude: number }>>>([]);

  const derivedError = useMemo(() => {
    if (!mapKey) {
      return "未配置高德地图密钥，暂无法展示地图。";
    }
    if (!day1PlaceNames.length) {
      return "当前行程缺少地点名称，无法展示地图。";
    }
    return null;
  }, [mapKey, day1PlaceNames]);

  // 1) 地理编码：将 Day 1 地点名称转换为经纬度
  useEffect(() => {
    if (derivedError) return;
    let aborted = false;
    const run = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/api/map-geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            places: day1PlaceNames.map((name) => ({ name, city: plan.destination })),
          }),
        });
        if (!res.ok) throw new Error(`geocode failed: ${res.status}`);
        const data = (await res.json()) as {
          results: Array<{ name: string; longitude: number; latitude: number; formattedAddress?: string }>
        };
        if (aborted) return;

        const nameToPoint = new Map<string, LocationPoint>();
        for (const r of data.results ?? []) {
          nameToPoint.set(r.name, { name: r.name, latitude: r.latitude, longitude: r.longitude });
        }
        // 保持与原顺序一致
        const ordered = day1PlaceNames
          .map((name) => nameToPoint.get(name))
          .filter((p): p is LocationPoint => Boolean(p));
        setPoints(ordered);

        // 触发路径规划（两两相邻）
        const paths: Array<Array<{ longitude: number; latitude: number }>> = [];
        for (let i = 0; i < ordered.length - 1; i++) {
          const a = ordered[i]!;
          const b = ordered[i + 1]!;
          try {
            const r = await fetch("/api/map-route", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                origin: { longitude: a.longitude, latitude: a.latitude },
                destination: { longitude: b.longitude, latitude: b.latitude },
                mode: "driving",
              }),
            });
            if (!r.ok) throw new Error(`route failed: ${r.status}`);
            const j = (await r.json()) as { path: Array<{ longitude: number; latitude: number }> };
            paths.push(j.path ?? []);
          } catch (e) {
            console.warn("[MapView] route planning failed", e);
          }
        }
        if (!aborted) setPolylines(paths);
      } catch (err) {
        if (!aborted) {
          console.error("[MapView] geocode failed", err);
          setLoadError("地点解析失败，请稍后重试。");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    void run();
    return () => {
      aborted = true;
    };
  }, [derivedError, day1PlaceNames, plan.destination]);

  // 2) 地图渲染：根据地理坐标绘制标记与路径
  useEffect(() => {
    if (derivedError) return;
    if (typeof window === "undefined") return;
    if (!points.length) return; // 等待地理编码完成

    let map: AMapMap | null = null;
    let markers: AMapMarker[] = [];
    let lines: AMapPolyline[] = [];

    const loadMap = async () => {
      try {
        const { default: AMapLoader } = await import("@amap/amap-jsapi-loader");
        const AMap = (await AMapLoader.load({
          key: mapKey!,
          version: "2.0",
          plugins: ["AMap.ToolBar"],
        })) as unknown as AMapNamespace;

        if (!containerRef.current) return;

        map = new AMap.Map(containerRef.current, {
          zoom: 11,
          center: [points[0]!.longitude!, points[0]!.latitude!],
          viewMode: "3D",
        });

        markers = points.map((p, idx) =>
          new AMap.Marker({
            position: [p.longitude, p.latitude],
            title: p.name,
            label: { content: `${idx + 1}`, direction: "top" },
          })
        );
        map.add(markers);

        // 绘制路线段
        for (const path of polylines) {
          if (!path?.length) continue;
          const line = new AMap.Polyline({
            path: path.map((pt) => [pt.longitude, pt.latitude]),
            strokeColor: "#1677ff",
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          lines.push(line);
        }
        if (lines.length) map.add(lines);

        map.addControl(new AMap.ToolBar());
        map.setFitView([...markers, ...lines], true, [40, 40, 40, 40]);
        setLoadError(null);
      } catch (error) {
        console.error("[MapView] load map error", error);
        setLoadError("地图加载失败，请稍后重试。");
      }
    };

    void loadMap();

    return () => {
      markers.forEach((m) => m.setMap(null));
      lines.forEach((l) => l.setMap(null));
      markers = [];
      lines = [];
      if (map) {
        map.destroy();
        map = null;
      }
    };
  }, [derivedError, mapKey, points, polylines]);

  const errorMessage = derivedError ?? loadError;

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div ref={containerRef} className="h-full w-full" />
      {loading && !errorMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          正在加载地图数据…
        </div>
      ) : null}
      {errorMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
