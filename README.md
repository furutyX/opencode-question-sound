# opencode-question-sound

opencode が **質問（選択肢）を提示したとき** に、opencode の質問音（`bip-bop-03`）を鳴らすプラグインです。

opencode デスクトップアプリ（2.0.x）の標準サウンド設定には `agent` / `permissions` / `errors` の 3 種しかなく、
**`question` イベント用の音が存在しません**。本プラグインはツール実行前フックで質問ツール
（`question` / `plan_exit`）を検知し、opencode 本体と同じ音を再生します。

## 対応

| 項目 | 内容 |
| --- | --- |
| opencode | v1 (1.18.x) / v2 (2.0.x) 両対応（dual form プラグイン） |
| OS | **Windows のみ**（再生に PowerShell + `System.Media.SoundPlayer`(WAV) を使用） |
| フック | v2: `ctx.tool.hook("execute.before")` / v1: `"tool.execute.before"` |
| 音源 | opencode の `@opencode-ai/ui` アセット `bip-bop-03.mp3` を同梱（MIT） |

Windows 以外では `process.platform` 判定により何もしません（no-op）。

## インストール

Git リポジトリ指定でインストールできます。

```sh
opencode plugin add git+https://github.com/furutyX/opencode-question-sound.git
```

または `opencode.jsonc` の `plugins` に直接追加します。

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "git+https://github.com/furutyX/opencode-question-sound.git"
  ]
}
```

インストール後、**opencode を再起動**してください（プラグインは起動時に読み込まれます）。

## 動作

- 質問ツールの実行直前に、同梱音源を `%TEMP%\opencode-question-sound.wav` へ書き出し、
  非表示の PowerShell 子プロセスで `System.Media.SoundPlayer` により再生します。
  - `System.Windows.Media.MediaPlayer` は非対話プロセスで無音になることがあり、
    `spawn` を `detached` にすると子プロセスが実行されないため採用していません。
- 音が鳴らなくても opencode 本体の動作には影響しません。

## 免責

本プラグインは opencode とは無関係の**非公式なコミュニティプラグイン**です
（opencode / anomalyco による承認・提携・サポートはありません）。

## ライセンス

本プラグインのコードは MIT です。

同梱音源 `bip-bop-03`（opencode `@opencode-ai/ui`, `Copyright (c) 2025 opencode`, MIT）の
著作権表示とライセンス全文は [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) に記載しています。
