/**
 * POST /api/runs
 * Body: RunInsert（id / createdAt / updatedAt を除く）。runs に 1 件挿入し { id } を返す（09 4.1）。
 * フェーズ8: 認証必須。user_id を挿入する。
 */
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUserId } from "@/lib/supabase/server-auth";
import type { RunInsert } from "@/types";

// --- camelCase → snake_case マッピング ---
function runInsertToRow(body: RunInsert, userId: string | null) {
  return {
    input_url: body.inputUrl,
    company_name: body.companyName ?? null,
    summary_business: body.summaryBusiness,
    decision_maker_name: body.decisionMakerName ?? null,
    industry: body.industry ?? null,
    employee_scale: body.employeeScale ?? null,
    hypothesis_segment_1: body.hypothesisSegment1,
    hypothesis_segment_2: body.hypothesisSegment2,
    hypothesis_segment_3: body.hypothesisSegment3,
    hypothesis_segment_4: body.hypothesisSegment4,
    hypothesis_segment_5: body.hypothesisSegment5,
    letter_draft: body.letterDraft,
    regenerated_count: body.regeneratedCount ?? 0,
    user_id: userId,
  };
}

/** Body が RunInsert として有効か（companyName / industry / employeeScale は string | null | undefined のみ許可） */
function isRunInsert(body: unknown): body is RunInsert {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const okCompanyName =
    b.companyName === null ||
    b.companyName === undefined ||
    typeof b.companyName === "string";
  const okIndustry =
    b.industry === null ||
    b.industry === undefined ||
    typeof b.industry === "string";
  const okEmployeeScale =
    b.employeeScale === null ||
    b.employeeScale === undefined ||
    typeof b.employeeScale === "string";
  const okDecisionMakerName =
    b.decisionMakerName === null ||
    b.decisionMakerName === undefined ||
    typeof b.decisionMakerName === "string";
  return (
    okCompanyName &&
    okIndustry &&
    okEmployeeScale &&
    okDecisionMakerName &&
    typeof b.inputUrl === "string" &&
    typeof b.summaryBusiness === "string" &&
    typeof b.hypothesisSegment1 === "string" &&
    typeof b.hypothesisSegment2 === "string" &&
    typeof b.hypothesisSegment3 === "string" &&
    typeof b.hypothesisSegment4 === "string" &&
    typeof b.hypothesisSegment5 === "string" &&
    typeof b.letterDraft === "string"
  );
}

export async function POST(request: Request) {
  // --- 認証（フェーズ8: 保存はログイン時のみ） ---
  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Body パース・検証 ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRunInsert(body)) {
    return Response.json(
      { error: "Missing or invalid required fields" },
      { status: 400 }
    );
  }

  // --- Supabase 挿入 ---
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return new Response(null, { status: 503 });
  }

  const row = runInsertToRow(body, userId);
  const { data, error } = await supabase
    .from("runs")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("POST /api/runs insert error:", error);
    return Response.json(
      { error: "Failed to create run" },
      { status: 502 }
    );
  }

  return Response.json({ id: data.id }, { status: 201 });
}

/**
 * GET /api/runs
 * フェーズ8: 認証必須。自分の run 一覧を返す（履歴画面用。UI は後続フェーズで可）。
 * クエリ: limit（省略時 50）, offset（省略時 0）。
 */
export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return new Response(null, { status: 503 });
  }

  const { data, error } = await supabase
    .from("runs")
    .select("id, input_url, company_name, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("GET /api/runs error:", error);
    return Response.json(
      { error: "Failed to fetch runs" },
      { status: 502 }
    );
  }

  const runs = (data ?? []).map((row) => ({
    id: row.id,
    inputUrl: row.input_url,
    companyName: row.company_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return Response.json({ runs });
}
