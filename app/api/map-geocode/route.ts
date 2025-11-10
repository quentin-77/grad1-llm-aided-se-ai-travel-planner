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
      // 1) 优先尝试地址地理编码
      const geoUrl = new URL("https://restapi.amap.com/v3/geocode/geo");
      geoUrl.searchParams.set("address", item.name);
      if (item.city) geoUrl.searchParams.set("city", item.city);
      geoUrl.searchParams.set("output", "JSON");
      geoUrl.searchParams.set("key", key);

      const geoRes = await fetch(geoUrl.toString());
      const geoData = await geoRes.json();

      let found = false;
      if (geoData.status === "1" && Array.isArray(geoData.geocodes) && geoData.geocodes.length) {
        const first = geoData.geocodes[0];
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
          found = true;
        }
      }

      if (found) continue;

      // 2) 回退：使用 POI 关键字搜索（更适用于景点/商家）
      const placeUrl = new URL("https://restapi.amap.com/v3/place/text");
      placeUrl.searchParams.set("keywords", item.name);
      if (item.city) placeUrl.searchParams.set("city", item.city);
      placeUrl.searchParams.set("citylimit", "true");
      placeUrl.searchParams.set("output", "JSON");
      placeUrl.searchParams.set("offset", "1"); // 只取第一个最匹配的
      placeUrl.searchParams.set("page", "1");
      placeUrl.searchParams.set("key", key);

      const placeRes = await fetch(placeUrl.toString());
      const placeData = await placeRes.json();
      if (placeData.status !== "1" || !Array.isArray(placeData.pois) || !placeData.pois.length) {
        continue;
      }
      const poi = placeData.pois[0];
      const [lngStr2, latStr2] = String(poi.location).split(",");
      const lng2 = Number(lngStr2);
      const lat2 = Number(latStr2);
      if (Number.isFinite(lng2) && Number.isFinite(lat2)) {
        results.push({
          name: item.name,
          longitude: lng2,
          latitude: lat2,
          formattedAddress: poi.address ?? poi.adname ?? undefined,
        });
      }
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("[/api/map-geocode]", error);
    return NextResponse.json({ error: "地理编码失败" }, { status: 500 });
  }
}
