# todorist-v2

ゲーム制作サークル向けの、チーム作業管理Webアプリです。

プログラム、デザイン、サウンド、シナリオ、テスト、修正、レビューなど、ゲーム制作で発生する作業をチーム単位で管理します。将来的にはタスク管理に加えて、ダッシュボード、カレンダー、ガントチャート、カンバン、コメント、チームチャット、Pull Request共有までを1つのアプリへ統合します。

v1はHTML、CSS、JavaScript、LocalStorageで作成されています。v2ではReact、NestJS、PostgreSQLを使用し、複数ユーザー・複数端末から利用できるWebサービスを目指します。

## 現在の状態

最終更新: 2026-08-05

第一完成版の主要機能をローカル環境へ実装済みです。無料枠を利用した外部公開だけは、公開先アカウントを設定する段階まで保留しています。

| 項目 | 状態 |
|---|---|
| React + TypeScript + Vite | 認証・チーム・タスク画面を実装済み |
| NestJS + TypeScript | 認証・Team・Task APIを実装済み |
| PostgreSQL Docker Compose | 導入済み・起動確認済み |
| Prisma | 導入済み・初期マイグレーション適用済み |
| ユーザー登録・ログイン | 実装済み |
| Team CRUD・メンバー管理 | 実装済み |
| Task CRUD・検索・フィルター・並び替え | 実装済み |
| ダッシュボード・カレンダー・一覧・ガント・ボード | 実装済み |
| タスクコメント | 実装済み |
| チームチャット | 実装済み |
| Pull Request共有 | 実装済み（手動登録） |
| ReactとNestJSのAPI接続 | 実装済み |
| 外部公開 | 未実施 |

フロントエンドとバックエンドのLint・ビルド、単体テスト、2ユーザーによるE2Eテストが成功しています。PostgreSQL 16のコンテナもヘルスチェックとSQL接続を確認済みです。

## 第一完成目標

ローカル環境では、以下を実際に操作できる状態です。

- ユーザー登録、ログイン、ログアウト、ログイン状態維持
- チーム作成、一覧、選択、名前変更、削除
- チーム招待、参加、退出、メンバー・owner管理
- チーム別タスク一覧
- タスク追加、詳細、編集、削除、状態変更
- チームメンバーからの担当者選択
- PostgreSQLへの永続保存
- 複数ユーザー間のデータ共有
- 権限・入力値・同時編集の検証
- 基本的なレスポンシブUI
- 無料枠を利用した試験公開

ダッシュボード、カレンダー、ガントチャート、カンバン、タスクコメント、チームチャット、Pull Request共有まで実装済みです。通知、ファイル添付、GitHub API連携は今後追加します。

## 使用技術

### フロントエンド

- React
- TypeScript
- Vite
- Browser History APIによる小規模ルーティング
- TanStack Query

### バックエンド

- Node.js
- NestJS
- TypeScript
- Prisma 7
- class-validator
- PostgreSQLセッション認証

### データベース・開発環境

- PostgreSQL 16
- Docker Desktop
- Docker Compose
- Git
- GitHub

## システム構成

```text
利用者
  ↓ HTTPS / HTTP
React（5173）
  ↓ /api
NestJS（3000）
  ↓ Prisma
PostgreSQL（5432）
```

ReactからPostgreSQLへ直接接続しません。データの取得・検証・権限確認・保存は、すべてNestJS APIを経由します。

## ディレクトリ構成

```text
todorist-v2/
├── frontend/          React + TypeScript + Vite
├── backend/           NestJS + TypeScript
├── compose.yaml       開発用PostgreSQL
├── render.yaml        Render試験公開設定
├── package.json       公開用ビルド・起動コマンド
├── docs/              確定仕様書
└── README.md
```

バックエンドは機能単位で分割しています。

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── src/
    ├── auth/
    ├── teams/
    ├── tasks/
    ├── comments/
    ├── chat/
    ├── pull-requests/
    ├── prisma/
    ├── config/
    └── common/
```

フロントエンドも機能単位で分割しています。

```text
frontend/src/
├── api/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── teams/
│   └── tasks/
├── hooks/
├── styles/
└── types/
```

## 必要な環境

- Windows 11
- Node.js 22以上
- npm 10以上
- Docker Desktop
- Docker Compose

現在の確認環境ではNode.js 24、npm 11、Docker Engine 29、Docker Compose v5を使用しています。

## 初回セットアップ

### 1. 依存パッケージのインストール

```powershell
cd D:\project\todorist-v2\frontend
npm install

cd ..\backend
npm install
```

PowerShellの実行ポリシーにより `npm.ps1` が拒否される場合は、設定を変更せず `npm.cmd` を使用できます。

```powershell
npm.cmd install
```

### 2. 環境変数ファイルの作成

```powershell
Copy-Item D:\project\todorist-v2\frontend\.env.example D:\project\todorist-v2\frontend\.env
Copy-Item D:\project\todorist-v2\backend\.env.example D:\project\todorist-v2\backend\.env
```

`.env` はGitへ登録しません。秘密情報や本番用接続情報を `.env.example` に記載しないでください。

現在の開発用設定例:

```dotenv
# frontend/.env
VITE_API_BASE_URL=/api
```

```dotenv
# backend/.env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todorist_v2
```

認証実装時に、フロントURLとセッション用秘密値を追加します。

```dotenv
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=十分に長いランダム値
```

## PostgreSQL

### 起動

Docker Desktopを起動してから、プロジェクトルートで実行します。

```powershell
cd D:\project\todorist-v2
docker compose up -d --wait
```

### 状態確認

```powershell
docker compose ps
```

正常な場合、PostgreSQLコンテナは `healthy` と表示されます。

### SQL接続確認

```powershell
docker compose exec postgres psql -U postgres -d todorist_v2
```

接続情報:

| 項目 | 開発用の値 |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `todorist_v2` |
| User | `postgres` |
| Password | `postgres` |

この認証情報はローカル開発専用です。本番環境では使用しません。

### 停止

```powershell
docker compose stop
```

### 再開

```powershell
docker compose start
```

### コンテナを削除

```powershell
docker compose down
```

`docker compose down` だけでは名前付きボリュームのDBデータは残ります。`--volumes` を付けるとDBデータも削除されるため、必要なデータがある状態では実行しないでください。

## Prisma

Prisma Clientはスキーマ変更後に生成します。

```powershell
cd D:\project\todorist-v2\backend
npm.cmd run prisma:generate
```

開発DBへ新しいマイグレーションを作成・適用します。

```powershell
npm.cmd run prisma:migrate -- --name change_name
```

本番・公開環境では既存マイグレーションだけを適用します。

```powershell
npm.cmd run prisma:deploy
```

DBの状態をGUIで確認する場合:

```powershell
npm.cmd run prisma:studio
```

主要ファイル:

```text
backend/prisma.config.ts
backend/prisma/schema.prisma
backend/prisma/migrations/20260803071500_init/migration.sql
```

Prisma 7ではPostgreSQL接続に `@prisma/adapter-pg` を使用しています。

## 開発サーバー

フロントエンドとバックエンドは別々のターミナルで起動します。

### フロントエンド

```powershell
cd D:\project\todorist-v2\frontend
npm.cmd run dev
```

既定URL:

```text
http://localhost:5173
```

### バックエンド

```powershell
cd D:\project\todorist-v2\backend
npm.cmd run start:dev
```

既定URL:

```text
http://localhost:3000
```

ヘルスチェックは次のURLです。

```text
http://localhost:3000/api/health
```

正常時は `{ "status": "ok" }` を返します。

## ビルド・テスト

### フロントエンド

```powershell
cd D:\project\todorist-v2\frontend
npm.cmd run lint
npm.cmd run build
```

### バックエンド

```powershell
cd D:\project\todorist-v2\backend
npm.cmd run build
npm.cmd test -- --runInBand
npm.cmd run test:e2e -- --runInBand
```

## 少人数向け無料試験公開

試験公開では、ReactとNestJSを1つのRender Web Serviceから同一URLで配信し、PostgreSQLだけをNeonへ置きます。

```text
利用者
  ↓ HTTPS
Render Web Service
  ├── React SPA
  └── NestJS /api
        ↓ TLS
      Neon PostgreSQL
```

同一URLにまとめることで、ログインCookieを別ドメインへ送る構成を避けます。開発時は従来どおりVite 5173とNestJS 3000を別々に起動できます。

### Renderが使用するコマンド

リポジトリ直下で次のスクリプトを使用します。

```powershell
npm.cmd run render:build
npm.cmd run render:start
```

- `render:build`: frontend・backendの依存関係をクリーンインストールし、Prisma Client、React、NestJSをビルド
- `render:start`: 適用待ちマイグレーションを実行してからNestJSを本番起動
- NestJSは本番環境でReactの `frontend/dist` を配信
- `/api/*` はSPAへフォールバックせず、NestJS APIとして処理
- `/login` などのReact内ルートは直接アクセスしても `index.html` を返す

### Render環境変数

`render.yaml` で基本設定を定義しています。RenderでBlueprintを作成するとき、次の値だけは外部へ公開せず設定します。

| 変数 | 設定 |
|---|---|
| `DATABASE_URL` | Neonが発行するPostgreSQL接続文字列 |
| `SESSION_SECRET` | Renderが自動生成 |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `same-origin` |

`.env` はGitへ追加しません。NeonやRenderの接続文字列、パスワード、セッション秘密鍵をREADMEやソースコードへ書かないでください。

### 初回公開の順序

1. このフォルダーをGitリポジトリにする
2. GitHubに非公開リポジトリを作成してpushする
3. Neon FreeでPostgreSQLプロジェクトを作成する
4. RenderでGitHubリポジトリの `render.yaml` を使ってBlueprintを作成する
5. Renderの `DATABASE_URL` にNeon接続文字列を設定する
6. 初回デプロイとPrismaマイグレーションの成功を確認する
7. 登録、ログイン、チーム招待、タスク、コメント、チャット、PR共有を確認する
8. 問題がなければ2～5人へURLを共有する

Render Free Web Serviceは無通信時に停止するため、最初のアクセスが遅くなる場合があります。試験公開中は重要データを定期的にエクスポートし、一般公開や本運用へ移る前に有料バックアップも検討します。

機能実装後は、認証、権限、Team CRUD、招待、Task CRUD、削除連動、入力検証、同時編集を自動テストへ追加します。

## 確定済みの基本仕様

### ID

主要データのIDはPostgreSQLのUUIDで統一します。Reactでは数値へ変換せず、文字列として扱います。

### 日付・日時

- `startDate` と `deadline` はPostgreSQLの `DATE`
- API形式は `YYYY-MM-DD`
- `createdAt` と `updatedAt` はUTC
- 画面表示と期限判定はチームのタイムゾーンを使用
- チームの初期タイムゾーンは `Asia/Tokyo`
- `startDate <= deadline` を必須とする

### タスク状態

| 保存値 | 表示名 |
|---|---|
| `todo` | 未着手 |
| `working` | 作業中 |
| `review` | 確認中 |
| `fix` | 修正中 |
| `done` | 完了 |

初期値は `todo` です。DB、NestJS、Reactで同じ値を使用し、日本語名はReact側で表示します。

### 期限切れ

チームの現在日を基準に、次を満たすタスクを期限切れとします。

```text
deadline < today かつ status != done
```

締切日の当日は期限切れに含めません。完了済みタスクも期限切れに含めません。

### 認証

- メールアドレスとパスワードによるログイン
- Argon2idによるパスワードハッシュ
- PostgreSQLへセッションのハッシュを保存
- ブラウザにはHttpOnly Cookieを設定
- 認証情報をLocalStorageへ保存しない
- セッション有効期限は30日

### チーム権限

最初は `owner` と `member` の2種類です。

- チーム作成者は自動的にownerになる
- ownerは複数人設定可能
- 最後のownerは降格、削除、退出できない
- ownerだけがチーム名、チーム削除、メンバー、権限、招待を管理できる
- ownerとmemberはチーム内のタスクを作成・編集・削除できる
- 権限判定は必ずNestJS側で行う

### チーム名

- 必須、1～30文字
- 前後の空白を削除
- 空白だけ、改行、制御文字は禁止
- Unicode正規化と小文字化を行う
- サービス全体で大文字・小文字を区別せず重複禁止

### チーム招待

- ownerが招待先メールアドレスを指定
- 1回限りの招待リンクを発行
- ownerがリンクを手動共有
- 有効期限は7日
- 招待トークンのハッシュだけをDBへ保存
- 招待先とログインユーザーのメールアドレスが一致した場合だけ参加可能
- 初期権限はmember

### タスク

主な項目:

```text
id
teamId
title
description
assigneeId
createdById
startDate
deadline
status
version
createdAt
updatedAt
```

- タイトルは必須、1～100文字
- 詳細は任意、最大5,000文字
- 担当者は同じチームのメンバーだけ
- 未割り当てを許可
- `teamId` と `createdById` はサーバー側で設定
- `version` により複数人の同時編集を検出

### 削除

- Team削除時はTeamMember、Task、Comment、Chat、PR共有を削除
- Task削除時はCommentを削除
- Task削除時、PR共有は残して `taskId = null`
- User削除時、担当タスクは未割り当てにする
- User削除時、共同作業の投稿は匿名化して残す
- Userが最後のownerである間はアカウントを削除できない

### API

- APIプレフィックスは `/api`
- 未認証は `401`
- 権限不足は `403`
- 所属外または存在を公開しないデータは原則 `404`
- 入力不正は `400`
- 重複と同時編集は `409`
- 回数制限超過は `429`
- 削除成功は `204`
- リクエスト本文に不要な項目があれば拒否
- `teamId` や投稿者IDをブラウザの入力から信用しない

## 実装済みAPI

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Teams

```text
GET    /api/teams
POST   /api/teams
GET    /api/teams/:teamId
PATCH  /api/teams/:teamId
DELETE /api/teams/:teamId
```

### Members and invitations

```text
GET    /api/teams/:teamId/members
PATCH  /api/teams/:teamId/members/:memberId
DELETE /api/teams/:teamId/members/:memberId
POST   /api/teams/:teamId/leave
GET    /api/teams/:teamId/invitations
POST   /api/teams/:teamId/invitations
DELETE /api/teams/:teamId/invitations/:invitationId
POST   /api/invitations/:token/accept
```

### Tasks

```text
GET    /api/teams/:teamId/tasks
POST   /api/teams/:teamId/tasks
GET    /api/tasks/:taskId
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId
```

### Task Comments

```text
GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
DELETE /api/comments/:commentId
```

コメントはチームメンバーだけが閲覧・投稿でき、削除できるのは投稿者本人だけです。タスク削除時は関連コメントも連動削除されます。

### Team Chat

```text
GET    /api/teams/:teamId/messages
POST   /api/teams/:teamId/messages
DELETE /api/messages/:messageId
```

チャットはチームメンバーだけが閲覧・投稿でき、削除できるのは投稿者本人だけです。チーム削除時は関連メッセージも連動削除されます。現在はAPI取得型で、WebSocketによるリアルタイム更新は将来対応です。

### Pull Request Shares

```text
GET    /api/teams/:teamId/pull-requests
POST   /api/teams/:teamId/pull-requests
PATCH  /api/pull-requests/:pullRequestId
DELETE /api/pull-requests/:pullRequestId
```

GitHub APIは使用せず、タイトル、HTTP/HTTPS URL、担当者、状態、関連タスク、メモを手動登録します。状態は `draft / review / fixing / merged / closed` です。チームメンバーは登録・編集・削除でき、Task削除時は共有を残して `taskId = null` にします。

## 開発ルール

- v1とv2を混在させない
- v1のLocalStorageデータを自動移行しない
- ReactからDBへ直接接続しない
- Controllerへ業務処理を詰め込まない
- Serviceへ処理を分離する
- DTOとDB制約の両方で入力を検証する
- 認証済みでも権限とチーム所属を毎回確認する
- フロントから送られたユーザーIDやteamIdを無条件に信用しない
- エラーを握りつぶさない
- 内部エラー、SQL、スタックトレースを本番レスポンスへ含めない
- パスワード、Cookie、トークンをログへ記録しない
- `.env`、DBバックアップ、秘密鍵をGitへ登録しない
- 変更後にビルド、テスト、マイグレーションを確認する
- READMEと設計書を実装状況に合わせて更新する

## 無料での試験公開方針

少人数での試験公開は月額0円を目標にします。

| 対象 | 予定サービス |
|---|---|
| React | Cloudflare Pages Free |
| NestJS | Render Free Web Service |
| PostgreSQL | Neon Free |
| URL | 各サービスの無料サブドメイン |
| HTTPS | 各サービスの自動証明書 |

無料公開では次の制限を許容します。

- APIが無通信時に停止する
- 最初のアクセスに時間がかかる場合がある
- 無料枠を超えた場合は課金よりサービス停止を優先する
- 無停止運用やSLAを保証しない
- DB変更前と週1回を目安に手動バックアップする

メール送信、独自ドメイン、ファイル添付は最初の公開範囲に含めません。

## ロードマップ

### 第1段階

- [x] PrismaとDB接続
- [x] User・Session
- [x] 認証
- [x] Team・TeamMember・Invitation
- [x] Task
- [x] Reactの認証・チーム・タスク画面
- [x] Lint・ビルド・単体テスト・E2Eテスト
- [ ] 無料枠を利用した外部試験公開

### 第2段階

- [x] 検索（課題名・詳細・担当者）
- [x] フィルター（状態・担当者・期限）
- [x] 並び替え（締切日・開始日・タイトル・担当者・状態）
- [x] ダッシュボード
- [x] 月間カレンダー
- [x] カンバンボード
- [x] 月間ガントチャート

### 第3段階

- [x] タスクコメント
- [x] チームチャット
- [x] Pull Request共有

### 将来

- WebSocketによるリアルタイム更新
- 通知
- GitHub API連携
- パスワード再設定
- メール認証
- 履歴
- ファイル添付
- バックアップ自動化
- 独自ドメイン

## トラブルシューティング

### `docker` コマンドが見つからない

Docker Desktopが起動していても、インストール直後のターミナルにはPATHが反映されていない場合があります。Docker Desktopを起動し、PowerShellやCodexを再起動してから確認してください。

```powershell
docker version
docker compose version
```

### PostgreSQLが起動しない

5432番ポートが別のPostgreSQLで使用されていないか確認します。

```powershell
docker compose ps
docker compose logs postgres
```

### `npm.ps1` を実行できない

PowerShellの実行ポリシーを変更せず、`npm.cmd` を使用します。

```powershell
npm.cmd run dev
```

### DBを初期化したい

ボリューム削除は保存データを完全に消します。必要なデータがないことを確認した場合だけ実行してください。

```powershell
docker compose down --volumes
docker compose up -d --wait
```

## v1との関係

v1は完成版として維持し、大きな新機能を追加しません。v2は独立したプロジェクトとDBを使用します。

- v1のLocalStorageを削除しない
- v1からv2への自動移行を行わない
- 必要なデータは将来、専用のエクスポート・インポート機能を検討する
- v1では重大な不具合修正とREADME修正だけを行う

## ライセンス

現時点ではライセンスを未決定です。外部公開や第三者への配布前に決定します。
