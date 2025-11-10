import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      places: Array<{ name: string; city?: string }>;
    };
    if (!body?.places?.length) {
      return NextResponse.json({ error: "缺少地名列表" }, { status: 400 });
    }
    const key = env.AMAP_WEB_KEY;
    if (!key) {
      return NextResponse.json({ error: "未配置 AMAP_WEB_KEY" }, { status: 500 });
    }

    const results: Array<{
      name: string;
      longitude: number;
      latitude: number;
      formattedAddress?: string;
    }> = [];
    
    console.log("Geocoding places:", body.places);
    for (const item of body.places) {
      const url = new URL("https://restapi.amap.com/v3/geocode/geo");
      url.searchParams.set("address", item.name);
      if (item.city) url.searchParams.set("city", item.city);
      url.searchParams.set("output", "JSON");
      url.searchParams.set("key", key);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.status !== "1" || !Array.isArray(data.geocodes) || !data.geocodes.length) {
        continue;
      }
      const first = data.geocodes[0];
      const [lngStr, latStr] = String(first.location).split(",");
      const longitude = Number(lngStr);
      const latitude = Number(latStr);
      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        results.push({
          name: item.name,
          longitude,
          latitude,
          formattedAddress: first.formatted_address,
        });
      }
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("[/api/map-geocode]", error);
    return NextResponse.json({ error: "地理编码失败" }, { status: 500 });
  }
}
