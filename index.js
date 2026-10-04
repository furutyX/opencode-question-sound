// opencode-question-sound
//
// opencode が「質問（選択肢）」を提示したときに opencode の質問音を鳴らすプラグイン。
// v1 / v2 両対応 (dual form)、Windows 専用（音声再生に Windows PowerShell を使用）。
//
// 背景:
//   opencode デスクトップアプリ(2.0.x)の標準サウンド設定には agent / permissions /
//   errors の 3 種しかなく "question" イベントが存在しない。本プラグインは
//   ツール実行前フックで質問ツールを検知して音を鳴らす。
//
// フック:
//   - v2 (デスクトップ/サーバ): ctx.tool.hook("execute.before", e => ...)
//     e.tool は "opencode.tool.question" 等
//   - v1 (ターミナル 1.18.x): "tool.execute.before" で input.tool を見る
//
// 音源:
//   opencode の @opencode-ai/ui アセット bip-bop-03.mp3（opencode の質問音, MIT）を
//   base64 で同梱。初回に %TEMP%\opencode-question-sound.mp3 へ書き出して再生する。
//
// 反映には opencode の再起動が必要。

import { spawn } from "node:child_process"
import { existsSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const id = "question-sound"

// opencode 質問音 (bip-bop-03.mp3, @opencode-ai/ui, MIT) の base64
const SOUND_B64 = "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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxOoASnyfKexwxakgkST9jaSlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EMToAcNgJRME4eKoIgKi0AC8RVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxNYDwAAB/gAAACAAAD/AAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDE1gPAAAH+AAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="
const SOUND_PATH = join(tmpdir(), "opencode-question-sound.mp3")

function ensureSoundFile() {
  try {
    if (!existsSync(SOUND_PATH)) {
      writeFileSync(SOUND_PATH, Buffer.from(SOUND_B64, "base64"))
    }
    return SOUND_PATH
  } catch {
    return undefined
  }
}

function playQuestionSound() {
  if (process.platform !== "win32") return
  const file = ensureSoundFile()
  if (!file) return
  const escaped = file.replace(/'/g, "''")
  const script =
    "Add-Type -AssemblyName PresentationCore; " +
    "$p = New-Object System.Windows.Media.MediaPlayer; " +
    `$p.Open([uri]'${escaped}'); ` +
    "$p.Play(); Start-Sleep -Milliseconds 1000; $p.Close()"
  try {
    spawn(
      "powershell.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script],
      { detached: true, stdio: "ignore", windowsHide: true },
    ).unref()
  } catch {
    // 音が鳴らなくても opencode 本体の動作は止めない
  }
}

// 質問ツール判定: v1 "question" / v2 "opencode.tool.question"、
// および plan_exit ツールも質問を出すため対象に含める。
function isQuestionTool(tool) {
  if (typeof tool !== "string") return false
  const name = tool.split(/[.:]/).pop()
  return name === "question" || name === "plan_exit"
}

// ---- v1: server() が hooks object を返す ----
async function server() {
  return {
    "tool.execute.before": async (input) => {
      if (isQuestionTool(input?.tool)) playQuestionSound()
    },
  }
}

// ---- v2: setup(ctx) でドメインに hook 登録する ----
async function setup(ctx) {
  await ctx.tool.hook("execute.before", (event) => {
    if (isQuestionTool(event?.tool)) playQuestionSound()
  })
}

// single value export: 1 つの default オブジェクトに id/server/setup を同居。
// v1 は { id, server } を読み、v2 は { id, setup } を読む。
export default { id, server, setup }
