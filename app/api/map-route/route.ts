import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

type TravelMode = "driving" | "walking" | "transit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      origin: { longitude: number; latitude: number };
      destination: { longitude: number; latitude: number };
      mode?: TravelMode;
    };
    if (!body?.origin || !body?.destination) {
      return NextResponse.json({ error: "缺少起终点坐标" }, { status: 400 });
    }
    const key = env.AMAP_WEB_KEY;
    if (!key) {
      return NextResponse.json({ error: "未配置 AMAP_WEB_KEY" }, { status: 500 });
    }

    const base = "https://restapi.amap.com/v3/direction";
    const mode = body.mode ?? "driving";
    const endpoint =
      mode === "walking"
        ? `${base}/walking`
        : mode === "transit"
        ? `${base}/transit/integrated`
        : `${base}/driving`;

    const url = new URL(endpoint);
    url.searchParams.set("origin", `${body.origin.longitude},${body.origin.latitude}`);
    url.searchParams.set("destination", `${body.destination.longitude},${body.destination.latitude}`);
    url.searchParams.set("key", key);
    if (mode === "transit") url.searchParams.set("city", "");

    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.status !== "1") {
      return NextResponse.json({ path: [] }, { status: 200 });
    }

    const decodePolyline = (polyline: string) =>
      polyline
        ? polyline.split(";").map((pair: string) => {
            const [lng, lat] = pair.split(",");
            return { longitude: Number(lng), latitude: Number(lat) };
          })
        : [];

    if (mode === "transit") {
      const transits = data.route?.transits ?? [];
      if (transits.length) {
        const segs: Array<{ longitude: number; latitude: number }> = [];
        for (const seg of transits[0].segments ?? []) {
          const pl = seg.walking?.polyline || seg.bus?.buslines?.[0]?.polyline;
          if (!pl) continue;
          segs.push(...decodePolyline(pl));
        }
        return NextResponse.json({ path: segs }, { status: 200 });
      }
    }

    const paths = data.route?.paths ?? [];
    const first = paths[0];
    const coords: Array<{ longitude: number; latitude: number }> = [];
    for (const step of first?.steps ?? []) {
      coords.push(...decodePolyline(step.polyline));
    }
    return NextResponse.json({ path: coords }, { status: 200 });
  } catch (error) {
    console.error("[/api/map-route]", error);
    return NextResponse.json({ error: "路径规划失败" }, { status: 500 });
  }
}
