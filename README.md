# Japanese Calendar

A calendar plugin for Obsidian with full support for Japanese public holidays, wareki (Japanese era), rokuyo, and kichijitsu (auspicious/inauspicious days). Click any date to create or open a daily note automatically.

| Light mode | Dark mode |
|---|---|
| ![Light mode](https://raw.githubusercontent.com/dualyze-ai/obsidian-japanese-calendar/main/assets/light-mode.png) | ![Dark mode](https://raw.githubusercontent.com/dualyze-ai/obsidian-japanese-calendar/main/assets/dark-mode.png) |

## Features

- Japanese public holidays highlighted in red (official Cabinet Office data)
- Holiday names displayed inside calendar cells
- Wareki (Japanese era: Reiwa, Heisei, Showa) display
- Rokuyo (Taian, Butsumetsu, etc.) display
- **Kichijitsu display** — 天赦日 (Tenshanichi), 一粒万倍日 (Ichiryū Manbai-nichi), 不成就日 (Fujōju-nichi)
- **Hover tooltip** — hover over any date to see holiday name, rokuyo, and kichijitsu at a glance
- Click a date to create or open a daily note
- Automatic holiday callout insertion in daily notes
- Color-coded weekends (Saturday/Sunday)
- Previous and next month dates shown
- **Light/dark mode toggle** — switch the calendar's appearance with the sun/moon icon, independent of Obsidian's own theme (your choice is remembered)

---

日本の祝日・振替休日に対応した Obsidian 用カレンダープラグインです。

## 機能

- 日本の祝日・振替休日を赤色で表示（内閣府公式データ）
- 祝日名をカレンダーセル内に表示
- 和暦（令和・平成・昭和）表示対応
- 六曜（大安・仏滅など）表示対応
- **吉凶日表示** — 天赦日・一粒万倍日・不成就日をカレンダーに表示
- **ホバーツールチップ** — 日付にマウスを乗せると祝日名・六曜・吉凶日をポップアップ表示
- 日付クリックでデイリーノートを自動作成・オープン
- デイリーノートに祝日 callout を自動挿入
- 土曜・日曜の色分け表示
- 前月・翌月の日付も表示
- **ライト / ダークモード切り替え** — 太陽 / 月アイコンでカレンダーの表示をObsidian本体のテーマとは独立して切り替え可能（選択状態は保存されます）

## Installation

### Community plugins

1. Open **Settings → Community plugins → Browse**
2. Search for "Japanese Calendar"
3. Click **Install**, then **Enable**

### Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the latest [Release](https://github.com/dualyze-ai/obsidian-japanese-calendar/releases), then place them in your vault under `.obsidian/plugins/japanese-calendar/`.

---

## インストール方法

### コミュニティプラグイン経由

1. Obsidian の **設定 → コミュニティプラグイン → 検索**
2. "Japanese Calendar" を検索
3. **インストール** → **有効化**

### 手動インストール

最新の [Release](https://github.com/dualyze-ai/obsidian-japanese-calendar/releases) から
`main.js` / `manifest.json` / `styles.css` をダウンロードし、
Vault 内の `.obsidian/plugins/japanese-calendar/` に配置してください。

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Daily note folder | Daily Notes | Folder where daily notes are saved |
| Filename format | YYYY-MM-DD | Date format (same tokens as Moment.js) |
| Template file path | (empty) | Path to a custom template |
| Show wareki | ON | Show the Japanese era (Reiwa, etc.) in the header |
| Show holiday name | ON | Show holiday names inside cells |
| Show rokuyo | OFF | Show Taian, Butsumetsu, etc. |
| Show kichijitsu | ON | Show Tenshanichi, Ichiryū Manbai-nichi, Fujōju-nichi |
| &nbsp;&nbsp;Tenshanichi | ON | Show Tenshanichi (auspicious day) |
| &nbsp;&nbsp;Ichiryū Manbai-nichi | ON | Show Ichiryū Manbai-nichi (auspicious day) |
| &nbsp;&nbsp;Fujōju-nichi | ON | Show Fujōju-nichi (inauspicious day) |
| Show tooltip on hover | ON | Show holiday, rokuyo, and kichijitsu on hover |
| Week start | Sunday | Sunday or Monday |
| Auto-insert holiday callout | ON | Insert a callout into the holiday's daily note |
| Show holiday count in status bar | ON | Show this month's holiday count |

> **Tips**
> - **Filename format**: the extension (`.md`) is appended automatically — do not include it in the format.

## About Kichijitsu

| Type | Description | Cycle |
|---|---|---|
| Tenshanichi | 5–6 times a year. The most auspicious day, on which all sins are said to be forgiven | Sexagenary (60-day) cycle × season |
| Ichiryū Manbai-nichi | A few times a month. An auspicious day said to make small things grow into great ones | Lunar month × day's earthly branch |
| Fujōju-nichi | A few times a month. An inauspicious day on which nothing is said to succeed | Lunar month × day's earthly branch |

## Template Variables

Placeholders available in custom templates:

| Variable | Description |
|---|---|
| `{{date}}` | Date (in the configured format) |
| `{{date:YYYY}}` | Year |
| `{{date:MM}}` | Month |
| `{{date:DD}}` | Day |
| `{{holiday}}` | Holiday name (empty if not a holiday) |
| `{{rokuyo}}` | Rokuyo |
| `{{wareki}}` | Japanese era (e.g. Reiwa 8) |

## Tech Stack

- TypeScript
- Obsidian Plugin API
- [@holiday-jp/holiday_jp](https://github.com/holiday-jp/holiday_jp-js) — Japanese holiday data (official Cabinet Office data)

## Changelog

### v1.1.2
- Added light/dark mode screenshots to the README
- Added English sections for Settings, Kichijitsu, Template Variables, Tech Stack, and Changelog

### v1.1.1
- Replaced the internal date library `moment` with `dayjs` (same format tokens, no impact on your settings)
- Tooltip show/hide and positioning now use `setCssStyles`

### v1.1.0
- **Light/dark mode toggle** — switch the calendar's appearance with the sun/moon icon, independent of Obsidian's own theme
- Fixed daily note creation failing when the filename format includes date-based subfolders (e.g. `YYYY/MM/YYYY-MM-DD`)
- README: added a tip about the filename format's extension

### v1.0.12
- **Kichijitsu display** — show Tenshanichi, Ichiryū Manbai-nichi, and Fujōju-nichi on the calendar (toggle each independently)
- **Hover tooltip** — hover over a date to see holiday, rokuyo, and kichijitsu at a glance
- Changed author to DualyzeAI, authorUrl to dualyzeai.com

### v1.0.9
- Fixed calendar cell height shifting when a holiday name wraps to a second line

### v1.0.8
- Initial community plugin release

---

## 設定

| 設定名 | デフォルト | 説明 |
|--------|-----------|------|
| デイリーノートの保存フォルダ | Daily Notes | ノートの保存先フォルダ |
| ファイル名フォーマット | YYYY-MM-DD | moment.js フォーマット |
| テンプレートファイルのパス | （空欄） | カスタムテンプレートのパス |
| 和暦を表示する | ON | ヘッダーに令和〇年を表示 |
| 祝日名を表示する | ON | セル内に祝日名を表示 |
| 六曜を表示する | OFF | 大安・仏滅などを表示 |
| 吉凶日を表示する | ON | 天赦日・一粒万倍日・不成就日を表示 |
| 　天赦日 | ON | 天赦日の表示（吉日） |
| 　一粒万倍日 | ON | 一粒万倍日の表示（吉日） |
| 　不成就日 | ON | 不成就日の表示（凶日） |
| ホバーで詳細を表示する | ON | マウスオーバーで祝日・六曜・吉凶日をポップアップ |
| 週の開始曜日 | 日曜日 | 日曜 or 月曜始まり |
| 祝日を自動挿入する | ON | 祝日のノートに callout を挿入 |
| ステータスバーに祝日数を表示する | ON | 今月の祝日数を表示 |

> **Tips**
> - **ファイル名フォーマット**: 拡張子（`.md`）は自動的に付与されるため、フォーマットに含める必要はありません。

## 吉凶日について

| 種類 | 説明 | 周期 |
|------|------|------|
| 天赦日 | 年に5〜6回。すべての罪が許される最上の大吉日 | 干支60日サイクル×季節 |
| 一粒万倍日 | 月に数回。小さな物事が大きく育つとされる吉日 | 旧暦月×日の地支 |
| 不成就日 | 月に数回。何事も成就しないとされる凶日 | 旧暦月×日の地支 |

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

## Changelog

### v1.1.2
- READMEにライト/ダークモードのスクリーンショットを追加
- README: Settings/Kichijitsu/Template Variables/Tech Stack/Changelogの英語版セクションを追加

### v1.1.1
- 内部の日付処理ライブラリを `moment` から `dayjs` に置き換え（フォーマットトークンは同一のため設定への影響なし）
- ツールチップの表示・位置指定を `setCssStyles` を使う形に修正

### v1.1.0
- **ライト / ダークモード切り替え** — 太陽 / 月アイコンでカレンダーの表示をObsidian本体のテーマとは独立して切り替え可能（選択状態を保存）
- デイリーノートのファイル名フォーマットに日付ベースの中間ディレクトリ（例: `YYYY/MM/YYYY-MM-DD`）が含まれる場合にノート作成が失敗する不具合を修正
- README: ファイル名フォーマットの拡張子に関するTipsを追記

### v1.0.12
- **吉凶日表示** — 天赦日・一粒万倍日・不成就日をカレンダーに表示（種類別ON/OFF対応）
- **ホバーツールチップ** — 日付にマウスを乗せると祝日・六曜・吉凶日をポップアップ表示
- author を DualyzeAI、authorUrl を dualyzeai.com に変更

### v1.0.9
- カレンダーのセル高さが祝日名の折り返しでずれる問題を修正

### v1.0.8
- 初回コミュニティプラグイン公開

---

## ライセンス

MIT
