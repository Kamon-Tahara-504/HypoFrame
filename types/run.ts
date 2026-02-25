/** runs テーブル 1 行（アプリケーション用 camelCase）。日時は ISO 8601 文字列想定 */
export interface Run {
  id: string;
  inputUrl: string;
  companyName: string | null;
  summaryBusiness: string;
  hypothesisSegment1: string;
  hypothesisSegment2: string;
  hypothesisSegment3: string;
  hypothesisSegment4: string;
  hypothesisSegment5: string;
  letterDraft: string;
  regeneratedCount: number;
  createdAt: string;
  updatedAt: string;
}
