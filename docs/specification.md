# todorist-v2 確定仕様

この文書は、実装前に確定したv2第一完成版の仕様をまとめたものです。READMEは利用・開発手順を中心とし、本書は実装上の判断基準として使用します。

## 第一完成版

- PostgreSQLへ永続保存するセッション認証
- User、Team、TeamMember、TeamInvitation、Task
- owner/member権限
- チーム招待リンク
- Team CRUDとTask CRUD
- ReactからNestJS APIへの接続
- 無料枠での少人数向け試験公開

コメント、チャット、PR共有、ダッシュボード、カレンダー、ガント、カンバンは実装済みです。通知、ファイル添付は後続段階で実装します。

## 共通

- IDはPostgreSQL UUID
- 作成・更新日時はUTC
- 日付は `YYYY-MM-DD`、DBでは `DATE`
- チームの初期タイムゾーンは `Asia/Tokyo`
- APIは `/api` 配下
- 入力はDTOとDB制約の両方で検証
- 未所属リソースは原則404
- 更新対象はversionによる楽観的ロック

## 認証

- メールは小文字へ正規化し、サービス全体で一意
- パスワードは10～128文字、Argon2idでハッシュ化
- ランダムなセッショントークンをHttpOnly Cookieへ保存
- DBにはトークンのSHA-256ハッシュだけを保存
- セッション有効期限は30日
- LocalStorageには認証情報を保存しない

## チーム

- チーム名は1～30文字
- 前後空白除去、Unicode NFKC、小文字化した値で重複判定
- サービス全体で大文字・小文字を区別せず重複禁止
- 作成者は自動的にowner
- ownerは複数人設定可能
- 最後のownerは降格、削除、退出不可
- チーム削除はownerのみ
- ユーザーが所属チームを0件持つ状態を許可

## 招待

- ownerがメールアドレスを指定して1回限りのリンクを発行
- 有効期限は7日
- DBには招待トークンのハッシュだけを保存
- ログインユーザーのメールが招待先と一致した場合だけ承認可能
- 参加時のroleはmember

## タスク

- titleは1～100文字
- descriptionは任意、最大5,000文字
- startDateとdeadlineは必須で `startDate <= deadline`
- statusは `todo / working / review / fix / done`
- 初期statusはtodo
- assigneeは任意で、同じチームのメンバーだけ
- createdByとteamIdはサーバー側で設定
- 完了以外でdeadlineがチームの今日より前なら期限切れ

## 削除

- Team削除時は配下のMember、Invitation、Taskを削除
- Task削除時は将来のCommentを削除し、PRのtaskIdはnullにする
- User削除時はSessionとMembershipを削除し、担当・作成者参照はnullにする
- 最後のownerであるUserは、その状態を解消するまで削除不可

## Pull Request共有

- GitHub APIは使用せず手動登録する
- titleは1～200文字
- urlはHTTPまたはHTTPSで始まる有効なURL、最大2,048文字
- statusは `draft / review / fixing / merged / closed`
- assigneeと関連Taskは任意で、同じチーム内だけ
- memoは任意、最大5,000文字
- チームメンバーは登録・編集・削除できる
- versionによる楽観的ロックを使用する
- Task削除時は共有を残してtaskIdをnullにする
- Team削除時は共有も削除する
- User削除時はassigneeとcreatedByをnullにする

## API

- 作成: 201
- 更新・取得: 200
- 削除: 204
- 入力不正: 400
- 未認証: 401
- 権限不足: 403
- 不存在・所属外: 404
- 重複・編集競合: 409
- 回数制限: 429
- 一覧は `items` と `nextCursor` を返す
- エラーは `statusCode / code / message / errors / requestId` を返す

## 公開

- React: Cloudflare Pages Free
- NestJS: Render Free
- PostgreSQL: Neon Free
- 無料サブドメインを使用
- 無料枠超過時は自動課金より停止を優先
- DB変更前および週1回を目安にpg_dumpを保存
