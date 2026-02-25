# Supabase DDL（runs / edit_logs）

本ドキュメントは [09-app-design.md](09-app-design.md) 2.2 に基づくテーブル定義の DDL をまとめたものです。  
実体は `supabase/migrations/20250225000000_create_runs_and_edit_logs.sql` にあり、適用済みの場合は Supabase 上で同内容が反映されています。

---

## 1. runs

1 回の「生成」を 1 件の実行として格納するテーブル。

```sql
CREATE TABLE runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_url text NOT NULL,
  company_name text,
  summary_business text,
  hypothesis_segment_1 text,
  hypothesis_segment_2 text,
  hypothesis_segment_3 text,
  hypothesis_segment_4 text,
  hypothesis_segment_5 text,
  letter_draft text,
  regenerated_count smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー。default gen_random_uuid() |
| input_url | text NOT NULL | 入力された企業 URL |
| company_name | text | 入力された会社名（空の場合は null） |
| summary_business | text | 事業要約 |
| hypothesis_segment_1 〜 5 | text | 仮説 第1段〜第5段 |
| letter_draft | text | 提案文下書き |
| regenerated_count | smallint NOT NULL DEFAULT 0 | 再生成回数 |
| created_at | timestamptz NOT NULL DEFAULT now() | 初回生成日時 |
| updated_at | timestamptz NOT NULL DEFAULT now() | 最終更新日時 |

---

## 2. edit_logs

編集前後の差分および「どの段がよく編集されるか」の分析用テーブル。

```sql
CREATE TABLE edit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  target text,
  before_text text,
  after_text text NOT NULL,
  edited_at timestamptz NOT NULL DEFAULT now()
);
```

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー。default gen_random_uuid() |
| run_id | uuid NOT NULL | runs.id への外部キー。ON DELETE CASCADE |
| target | text | 編集対象。'segment_1' 〜 'segment_5' または 'letter_draft' |
| before_text | text | 編集前のテキスト |
| after_text | text NOT NULL | 編集後のテキスト |
| edited_at | timestamptz NOT NULL DEFAULT now() | 編集日時 |

---

## 3. RLS（Row Level Security）

anon ロールで runs と edit_logs の読み書きを許可（09 2.3、08 フェーズ 4）。

```sql
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_runs_all" ON runs
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_edit_logs_all" ON edit_logs
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
```

API からはサービスロールキーでアクセスするため RLS をバイパスする。anon ポリシーは将来クライアントから直接参照する場合用。
