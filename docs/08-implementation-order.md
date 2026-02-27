# 実装順序と確認

実装前に本ドキュメントで順序と確認項目を揃える。参照: [09-app-design.md](09-app-design.md)（構造・API・DB）、[05-ui-ux.md](05-ui-ux.md)（画面）、[04-implementation-decisions.md](04-implementation-decisions.md)（方針）。

---

## フェーズ一覧

| フェーズ | ブランチ名 | 内容 | 確認の目安 |
|----------|------------|------|------------|
| 0 | `feature/0-env-types-setup` | 環境・型・骨組み | 型とディレクトリが揃い、開発サーバーが起動する |
| 1 | `feature/1-crawl` | クロール（HP取得） | URL からテキストが取得できる |
| 2 | `feature/2-llm-prompts` | LLM・プロンプト（要約・仮説・提案文） | 要約・仮説5段・提案文が Groq で生成できる |
| 3 | `feature/3-api-generate` | API `/api/generate` | 1 リクエストでクロール→要約→仮説→提案文が返る。タイムアウト・エラー形式も実装 |
| 4 | `feature/4-supabase` | DB（Supabase） | マイグレーション・保存・編集 API が動く |
| 5 | `feature/5-ui-skeleton` | UI 骨組み | 1 画面で入力→ローディング→結果表示→エラー表示まで見える |
| 6 | `feature/6-edit-export-copy` | 編集・再生成・エクスポート・コピー | 編集・再生成1回・. txt 出力・コピーができる |
| 7 | `feature/7-integration-errors` | 結合確認・失敗系 | タイムアウト・4xx・空コンテンツ・LLM エラーで正しいメッセージが出る |
| 8 | `feature/8-auth-user-runs` | 認証・ユーザー別保存 | ログインユーザーだけが自分の run を保存・閲覧できる |

### フェーズと Issue タイトル一覧

| フェーズ | ブランチ名 | Issue タイトル |
|----------|------------|----------------|
| 0 | `feature/0-env-types-setup` | 環境・型・ディレクトリ骨組みと開発サーバー起動確認 |
| 1 | `feature/1-crawl` | クロール実装（fetch + cheerio で HP テキスト取得） |
| 2 | `feature/2-llm-prompts` | LLM・プロンプト実装（要約・仮説5段・提案文の Groq 呼び出し） |
| 3 | `feature/3-api-generate` | API `/api/generate` 実装（クロール〜提案文まで・タイムアウト・エラー形式） |
| 4 | `feature/4-supabase` | Supabase 導入（マイグレーション・runs/edit_logs・保存・PATCH API） |
| 5 | `feature/5-ui-skeleton` | UI 骨組み（1画面・入力・ローディング・結果・エラー表示） |
| 6 | `feature/6-edit-export-copy` | 編集・再生成1回・エクスポート・コピー機能 |
| 7 | `feature/7-integration-errors` | 結合確認と失敗系（タイムアウト・4xx・空・LLM エラー時の表示） |
| 8 | `feature/8-auth-user-runs` | 認証・ユーザー別保存（ログインユーザーのみ保存可能） |
| 9 | `feature/9-decision-maker-csv-export` | 代表者名の抽出・表示と単一件 CSV エクスポート |
| 10 | `feature/10-ir-pdf` | IR PDF 取得・テキスト抽出と IR 要約の生成・表示 |
| 11 | `feature/11-company-list-search` | 企業リスト検索 UI と複数企業の仮説生成・CSV 一括出力 |
| 12 | `feature/12-google-sheet-docs-export` | Google スプレッドシート／ドキュメント出力機能（要約・仮説・手紙） |
| 13 | `feature/13-video-google-info` | 動画 URL 抽出と Google 企業情報の補助入力 |

---

## フェーズ 0: 環境・型・骨組み

**ブランチ名**: `feature/0-env-types-setup`  
**イシュータイトル**: 環境・型・ディレクトリ骨組みと開発サーバー起動確認

### 実装するもの

- 環境変数: `.env.local` の雛形（`GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`）。本番は Railway で設定。
- 型: `types/index.ts` に `Run`, `HypothesisSegments`, 生成 API の Request/Response 型を定義する。
- ディレクトリ: `app/api/generate/`, `app/api/runs/`, `components/`, `lib/`, `types/` を [09-app-design.md](09-app-design.md) の通り用意する（中身は空でよい）。
- `app/layout.tsx` / `app/page.tsx`: 最小表示（「HypoFrame」など 1 行でも可）。

### 確認

- [ ] `npm run dev` で開発サーバーが起動する
- [ ] `types/index.ts` をインポートして型エラーが出ない
- [ ] `.env.local` は `.gitignore` に含まれている

---

## フェーズ 1: クロール（HP 取得）

**ブランチ名**: `feature/1-crawl`  
**イシュータイトル**: クロール実装（fetch + cheerio で HP テキスト取得）

### 実装するもの

- `lib/crawl.ts`: `fetch` + `cheerio` で入力 URL の同一サイトからテキストを取得する。同一オリジン内 2〜3 ページまで。User-Agent 明示、robots.txt 尊重（方針のみで実装簡略可）。戻り値はプレーンテキスト（または HTML から抽出した文字列）。

### 確認

- [ ] 有効な企業 HP の URL を渡すと空でないテキストが返る
- [ ] 403/4xx や無効 URL でエラー（または空）となり、例外で落ちない
- [ ] 取得テキストが長すぎる場合は長さ制限をかけてもよい（方針: 質を削りすぎない範囲）

---

## フェーズ 2: LLM・プロンプト（要約・仮説・提案文）

**ブランチ名**: `feature/2-llm-prompts`  
**イシュータイトル**: LLM・プロンプト実装（要約・仮説5段・提案文の Groq 呼び出し）

### 実装するもの

- `lib/groq.ts`: Groq API を呼び出す共通関数（モデル指定・トークン上限など）。
- `lib/prompts.ts`: 以下 3 種のプロンプトを返す関数。
  - 事業要約用（取得テキスト → 要約）
  - 仮説5段用（要約 → 5 段の配列。順序固定。[04-implementation-decisions.md](04-implementation-decisions.md) 第4節の表に従う）
  - 提案文下書き用（要約・仮説 → 提案文 1 本）
- 要約 → 仮説5段 → 提案文の順で Groq を 3 回呼ぶ処理を `lib/` 内でまとめるか、`api/generate` に書く。

### 確認

- [ ] 要約のみ: 取得テキストを渡すと要約が返る
- [ ] 仮説5段: 要約を渡すと長さ 5 の配列が返り、各段が 2〜4 文程度で断定を避けた表現になっている
- [ ] 提案文: 要約と仮説を渡すと 1 本の提案文が返る
- [ ] プロンプトに「情報源は HP のみ」「断定を避ける」を入れている

---

## フェーズ 3: API `/api/generate`

**ブランチ名**: `feature/3-api-generate`  
**イシュータイトル**: API `/api/generate` 実装（クロール〜提案文まで・タイムアウト・エラー形式）

### 実装するもの

- `app/api/generate/route.ts`: POST。Body `{ url: string, companyName?: string }`。
  1. クロール → 要約 → 仮説5段 → 提案文の順で実行。
  2. 目標 60 秒、タイムアウト 90 秒（`AbortController` やラップで実装）。タイムアウト時は 408、body `{ error: "...", code: "TIMEOUT" }`。
  3. 失敗時は [04-implementation-decisions.md](04-implementation-decisions.md) 第5節の文言と code（`CRAWL_FORBIDDEN` / `CRAWL_EMPTY` / `LLM_ERROR`）を返す。HTTP ステータスは [09-app-design.md](09-app-design.md) 4.2 に従う。
  4. 成功時 200、`{ summaryBusiness, hypothesisSegments, letterDraft }`。

### 確認

- [ ] 有効 URL で 200 と要約・仮説5段・提案文が返る
- [ ] 無効 URL / 403 で規定の error と code が返る
- [ ] 空コンテンツで規定の error が返る
- [ ] 90 秒でタイムアウトし 408 と TIMEOUT が返る（テスト用に短いタイムアウトで確認しても可）

---

## フェーズ 4: DB（Supabase）

**ブランチ名**: `feature/4-supabase`  
**イシュータイトル**: Supabase 導入（マイグレーション・runs/edit_logs・保存・PATCH API）

### 実装するもの

- `supabase/migrations/`: `runs` と `edit_logs` の CREATE TABLE（[09-app-design.md](09-app-design.md) 2.2 の通り）。RLS は anon で runs / edit_logs の読み書き許可。
- `lib/supabase.ts`: サーバー用 Supabase クライアント（`SUPABASE_SERVICE_ROLE_KEY` 使用）。
- `POST /api/runs`: Body に run の内容を渡すと `runs` に 1 件挿入し `{ id }` を返す。
- `PATCH /api/runs/[id]`: 仮説5段・提案文の部分更新と、編集差分の `edit_logs` 記録。

### 確認

- [ ] マイグレーションを Supabase に適用し、runs / edit_logs が存在する
- [ ] POST /api/runs でレコードが作成され、id が返る
- [ ] PATCH で更新と edit_logs の 1 件追加ができる

---

## フェーズ 5: UI 骨組み

**ブランチ名**: `feature/5-ui-skeleton`  
**イシュータイトル**: UI 骨組み（1画面・入力・ローディング・結果・エラー表示）

### 実装するもの

- [05-ui-ux.md](05-ui-ux.md) の「画面構成」に合わせてコンポーネントを配置する。
  - ヘッダー（タイトル・短い説明）
  - 入力エリア: 企業URL（必須）、会社名（任意）、生成ボタン
  - ローディング／進捗: 生成中のみ表示。目標 60 秒・タイムアウト 90 秒の説明可。
  - 結果エリア: 事業要約、「仮説である」注意、仮説5段（表示のみでよい）、「提案文は仮説に基づく下書きです」、提案文、再生成は未実装でよい
  - エラー表示: 失敗時のみ。メッセージと再試行の案内
- `app/page.tsx`: 上記を 1 画面で並べ、状態（idle / loading / success / error）に応じて表示を切り替える。生成は `/api/generate` を呼ぶ。

### 確認

- [ ] URL と会社名を入力して「生成」でローディングが出る
- [ ] 成功時に要約・仮説5段・提案文が表示される
- [ ] 失敗時にエラー文言が表示される（タイムアウト・403・空・LLM エラーで規定文言）
- [ ] 1 画面で完結し、遷移はない

---

## フェーズ 6: 編集・再生成・エクスポート・コピー

**ブランチ名**: `feature/6-edit-export-copy`  
**イシュータイトル**: 編集・再生成1回・エクスポート・コピー機能

### 実装するもの

- 仮説5段・提案文を編集可能にする（各段と提案文に input/textarea）。編集内容は state で保持し、PATCH /api/runs/[id] で保存（保存タイミングは実装時に決める）。
- 再生成ボタン: 1 回のみ有効。1 回押したら無効化または非表示とし、「2回目以降は編集のみ」を案内する。
- エクスポート: 要約・仮説5段（ラベル付き）・提案文を [04-implementation-decisions.md](04-implementation-decisions.md) 第8節の形式で 1 テキストにし、`仮説_会社名_YYYYMMDD.txt` でダウンロード。
- コピー: 同内容をクリップボードにコピーするボタン。

### 確認

- [ ] 各段・提案文を編集できる
- [ ] 再生成は 1 回だけでき、2 回目以降は案内が出る
- [ ] エクスポートで .txt がダウンロードされ、構成・ファイル名が仕様どおり
- [ ] コピーでクリップボードに同じ内容が入る

---

## フェーズ 7: 結合確認・失敗系

**ブランチ名**: `feature/7-integration-errors`  
**イシュータイトル**: 結合確認と失敗系（タイムアウト・4xx・空・LLM エラー時の表示）

### 実装するもの

- タイムアウト（90 秒）時の UI: 408 を受け取り「取得できませんでした。URLをご確認のうえ…」を表示。
- 403/4xx: 「このページは取得できませんでした。」
- コンテンツ空: 「十分な情報が取得できませんでした…」
- LLM エラー: 「仮説の生成に失敗しました…」
- 60 秒超〜90 秒未満: 「時間がかかっています。しばらくお待ちください。」などの表示（任意）。
- 生成成功時に POST /api/runs で保存するか、generate 内で保存するか、どちらかに統一する。**採用: クライアントで生成成功後に POST /api/runs を呼ぶ（現状どおり）。**

### 確認

- [ ] 各エラーコードで規定の文言が画面に表示される
- [ ] 再試行（もう一度生成）が可能で、再生成 1 回の枠と整合している
- [ ] 正常系: URL 入力 → 生成 → 結果表示 → 編集 → 保存 → エクスポート／コピーが一通りできる
---

## フェーズ 8: 認証・ユーザー別保存

**ブランチ名**: `feature/8-auth-user-runs`  
**イシュータイトル**: 認証・ユーザー別保存（ログインユーザーのみ保存可能）

### 実装するもの

- 認証・登録機能: Supabase Auth などでメール+パスワード（または Magic Link）ログインを実装し、ヘッダーに「ログイン／ログアウト」UI を追加する。
- DB 拡張: `runs` テーブルに `user_id uuid` カラムを追加し、認証ユーザーの `id` を保存する（既存レコードは null 許容から開始して、必要なら後からマイグレーションで補完）。
- RLS またはアプリ側制御: `/api/runs` / `/api/runs/[id]` は「認証済みの本人の run のみ INSERT/UPDATE/SELECT できる」ようにする（Supabase の Row Level Security か、API 内で `user_id` をチェックする）。
- 保存機能の制御: 未ログインユーザーはこれまでどおり「生成・表示・エクスポート・コピー」は利用できるが、「保存・再生成（DB連携）」はできないようにし、押下時はログインを促す。
- 将来の履歴画面のために、`user_id` でフィルタして「自分の run 一覧」を取得できる API を用意する（一覧 UI 自体は後続フェーズでもよい）。
- **認証基盤**: lib/supabase/client.ts（ブラウザ用 Supabase クライアント）、lib/supabase/server-auth.ts（Cookie からセッション復元・getAuthUserId）、middleware.ts（トークンリフレッシュ）、hooks/useAuth.ts（user / signIn / signUp / signOut）。
- **認証画面（別ページ）**: views/LoginPage.tsx・SignupPage.tsx（ログイン／新規登録の UI・フォーム）、app/(auth)/login/page.tsx・app/(auth)/signup/page.tsx（各ルートで上記を表示）。views/index.ts で barrel export。app/(home)/page.tsx が /。
- **ヘッダー**: components/Header.tsx で未ログイン時は「ログイン」「新規登録」リンク、ログイン時はメール＋「ログアウト」。
- **DB**: supabase/migrations/20250225100000_add_user_id_to_runs.sql で runs.user_id 追加。docs/10-supabase-ddl.md に説明追記。
- **API**: POST /api/runs（認証必須・user_id 付与）、PATCH /api/runs/[id]（本人の run のみ更新可）、GET /api/runs（認証必須・自分の一覧。limit/offset）。
- **トップ・結果エリア**: app/page.tsx でログイン時のみ POST /api/runs 呼び出し・ResultArea に isLoggedIn 渡す。ResultArea で isLoggedIn に応じ保存・再生成の表示を切り替え。
- **環境変数**: .env.example に NEXT_PUBLIC_SUPABASE_ANON_KEY を追加。
- **適用作業**: 上記マイグレーションを Supabase に適用。Auth Dashboard で Email プロバイダーを有効化。

- **履歴サイドバー（途中追加）**: ホーム画面のみに展開式サイドバー（ChatGPT 風）を配置する。
  - **コンポーネント**: `components/HistorySidebar.tsx`。展開/折りたたみトグル、幅アニメーション（例: 300ms）。展開中はコンテンツを一定時間（例: 180ms）遅延させてからフェードインし、幅変化中のスタイル崩れ（縦一列表示など）を防ぐ。
  - **認証済み**: `GET /api/runs?limit=30` で履歴一覧を取得して表示。項目クリックで `onSelectRun(runId)` を呼び出し、ホーム側で run 詳細を取得して結果エリアに復元。サイドバー下部にログアウトボタン。
  - **未認証**: 「登録すると使える機能」の案内カードと、新規登録・ログインへのリンクを表示。
- **run 詳細 API（途中追加）**: `GET /api/runs/[id]` を追加。認証必須・本人の run のみ返却。レスポンスは結果再表示に必要な項目（summaryBusiness, hypothesisSegments, letterDraft, inputUrl, companyName, regeneratedCount, createdAt, updatedAt 等）を含む。型は `types/run.ts` に `RunListItem`（一覧用）・`RunDetail`（詳細用）を定義。
- **ホーム画面レイアウト（途中追加）**: ホームは `Header` の下を `aside（サイドバー）+ main（コンテンツ）」の 2 カラムにし、`views/HomePage.tsx` で `HistorySidebar` を組み込む。履歴クリック時に `GET /api/runs/[id]` で詳細を取得し、既存の結果 state（result, hypothesisSegments, letterDraft, companyName, runId, hasRegeneratedOnce, status）を復元して `ResultArea` を表示。ページ全体は `min-h-screen flex flex-col`、メインを `flex-1`、フッターは `mt-*` なしで下固定（他画面のログイン・新規登録と同様）。
- **ヘッダー・認証画面の UI（途中追加）**: ヘッダーに「ホーム」リンクを追加。ナビゲーションリンク（ホーム・ログイン・新規登録・ログアウト）は下線をホバー時のみ表示し、左から右へ伸びるアニメーション・丸みのある下線。リンク間は縦線で区切る。ログイン・新規登録画面は 2 カラムレイアウト・ヘッダー/フッター統一・フッター下固定・コンテンツ垂直中央寄せを適用。
- **未認証時の案内統一（途中追加）**: `ResultArea` の未ログイン時の文言を「登録すると保存・履歴再表示・再生成が使えます」とし、新規登録・ログインへのリンクを表示（サイドバー案内とトーンを揃える）。

### 確認

- [ ] ログインしているユーザーだけが「保存」「再生成（DB 連携）」ボタンを使える（未ログイン時は非表示またはログイン案内）。
- [ ] `runs.user_id` にログインユーザーの ID が入り、自分以外のユーザーの run を API 経由で取得・更新できない。
- [ ] 既存のフェーズ 0〜7 の機能（生成〜編集〜エクスポート／コピーまで）がログイン有無に関わらず破綻していない。
- [ ] ホーム画面でサイドバーを展開/折りたたみでき、展開時はコンテンツが遅延フェードインしてスタイルが崩れない。
- [ ] 認証済みで履歴一覧が表示され、項目クリックで該当 run の結果がメインエリアに復元される。未認証時はサイドバーに登録・ログイン案内が出る。
- [ ] ホーム・ログイン・新規登録の各画面でフッターが画面下部に固定され、レイアウトが統一されている。

---

## 実装後のチェックリスト（全体）

- [ ] [01-requirements.md](01-requirements.md) の必須機能 7 つがすべて動作する
- [ ] [05-ui-ux.md](05-ui-ux.md) のユーザーフローと画面構成を満たしている
- [ ] [04-implementation-decisions.md](04-implementation-decisions.md) の失敗時表示・再生成1回・エクスポート形式を満たしている
- [ ] 環境変数を外に出し、本番（Railway）で同じ変数名で設定できる

---

## メモ

- 思想体験 UI（思考ガイド・プレースホルダ・「なぜ?」ヒント）は [04-implementation-decisions.md](04-implementation-decisions.md) 第7節のとおり実装時に決める。フェーズ 5〜6 で余裕があれば追加する。
- 確証チェック（仮説5段がすべて非空か）は MVP では未実装でもよい（[04-implementation-decisions.md](04-implementation-decisions.md) 第10節）。
