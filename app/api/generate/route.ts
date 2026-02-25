import type { GenerateRequest, GenerateResponse } from "@/types";

export async function POST(_request: Request) {
  const _body: GenerateRequest = { url: "" };
  void _body;
  const _res: GenerateResponse = {
    summaryBusiness: "",
    hypothesisSegments: ["", "", "", "", ""],
    letterDraft: "",
  };
  void _res;
  return new Response();
}
