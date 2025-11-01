import { NextResponse } from "next/server";
import { generateTripPlanFromIntent } from "@/lib/api/plan/generator";
import type { TripPlanRequestBody, TripPlanResponse } from "@/lib/types/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TripPlanRequestBody;

    if (!body?.intent) {
      return NextResponse.json({ error: "缺少旅行需求参数" }, { status: 400 });
    }

    const { plan, provider } = await generateTripPlanFromIntent(body.intent);

    const response: TripPlanResponse = {
      plan,
      provider,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[/api/plan] unexpected error", error);
    return NextResponse.json(
      { error: "行程规划失败，请稍后重试" },
      { status: 500 }
    );
  }
}
