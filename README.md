# HypoFrame（営業思考フレームワーク実装ツール）

中小企業向け受託営業で**営業仮説の構造化**を行うWebツールです。「仮説を書くAI」ではなく、**仮説を構造化するフレームワークを動かすツール**として設計しています。

### プロジェクト工程
- **開発開始日**: 2026/2/23

---

## 目的 & 開発背景

営業活動における大きな非効率は、企業理解と仮説構築が**属人化している**ことです。多くの営業は、企業情報の収集に時間がかかり、仮説の作り方が体系化されておらず、提案文を毎回ゼロから書いています。

そこで、AIで文章を量産するのではなく、**営業の思考プロセス自体を構造化する**方向を選びました。AI文章生成ツール・企業検索ツール・経営課題分析ツールといったポジションは採用せず、**営業思考フレームワーク実装ツール**として定義しています。理由は、文章生成市場は競合が多く差別化が難しく価格競争に陥りやすい一方で、「営業の思考を構造化する」領域はまだ明確な競合が少ないためです。生成物ではなく、思考プロセスそのものを価値として提供する方が一貫性がある、という判断です。

また、最初に狙う市場は**中小向け受託営業**にしています。大企業向けは導入障壁が高く意思決定も遅いため MVP 検証に向かず、受託営業は提案文作成頻度が高く属人化しやすく標準化ニーズがあるため、検証スピードを重視してこの市場から始めます。設計は、プロダクトを広く売り込むフェーズではなく、**既存案件対応**として行う前提です。予算はできるだけ無料で実装し、日本企業向け・受託販売を想定しています。

コアバリューは、企業ごとの営業仮説（hypothesis）と提案文下書き（letter_draft）を生成することです。「企業を探す」「情報を集める」は手段であり、中心価値ではありません。中心価値は**営業仮説の構造化と再現性**です。ブランドは「営業の思考を構造化するツール」、思想は「属人化した営業仮説構築を、再現可能なプロセスへ変える」と定義しています。

ツール設計の原則は二つです。第一に、**仮説の質を標準化するツールである**こと。速さや件数より、仮説の型と質の再現性を優先します。第二に、**とにかく早くするのは避ける**こと。質を損なってまで速度を追求せず、処理時間目標も「質を犠牲にしない範囲での」目安とし、クロールや LLM の設計で中身を削って短時間に寄せるより、やや時間がかかっても仮説の質を守る方を選びます。

---

## ターゲット

中小企業向け受託営業を行う企業。利用者は営業担当者・営業責任者・少人数組織を想定しています。

---

## 機能（MVP）

**必須（7つ）**
- 企業URL入力
- Web情報取得（HPのみ）
- 事業要約生成
- 固定5段の営業仮説生成
- 提案文下書き生成
- 編集
- テキストエクスポート

**対象外（MVPでは行わない）**
- 企業検索
- IR解析
- CRM連携
- メール送信
- スコアリング
- 多言語
- チーム管理

---

## 仮説の構造（固定5段）

1. 企業の現在状況整理  
2. 潜在課題の仮説  
3. 課題の背景要因  
4. 改善機会（介入ポイント）  
5. 提案仮説  

各段は2〜4文程度とし、断定を避け、情報源は HP のみとします。

---

## 技術スタック

```mermaid
flowchart TB
    subgraph クライアント
        UI["Next.js (App Router)\n+ TypeScript\n+ Tailwind CSS"]
    end
    subgraph サーバー
        API["Route Handlers"]
    end
    subgraph 外部サービス
        Groq["Groq (LLM)"]
        Crawler["fetch + cheerio\n(クローラー)"]
        Supabase["Supabase\n(PostgreSQL)"]
    end
    subgraph デプロイ
        Railway["Railway"]
    end
    UI --> API
    API --> Groq
    API --> Crawler
    API --> Supabase
    API --> Railway
```

- **ランタイム**: Node.js 20+
- **フロント**: Next.js（App Router）+ TypeScript + Tailwind
- **API**: Next.js Route Handlers（同一リポジトリ）
- **LLM**: Groq（無料枠）
- **クロール**: fetch + cheerio（同一ドメイン最大8ページ・深度2・URL優先スコア、robots.txt 遵守）
- **DB**: Supabase（PostgreSQL）
- **デプロイ**: Railway

---

## テーブル構造（Supabase）

```mermaid
erDiagram
    runs ||--o{ edit_logs : "run_id"
    runs {
        uuid id PK "主キー"
        uuid user_id FK "auth.users.id 認証ユーザー"
        text input_url "企業URL"
        text company_name "会社名"
        text summary_business "事業要約"
        text industry "業種・事業内容"
        text employee_scale "従業員規模"
        text hypothesis_segment_1 "仮説 第1段"
        text hypothesis_segment_2 "仮説 第2段"
        text hypothesis_segment_3 "仮説 第3段"
        text hypothesis_segment_4 "仮説 第4段"
        text hypothesis_segment_5 "仮説 第5段"
        text letter_draft "提案文下書き"
        smallint regenerated_count "再生成回数"
        timestamptz created_at "生成日時"
        timestamptz updated_at "更新日時"
    }
    edit_logs {
        uuid id PK "主キー"
        uuid run_id FK "runs.id"
        text target "segment_1〜5 or letter_draft"
        text before_text "編集前"
        text after_text "編集後"
        timestamptz edited_at "編集日時"
    }
```

- `industry` と `employee_scale` は要約から抽出し、UI 表示・エクスポートに利用。
- `user_id` は認証ユーザーに紐づけ（フェーズ8）。未ログイン時は null。

---

## プロジェクト構成

```
HypoFrame/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証用ルートグループ（URL に (auth) は出ない）
│   │   ├── login/page.tsx        # /login ログイン画面
│   │   └── signup/page.tsx       # /signup 新規登録画面
│   ├── (home)/                   # ホーム用ルートグループ
│   │   └── page.tsx              # / 仮説生成ホーム
│   ├── api/
│   │   ├── auth/
│   │   │   └── google/           # GET OAuth 開始 / callback / status（フェーズ12）
│   │   ├── export/
│   │   │   ├── google-sheet/route.ts  # POST 1件を新規スプレッドシートに出力
│   │   │   └── google-docs/route.ts   # POST 手紙を新規ドキュメントに出力
│   │   ├── generate/route.ts     # POST クロール→要約→仮説→提案文（単一URL）
│   │   ├── search/route.ts       # GET 企業候補検索（Google Custom Search）
│   │   └── runs/
│   │       ├── route.ts          # GET 一覧 / POST 新規
│   │       └── [id]/route.ts     # GET 詳細 / PATCH 更新
│   ├── globals.css
│   ├── layout.tsx                # ルートレイアウト（テーマ・フォント）
│   └── icon.png
│
├── components/                   # 共通 UI コンポーネント
│   ├── ChatInputSection.tsx     # 企業URL・会社名入力
│   ├── ErrorDisplay.tsx         # エラー表示・リトライ
│   ├── Header.tsx                # ヘッダー（ロゴ・ホーム・テーマ・認証）
│   ├── HistorySidebar.tsx        # 履歴一覧・新しいチャット・ログアウト
│   ├── HypothesisSegments.tsx   # 仮説5段の表示・編集
│   ├── ResultArea.tsx           # 結果エリア（要約・仮説・提案文・保存・エクスポート）
│   ├── ResultSkeleton.tsx       # 生成中のスケルトン
│   ├── ThemeProvider.tsx        # ダーク/ライトテーマ
│   └── ThemeToggle.tsx          # テーマ切替ボタン
│
├── hooks/
│   └── useAuth.ts               # Supabase 認証状態
│
├── lib/                          # ビジネスロジック・外部連携
│   ├── crawl.ts                 # Page Collector（同一ドメイン最大8ページ）
│   ├── export.ts                # テキスト/CSV エクスポート用テキスト組み立て
│   ├── google-oauth.ts          # Google OAuth 認可・トークン・Cookie（フェーズ12）
│   ├── groq.ts                  # Groq API（要約・仮説・提案文）
│   ├── prompts.ts               # LLM プロンプト定義
│   ├── structurizer.ts         # HTML→構造化テキスト（カテゴリ整理）
│   ├── supabase/
│   │   ├── client.ts            # ブラウザ用 Supabase クライアント
│   │   └── server-auth.ts       # サーバー側認証
│   └── supabase.ts              # サーバー用 Supabase（Service Role）
│
├── types/                        # 型定義
│   ├── api-error.ts
│   ├── generate.ts              # GenerateRequest / GenerateResponse
│   ├── hypothesis.ts            # HypothesisSegments
│   ├── index.ts                 # 再エクスポート
│   ├── run.ts                   # Run, RunListItem, RunDetail, RunInsert
│   ├── search.ts                # SearchItem, CompanyCandidate, SearchResponse
│   └── export.ts                # ExportRow, GoogleDocsExportBody（フェーズ12）
│
├── views/                        # ページ単位のビュー（画面ロジック）
│   ├── HomePage.tsx             # 仮説生成ホーム（入力・履歴・結果・エラー）
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   └── index.ts
│
├── docs/                         # 設計・要件ドキュメント
├── middleware.ts                 # 認証リダイレクト等
├── .env.example
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

- **ルート**: `/` がホーム、`/login`・`/signup` が認証。API は `/api/generate`・`/api/runs`・`/api/runs/[id]`・`/api/search`。フェーズ12: `/api/auth/google`（OAuth 開始）、`/api/auth/google/callback`（コールバック）、`/api/auth/google/status`（連携済みか）、`/api/export/google-sheet`・`/api/export/google-docs`（Google 出力）。環境変数は `GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`・`NEXT_PUBLIC_APP_URL`（`.env.example` 参照）。
- **状態**: ホームは URL 入力 → 生成 → 結果表示。ログイン時は run を Supabase に保存し、履歴から再表示可能。

---

##  commitメッセージ

- feat：新機能追加
- fix：バグ修正
- hotfix：クリティカルなバグ修正
- add：新規（ファイル）機能追加
- update：機能修正（バグではない）
- change：仕様変更
- clean：整理（リファクタリング等）
- disable：無効化（コメントアウト等）
- remove：削除（ファイル）
- upgrade：バージョンアップ
- revert：変更取り消し
- docs：ドキュメント修正（README、コメント等）
- tyle：コードフォーマット修正（インデント、スペース等）
- perf：パフォーマンス改善
- test：テストコード追加・修正
- ci：CI/CD 設定変更（GitHub Actions 等）
- build：ビルド関連変更（依存関係、ビルドツール設定等）
- chore：雑務的変更（ユーザーに直接影響なし）

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| `docs/01-requirements.md` | 要件定義 |
| `docs/02-product-strategy.md` | プロダクト戦略 |
| `docs/03-system.md` | システム定義 |
| `docs/04-implementation-decisions.md` | 実装方針 |
| `docs/05-ui-ux.md` | UI/UX仕様 |
| `docs/06-decision-log.md` | 意思決定ログ |
| `docs/07-external-requirements.md` | 外部要件 |
| `docs/08-implementation-order.md` | 実装順序と確認 |
| `docs/09-app-design.md` | アプリ設計（DB・API・環境変数） |
| `docs/10-supabase-ddl.md` | Supabase DDL（runs / edit_logs） |
| `docs/11-hypothesis-engine-architecture.md` | 仮説生成エンジン 3層設計 |
| `docs/12-url-design-runs.md` | 履歴（run）と URL 設計 |
| `docs/13-requirements-vs-current-app.md` | 要件と既存アプリの照合 |
| `docs/14-roadmap-nextjs-requirements.md` | 機能要件に近づけるロードマップ・ブランチ命名 |
