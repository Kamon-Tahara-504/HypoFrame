/**
 * PATCH /api/runs/[id]
 * Body: 仮説5段・letterDraft の部分更新。差分を edit_logs に記録する（09 4.1）。
 * フェーズ8: 認証必須。本人の run のみ更新可。
 */
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAuthUserId } from "@/lib/supabase/server-auth";
import type { Run } from "@/types";

// --- 型・定数 ---
type PatchBody = Partial<
  Pick<
    Run,
    | "hypothesisSegment1"
    | "hypothesisSegment2"
    | "hypothesisSegment3"
    | "hypothesisSegment4"
    | "hypothesisSegment5"
    | "letterDraft"
  >
>;

const PATCH_KEYS = [
  "hypothesisSegment1",
  "hypothesisSegment2",
  "hypothesisSegment3",
  "hypothesisSegment4",
  "hypothesisSegment5",
  "letterDraft",
] as const;

const CAMEL_TO_TARGET: Record<(typeof PATCH_KEYS)[number], string> = {
  hypothesisSegment1: "segment_1",
  hypothesisSegment2: "segment_2",
  hypothesisSegment3: "segment_3",
  hypothesisSegment4: "segment_4",
  hypothesisSegment5: "segment_5",
  letterDraft: "letter_draft",
};

const CAMEL_TO_SNAKE: Record<(typeof PATCH_KEYS)[number], string> = {
  hypothesisSegment1: "hypothesis_segment_1",
  hypothesisSegment2: "hypothesis_segment_2",
  hypothesisSegment3: "hypothesis_segment_3",
  hypothesisSegment4: "hypothesis_segment_4",
  hypothesisSegment5: "hypothesis_segment_5",
  letterDraft: "letter_draft",
};

/** DB から取得した runs の一部カラム（snake_case） */
type RunsRow = {
  id: string;
  user_id: string | null;
  input_url: string | null;
  company_name: string | null;
  summary_business: string | null;
  industry: string | null;
  employee_scale: string | null;
  hypothesis_segment_1: string | null;
  hypothesis_segment_2: string | null;
  hypothesis_segment_3: string | null;
  hypothesis_segment_4: string | null;
  hypothesis_segment_5: string | null;
  letter_draft: string | null;
  regenerated_count: number | null;
  created_at: string | null;
  updated_at: string | null;
};

/** UUID v4 形式の簡易チェック */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!UUID_V4_REGEX.test(id)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return new Response(null, { status: 503 });
  }

  const { data, error } = await supabase
    .from("runs")
    .select("id, user_id, input_url, company_name, summary_business, industry, employee_scale, hypothesis_segment_1, hypothesis_segment_2, hypothesis_segment_3, hypothesis_segment_4, hypothesis_segment_5, letter_draft, regenerated_count, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const run = data as RunsRow;
  if (run.user_id !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(
    {
      run: {
        id: run.id,
        inputUrl: run.input_url ?? "",
        companyName: run.company_name ?? null,
        summaryBusiness: run.summary_business ?? "",
        industry: run.industry ?? null,
        employeeScale: run.employee_scale ?? null,
        hypothesisSegment1: run.hypothesis_segment_1 ?? "",
        hypothesisSegment2: run.hypothesis_segment_2 ?? "",
        hypothesisSegment3: run.hypothesis_segment_3 ?? "",
        hypothesisSegment4: run.hypothesis_segment_4 ?? "",
        hypothesisSegment5: run.hypothesis_segment_5 ?? "",
        letterDraft: run.letter_draft ?? "",
        regeneratedCount: run.regenerated_count ?? 0,
        createdAt: run.created_at ?? new Date(0).toISOString(),
        updatedAt: run.updated_at ?? new Date(0).toISOString(),
      },
    },
    { status: 200 }
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // --- 認証（フェーズ8） ---
  const userId = await getAuthUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- id 検証・Body パース ---
  if (!UUID_V4_REGEX.test(id)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    const raw = await request.json();
    if (!raw || typeof raw !== "object") {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    body = raw as PatchBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return new Response(null, { status: 503 });
  }

  // --- 該当 run 取得（user_id で本人のみ許可） ---
  const { data: run, error: fetchError } = await supabase
    .from("runs")
    .select("id, user_id, input_url, company_name, summary_business, industry, employee_scale, hypothesis_segment_1, hypothesis_segment_2, hypothesis_segment_3, hypothesis_segment_4, hypothesis_segment_5, letter_draft, regenerated_count, created_at, updated_at")
    .eq("id", id)
    .single();

  if (fetchError || !run) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const runRow = run as RunsRow;
  if (runRow.user_id !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // --- 編集差分を edit_logs に記録 ---
  const current = runRow;
  const currentByCamel: Record<string, string | null> = {
    hypothesisSegment1: current.hypothesis_segment_1 ?? null,
    hypothesisSegment2: current.hypothesis_segment_2 ?? null,
    hypothesisSegment3: current.hypothesis_segment_3 ?? null,
    hypothesisSegment4: current.hypothesis_segment_4 ?? null,
    hypothesisSegment5: current.hypothesis_segment_5 ?? null,
    letterDraft: current.letter_draft ?? null,
  };

  for (const key of PATCH_KEYS) {
    const value = body[key];
    if (value === undefined) continue;
    const before = currentByCamel[key] ?? "";
    const after = String(value);
    if (before === after) continue;
    const target = CAMEL_TO_TARGET[key];
    const { error: logError } = await supabase.from("edit_logs").insert({
      run_id: id,
      target,
      before_text: before,
      after_text: after,
    });
    if (logError) {
      console.error("PATCH /api/runs/[id] edit_logs insert error:", logError);
    }
  }

  // --- runs を部分更新 ---
  const updateRow: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };
  for (const key of PATCH_KEYS) {
    if (body[key] !== undefined) {
      updateRow[CAMEL_TO_SNAKE[key]] = String(body[key]);
    }
  }

  if (Object.keys(updateRow).length <= 1) {
    return Response.json({ id }, { status: 200 });
  }

  const { error: updateError } = await supabase
    .from("runs")
    .update(updateRow)
    .eq("id", id);

  if (updateError) {
    console.error("PATCH /api/runs/[id] update error:", updateError);
    return Response.json(
      { error: "Failed to update run" },
      { status: 502 }
    );
  }

  return Response.json({ id }, { status: 200 });
}
