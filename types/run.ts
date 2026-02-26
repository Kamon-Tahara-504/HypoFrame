/** runs テーブル 1 行（アプリケーション用 camelCase）。日時は ISO 8601 文字列想定 */
export interface Run {
  id: string;
  inputUrl: string;
  companyName: string | null;
  summaryBusiness: string;
  /** 業種・事業内容（1行）。DB に無い既存行は null */
  industry: string | null;
  /** 従業員規模。DB に無い既存行は null */
  employeeScale: string | null;
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

/** GET /api/runs 一覧表示用（サイドバー履歴） */
export type RunListItem = Pick<
  Run,
  "id" | "inputUrl" | "companyName" | "createdAt" | "updatedAt"
>;

/** GET /api/runs/[id] 詳細取得用 */
export type RunDetail = Run;

/** POST /api/runs の Body（id / createdAt / updatedAt を除く）。regeneratedCount は省略時 0、companyName は省略時 null として扱う */
export type RunInsert = Omit<
  Run,
  "id" | "createdAt" | "updatedAt"
> & { regeneratedCount?: number };
