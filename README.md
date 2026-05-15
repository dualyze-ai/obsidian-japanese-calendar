# Japanese Calendar

A calendar plugin for Obsidian with full support for Japanese public holidays, wareki (Japanese era), and rokuyo. Click any date to create or open a daily note automatically.

## Features

- Japanese public holidays highlighted in red (official Cabinet Office data)
- Holiday names displayed inside calendar cells
- Wareki (Japanese era: Reiwa, Heisei, Showa) display
- Rokuyo (Taian, Butsumetsu, etc.) display
- Click a date to create or open a daily note
- Automatic holiday callout insertion in daily notes
- Color-coded weekends (Saturday/Sunday)
- Previous and next month dates shown
- Automatically follows Obsidian light/dark theme

---

日本の祝日・振替休日に対応した Obsidian 用カレンダープラグインです。

## 機能

- 日本の祝日・振替休日を赤色で表示（内閣府公式データ）
- 祝日名をカレンダーセル内に表示
- 和暦（令和・平成・昭和）表示対応
- 六曜（大安・仏滅など）表示対応
- 日付クリックでデイリーノートを自動作成・オープン
- デイリーノートに祝日 callout を自動挿入
- 土曜・日曜の色分け表示
- 前月・翌月の日付も表示
- Obsidian のライト / ダークテーマに自動追従

## Installation

### Community plugins (pending review)

Once approved, search for "Japanese Calendar" in **Settings → Community plugins → Browse**.

### Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the latest [Release](https://github.com/kojiman55/obsidian-japanese-calendar/releases), then place them in your vault under `.obsidian/plugins/japanese-calendar/`.

---

## インストール方法

### コミュニティプラグイン経由（申請中）

現在 Obsidian 公式コミュニティプラグインへの掲載を申請中です。審査通過後、以下の手順でインストールできます：

1. Obsidian の設定 → コミュニティプラグイン → 検索
2. "Japanese Calendar" を検索してインストール

### 手動インストール

最新の [Release](https://github.com/kojiman55/obsidian-japanese-calendar/releases) から
`main.js` / `manifest.json` / `styles.css` をダウンロードし、
Vault 内の `.obsidian/plugins/japanese-calendar/` に配置してください。

## 設定

| 設定名 | デフォルト | 説明 |
|--------|-----------|------|
| デイリーノートの保存フォルダ | Daily Notes | ノートの保存先フォルダ |
| ファイル名フォーマット | YYYY-MM-DD | moment.js フォーマット |
| テンプレートファイルのパス | （空欄） | カスタムテンプレートのパス |
| 和暦を表示する | ON | ヘッダーに令和〇年を表示 |
| 祝日名を表示する | ON | セル内に祝日名を表示 |
| 六曜を表示する | OFF | 大安・仏滅などを表示 |
| 週の開始曜日 | 日曜日 | 日曜 or 月曜始まり |
| 祝日を自動挿入する | ON | 祝日のノートに callout を挿入 |
| ステータスバーに祝日数を表示する | ON | 今月の祝日数を表示 |

## テンプレート変数

カスタムテンプレートで使用できるプレースホルダー：

| 変数 | 説明 |
|------|------|
| `{{date}}` | 日付（設定フォーマット） |
| `{{date:YYYY}}` | 年 |
| `{{date:MM}}` | 月 |
| `{{date:DD}}` | 日 |
| `{{holiday}}` | 祝日名（祝日でない場合は空） |
| `{{rokuyo}}` | 六曜 |
| `{{wareki}}` | 和暦（例：令和8年） |

## 技術スタック

- TypeScript
- Obsidian Plugin API
- [@holiday-jp/holiday_jp](https://github.com/holiday-jp/holiday_jp-js) — 日本の祝日データ（内閣府公式）

## ライセンス

MIT
