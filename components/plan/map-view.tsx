'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { TripPlan } from "@/lib/types/plan";

type AMapMap = {
  add: (overlays: AMapMarker[]) => void;
  addControl: (control: unknown) => void;
  setFitView: (overlayList?: AMapMarker[] | null, immediate?: boolean, margin?: [number, number, number, number]) => void;
  destroy: () => void;
};

type AMapMarker = {
  setMap: (map: AMapMap | null) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMap;
  Marker: new (options: Record<string, unknown>) => AMapMarker;
  ToolBar: new () => unknown;
};

interface MapViewProps {
  plan: TripPlan;
}

export function MapView({ plan }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mapKey = process.env.NEXT_PUBLIC_AMAP_WEB_KEY;

  type LocationPoint = NonNullable<TripPlan["itinerary"][number]["items"][number]["location"]>;

  const points = useMemo<LocationPoint[]>(() => {
    return plan.itinerary
      .flatMap((day) => day.items)
      .map((item) => item.location)
      .filter((location): location is LocationPoint => Boolean(location?.latitude && location?.longitude));
  }, [plan]);

  const derivedError = useMemo(() => {
    if (!mapKey) {
      return "未配置高德地图密钥，暂无法展示地图。";
    }
    if (!points.length) {
      return "当前行程缺少地理坐标，生成后将自动展示。";
    }
    return null;
  }, [mapKey, points]);

  useEffect(() => {
    if (derivedError) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    let map: AMapMap | null = null;
    let markers: AMapMarker[] = [];

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

        markers = points.map((location) =>
          new AMap.Marker({
            position: [location.longitude!, location.latitude!],
            title: location.name,
          })
        );

        map.add(markers);
        map.addControl(new AMap.ToolBar());
        map.setFitView(markers, true, [40, 40, 40, 40]);
        setLoadError(null);
      } catch (error) {
        console.error("[MapView] load map error", error);
        setLoadError("地图加载失败，请稍后重试。");
      }
    };

    void loadMap();

    return () => {
      markers.forEach((marker) => marker.setMap(null));
      markers = [];
      if (map) {
        map.destroy();
        map = null;
      }
    };
  }, [derivedError, mapKey, points]);

  const errorMessage = derivedError ?? loadError;

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div ref={containerRef} className="h-full w-full" />
      {errorMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
