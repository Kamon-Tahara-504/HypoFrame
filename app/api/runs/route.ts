/**
 * POST /api/runs
 * Body: RunInsert（id / createdAt / updatedAt を除く）。runs に 1 件挿入し { id } を返す（09 4.1）。
 */
import { createServerSupabaseClient } from "@/lib/supabase";
import type { RunInsert } from "@/types";

// --- camelCase → snake_case マッピング ---
function runInsertToRow(body: RunInsert) {
  return {
    input_url: body.inputUrl,
    company_name: body.companyName ?? null,
    summary_business: body.summaryBusiness,
    hypothesis_segment_1: body.hypothesisSegment1,
    hypothesis_segment_2: body.hypothesisSegment2,
    hypothesis_segment_3: body.hypothesisSegment3,
    hypothesis_segment_4: body.hypothesisSegment4,
    hypothesis_segment_5: body.hypothesisSegment5,
    letter_draft: body.letterDraft,
    regenerated_count: body.regeneratedCount ?? 0,
  };
}

/** Body が RunInsert として有効か（companyName は string | null | undefined のみ許可） */
function isRunInsert(body: unknown): body is RunInsert {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const okCompanyName =
    b.companyName === null ||
    b.companyName === undefined ||
    typeof b.companyName === "string";
  return (
    okCompanyName &&
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

  const row = runInsertToRow(body);
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
