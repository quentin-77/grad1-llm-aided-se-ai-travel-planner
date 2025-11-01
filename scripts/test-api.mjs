#!/usr/bin/env node

import process from "node:process";

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

async function testIntentEndpoint() {
  const transcript = "我想春节去日本东京玩五天，预算两万元，带两个孩子，希望安排动漫、美食和亲子活动。";
  const response = await fetch(`${baseUrl}/api/plan/intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcript }),
  });

  const body = await safeJson(response);
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function testPlanEndpoint(intentPayload) {
  const response = await fetch(`${baseUrl}/api/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ intent: intentPayload }),
  });

  const body = await safeJson(response);
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return { message: "无法解析响应为 JSON", raw: await response.text() };
  }
}

async function main() {
  console.log(`\n>>> Testing intent parser: ${baseUrl}/api/plan/intent`);
  const intentResult = await testIntentEndpoint();
  console.log(JSON.stringify(intentResult, null, 2));

  const intentPayload = intentResult.ok ? intentResult.body.intent : buildFallbackIntent();

  console.log(`\n>>> Testing trip planner: ${baseUrl}/api/plan`);
  const planResult = await testPlanEndpoint(intentPayload);
  console.log(JSON.stringify(planResult, null, 2));

  if (!planResult.ok) {
    process.exitCode = 1;
  }
}

function buildFallbackIntent() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)
    .toISOString()
    .slice(0, 10);
  const end = new Date(new Date(start).getTime() + 4 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    destination: "东京",
    startDate: start,
    endDate: end,
    budget: 20000,
    currency: "CNY",
    travelers: { adults: 2, children: 2, seniors: 0 },
    preferences: { themes: ["culinary", "family", "culture"] },
    notes: "备用行程测试数据",
  };
}

main().catch((error) => {
  console.error("\n>>> Test script failed", error);
  process.exit(1);
});
