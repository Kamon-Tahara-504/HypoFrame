# アプリ設計

## 1. はじめに

本ドキュメントは、実装に必要な設計要件（データベース構造・プロジェクト構造・API 設計・その他）を定義する。既存の [01-requirements.md](01-requirements.md)・[03-system.md](03-system.md)・[04-implementation-decisions.md](04-implementation-decisions.md)・[05-ui-ux.md](05-ui-ux.md)・[07-external-requirements.md](07-external-requirements.md) の要件・方針に従う。

---

## 2. データベース構造（Supabase / PostgreSQL）

### 2.1 保存するデータの範囲

- 1 回の「生成」を 1 件の実行（run）とする。1 実行につき、入力 URL・会社名・事業要約・仮説5段・提案文下書き・生成日時を 1 レコードに格納する。
- 編集前後の差分および「どの段がよく編集されるか」の分析のため、編集履歴を別テーブルで保存する。保存する項目は run_id、編集対象（段 1〜5 または提案文）、編集前テキスト、編集後テキスト、編集日時とする。
- 同一 URL の事業要約キャッシュは、MVP では持たない。必要になった場合、別テーブルで URL 正規化文字列をキーに要約テキストと取得日時を保持し、有効期限を運用方針で定める。

### 2.2 テーブル定義

**runs**

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー。Supabase の default gen_random_uuid() とする。 |
| input_url | text | 入力された企業URL。NOT NULL。 |
| company_name | text | 入力された会社名。空の場合は null または空文字とする。 |
| summary_business | text | 事業要約。 |
| hypothesis_segment_1 | text | 仮説 第1段（企業の現在状況整理）。 |
| hypothesis_segment_2 | text | 仮説 第2段（潜在課題の仮説）。 |
| hypothesis_segment_3 | text | 仮説 第3段（課題の背景要因）。 |
| hypothesis_segment_4 | text | 仮説 第4段（改善機会・介入ポイント）。 |
| hypothesis_segment_5 | text | 仮説 第5段（提案仮説）。 |
| letter_draft | text | 提案文下書き。 |
| regenerated_count | smallint | 再生成回数。0 = 初回のみ、1 = 1回再生成済み。デフォルト 0。 |
| created_at | timestamptz | 初回生成日時。NOT NULL。 |
| updated_at | timestamptz | 最終更新日時（編集または再生成）。NOT NULL。 |

**edit_logs**

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid | 主キー。gen_random_uuid() とする。 |
| run_id | uuid | runs.id への外部キー。NOT NULL。 |
| target | text | 編集対象。'segment_1' 〜 'segment_5' または 'letter_draft' とする。 |
| before_text | text | 編集前のテキスト。 |
| after_text | text | 編集後のテキスト。NOT NULL。 |
| edited_at | timestamptz | 編集日時。NOT NULL。 |

### 2.3 Supabase の扱い

- Row Level Security（RLS）は MVP では有効とし、anon key で runs および edit_logs の読み書きを許可する。多テナント化する場合は後でポリシーを追加する。
- マイグレーションは、リポジトリに `supabase/migrations/` を設け、SQL ファイルでスキーマを管理する。Supabase Dashboard で直接テーブルを作成した場合は、同内容の SQL を migrations に追記して履歴を残す。

---

## 3. プロジェクト構造

### 3.1 ディレクトリ構成

Next.js App Router を採用する。構成は次のとおりとする。

```
app/
  layout.tsx
  page.tsx
  api/
    generate/
      route.ts    # POST: 生成（クロール・要約・仮説・提案文）
    runs/
      route.ts    # POST: 実行結果の保存（任意）
      [id]/
        route.ts  # PATCH: 編集結果の保存（任意）
components/
  Header.tsx
  InputArea.tsx
  ResultArea.tsx
  HypothesisSegments.tsx
  ErrorDisplay.tsx
lib/
  crawl.ts        # fetch + cheerio による取得
  groq.ts         # Groq API 呼び出し
  prompts.ts      # 要約・仮説・提案文のプロンプト生成
  supabase.ts     # Supabase クライアント（サーバー用）
types/
  index.ts        # Run, HypothesisSegments, API の Request/Response 型
```

- `app/`: ページと Route Handlers（[04-implementation-decisions.md](04-implementation-decisions.md) 第9節に従う）。
- `components/`: [05-ui-ux.md](05-ui-ux.md) の画面構成に対応するブロック。ヘッダー、入力エリア、結果エリア、仮説5段表示・編集、エラー表示とする。
- `lib/`: クローラー、LLM（Groq）、プロンプト生成、Supabase クライアント。型は `types/` にまとめる。
- `types/`: 共有型（Run、仮説5段の型、API の Request/Response）を定義する。

### 3.2 命名規則

- コンポーネントおよび API ルートのファイル名は PascalCase とする（例: `Header.tsx`, `InputArea.tsx`）。`lib/` および `types/` のファイル名は camelCase とする（例: `crawl.ts`, `prompts.ts`）。
- 環境変数は、クライアントに公開するもののみ `NEXT_PUBLIC_` を付ける。それ以外はサーバー専用とする。

### 3.3 環境変数

| 変数名 | 用途 | 公開 |
|--------|------|------|
| GROQ_API_KEY | Groq API キー | サーバーのみ |
| NEXT_PUBLIC_SUPABASE_URL | Supabase プロジェクト URL | クライアント |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名キー（フェーズ8 認証。Dashboard の anon / publishable key） | クライアント |
| SUPABASE_SERVICE_ROLE_KEY | Supabase サービスロールキー（サーバーから DB 操作） | サーバーのみ |

開発・本番で同じ変数名を使い、値のみ .env.local（開発）および Railway の環境変数（本番）で切り替える。

---

## 4. API 設計

### 4.1 エンドポイント

**POST /api/generate**

- 用途: 企業URLからクロール・要約・仮説5段・提案文を生成する。
- リクエスト Body: `{ url: string, companyName?: string }`。url は必須で、http または https に限定する。
- レスポンス（成功時 200）: `{ summaryBusiness: string, hypothesisSegments: [string, string, string, string, string], letterDraft: string }`。仮説5段は固定順（01 第3節の順）で返す。ラベルはクライアントで持つ。
- 処理時間目標は 60 秒、タイムアウトは 90 秒とする（[04-implementation-decisions.md](04-implementation-decisions.md) 第2節に従う）。タイムアウト時は 408 を返す。
- 失敗時は 4xx/5xx とし、body に `{ error: string, code: string }` を返す。error は [04-implementation-decisions.md](04-implementation-decisions.md) 第5節の表示文言と同一とする。code は 'TIMEOUT' | 'CRAWL_FORBIDDEN' | 'CRAWL_EMPTY' | 'LLM_ERROR' のいずれかとする。

**POST /api/runs**（任意）

- 用途: 生成結果を DB に保存する。生成成功時にクライアントから呼ぶか、サーバー側で generate 内で保存するかは実装時に決める。
- リクエスト Body: runs テーブルに格納する内容（input_url, company_name, summary_business, hypothesis_segment_1 〜 5, letter_draft）。id はサーバーで生成する。
- レスポンス（成功時 201）: `{ id: string }`（作成した run の id）。

**PATCH /api/runs/[id]**（任意）

- 用途: 編集後の仮説5段・提案文を更新する。編集履歴（edit_logs）はサーバー側で差分を検出して記録する。
- リクエスト Body: 更新する項目（hypothesis_segment_1 〜 5, letter_draft のいずれか）。部分更新可。
- レスポンス（成功時 200）: `{ id: string }`。

**エクスポート**

- 要約・仮説5段（ラベル付き）・提案文を 1 つのテキストにまとめる処理はクライアント側で行う。ファイル名は `仮説_会社名_YYYYMMDD.txt` とする（[04-implementation-decisions.md](04-implementation-decisions.md) 第8節に従う）。サーバーでテキストを返す API は MVP では設けない。

### 4.2 エラー形式

- HTTP ステータス: タイムアウト 408、クロール 403/4xx は 502 または 400、コンテンツ空は 422、LLM エラーは 502 のいずれかとする。body は統一して `{ error: string, code: string }` とする。
- クライアントには error の文言をそのまま表示する。詳細（スタックトレース・内部メッセージ）はサーバーログにのみ出力する。

### 4.3 型（仮説5段）

- 仮説5段は `hypothesisSegments: [string, string, string, string, string]` とする。ラベル（企業の現在状況整理 など）は固定のためクライアントで保持し、API は順序保証の配列のみ返す。

---

## 5. その他

### 5.1 エラー・ログ

- サーバー側のログは Railway の標準出力に出す。Supabase には runs / edit_logs の業務データのみ書き、デバッグ用の詳細ログは DB には書かない。
- クライアントに返すエラーは [04-implementation-decisions.md](04-implementation-decisions.md) 第5節の文言に限定する。技術的な詳細は返さない。

### 5.2 認証

- MVP では認証なしとする。誰でも 1 画面で URL を入力し生成・編集・エクスポートまで行える。受託先環境で利用する場合は、リバースプロキシや VPN などでアクセス制限することを想定する。認証を組み込む場合は別要件として扱う。
