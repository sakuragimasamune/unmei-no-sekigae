# 変更履歴

このプロジェクトの主要な変更を記録します。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、
バージョン管理は [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [2.0.0] - 2026-04

GitHub移行に伴う大規模リファクタリング。機能はそのままに保ちつつ、コード品質と演出を全面的に強化。

### 追加
- **Web Audio APIによる効果音システム** (`sound.js`) - 14種類の効果音を合成、外部音源ファイル不要
- **サウンド設定モーダル** - 効果音のON/OFF・音量調整
- **ラストワンチャレンジのカウントダウン演出** - 3-2-1-GO!! の派手な導入
- **地獄シャッフル後の余韻演出** - 「運命が、変わってしまった……」モノローグ画面
- **ドラッグ&ドロップ時の性別制限チェック** - 男子席に女子を入れられないように
- **レスポンシブ対応** - 1100px以下、800px以下で座席サイズが自動縮小
- **CSS変数によるデザイントークン** - 色とサイズを `:root` で一元管理
- **ボタングループのdata-group属性化** - HTMLとCSSが連動

### 修正
- **8列対応時の座席はみ出し** - `--seat-min-width: 100px` に縮小、`--classroom-max-width: 1300px` に拡大
- **印刷プレビューの崩れ** - `transform: scale(0.5)` の占有スペース問題をwrapper方式で解決
- **印刷プレビューモーダルのCSS構文エラー** - 宙ぶらりんの`min-height`と余分な閉じ括弧を除去
- **「保存して新規開始」での7×7配列バグ** - `createEmptyAssignments()` を使用して8列対応
- **シャッフル時の8列目消失バグ** - `Array(7).fill(...Array(7))` を `ROWS×COLS` に修正
- **ラストワンチャレンジの座席検索範囲** - `for col < 7` を `for col < COLS` に修正
- **`@keyframes reunionHeartbeat` の二重定義** - 後発の上書きを除去
- **`updateSeatAppearance` の二重ロジック** - 「割り当て済み優先 → 未割り当てなら性別表示」に整理
- **`DOMContentLoaded` リスナーの重複登録** - 2箇所あった`roster-save`/`roster-btn`リスナーを1つに統合

### 変更
- **`ROWS` / `COLS` 定数化** - グリッドサイズのハードコードを排除
- **ボタン生成のHTML一元化** - `print.js` / `script.js` で動的生成していたボタンを全てHTMLに移動
- **`button-layout.js` の削除** - HTMLの一元化に伴いMutationObserverによるレイアウト調整が不要に
- **運命の再会のテンポ調整** - 4秒/3秒待ち → 3秒/2秒に短縮
- **運命の糸（fate-line）の視覚強化** - 一瞬出るだけだった細い線を、幅80%・厚さ6pxの目立つ線に
- **印刷プレビューの説明文** - 「※プレビューが崩れていますが」の言い訳を削除
- **`styles.css` の構造化** - 9セクションに分割、コメントで明示

### コード品質
- `script.js`: 1696行 → 1243行（**約27%削減**）
- ヘルパー関数 `createEmptySeats()`, `createEmptyAssignments()`, `migrateSeatRow()`, `migrateAssignmentRow()`, `isGenderMatch()` を追加
- スクリプト読み込み順を整理: `sound.js → fortune.js → slot.js → print.js → script.js`

## [1.x] - リファクタ前

8列対応、運命の再会・ラストワンチャレンジ・地獄のシャッフル・席替え占い・男女席指定・印刷機能などを段階的に実装した時期。
