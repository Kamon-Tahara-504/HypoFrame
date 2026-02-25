import type { Run } from "@/types";

export async function POST() {
  const _run: Run = {
    id: "",
    inputUrl: "",
    companyName: null,
    summaryBusiness: "",
    hypothesisSegment1: "",
    hypothesisSegment2: "",
    hypothesisSegment3: "",
    hypothesisSegment4: "",
    hypothesisSegment5: "",
    letterDraft: "",
    regeneratedCount: 0,
    createdAt: "",
    updatedAt: "",
  };
  void _run;
  return new Response(null, { status: 201 });
}
