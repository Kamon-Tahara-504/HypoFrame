import type { Run } from "@/types";

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

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  void context.params;
  const _body: PatchBody = {};
  void _body;
  return new Response(JSON.stringify({ id: "" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
