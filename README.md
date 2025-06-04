# TDR Days 🏰

東京ディズニーリゾートの訪問記録を管理するモバイルアプリケーション

## 概要

TDR Days（ティーディーアール・デイズ）は、東京ディズニーランド（TDL）と東京ディズニーシー（TDS）への訪問を詳細に記録・管理するためのモバイルアプリです。訪問履歴、アトラクション体験、レストラン利用、ショー鑑賞などを時系列で記録し、統計データを可視化することで、パーク体験をより豊かにします。

## 主な機能

### 📅 訪問記録管理
- 訪問日、パーク（ランド/シー）、同行者、天気を記録
- 訪問ごとの開始・終了時刻を管理
- カレンダービューで訪問履歴を一覧表示

### ⏱️ タイムライン機能
- アトラクション、レストラン、ショー、グリーティング、ショッピングを時系列で記録
- 各アクションに写真、待ち時間、メモを追加可能
- エリア別（ワールドバザール、アドベンチャーランドなど）に自動分類
- ドラッグ&ドロップで順序変更可能

### 📸 写真管理
- アクションごとに複数の写真を添付
- 自動サムネイル生成
- フルスクリーンギャラリー表示
- 写真の編集・削除機能

### 👥 同行者管理
- 同行者のプロフィール作成（名前、アバター、メモ）
- 同行者別の訪問履歴を追跡
- よく一緒に行く人の統計表示

### 📊 統計・分析機能
- 訪問回数、パーク別統計
- アトラクション利用頻度ランキング
- 平均待ち時間の分析
- エリア別滞在時間のヒートマップ
- 月別・年別の訪問傾向グラフ
- 同行者別の詳細統計

### 🌍 その他の機能
- 多言語対応（日本語・英語）
- ダークモード対応
- カスタムカラーテーマ
- オフライン動作対応

## 技術スタック

- **フレームワーク**: React Native (0.79.2) + Expo (53.0.9)
- **言語**: TypeScript
- **ナビゲーション**: React Navigation (Bottom Tabs + Drawer + Stack)
- **UIライブラリ**: React Native Paper (Material Design)
- **データ保存**: AsyncStorage
- **グラフ**: React Native Chart Kit
- **アニメーション**: React Native Reanimated
- **画像処理**: Expo Image Picker / Image Manipulator

## セットアップ

### 必要な環境
- Node.js (v18以上推奨)
- npm または yarn
- Expo CLI
- iOS: Xcode (Mac必須)
- Android: Android Studio

### インストール手順

1. リポジトリをクローン
```bash
git clone [repository-url]
cd TDR-days-new
```

2. 依存関係をインストール
```bash
npm install
```

3. 開発サーバーを起動
```bash
npm start
```

4. プラットフォーム別の実行
```bash
# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Web ブラウザ
npm run web
```

## ディレクトリ構造

```
TDR-days-new/
├── src/
│   ├── components/     # 再利用可能なUIコンポーネント
│   │   ├── charts/     # グラフ関連コンポーネント
│   │   └── layouts/    # レイアウトコンポーネント
│   ├── screens/        # 画面コンポーネント
│   ├── navigation/     # ナビゲーション設定
│   ├── contexts/       # React Context（テーマ、言語）
│   ├── hooks/          # カスタムフック
│   ├── services/       # API・ストレージサービス
│   ├── styles/         # グローバルスタイル
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
├── assets/             # 画像・アイコンリソース
├── android/            # Android固有の設定
└── ios/                # iOS固有の設定
```

## 主要な画面

### HomeScreen
- 最近の訪問履歴
- クイックアクセスボタン
- 統計サマリー

### RecordScreen
- 新規訪問の記録作成
- タイムラインの編集
- リアルタイム記録モード

### VisitListScreen
- 訪問履歴の一覧表示
- フィルター・検索機能
- カレンダービュー

### AnalyticsScreen
- 各種統計グラフ
- ランキング表示
- 詳細分析レポート

### ProfileScreen
- ユーザープロフィール編集
- 同行者管理
- アプリ設定

## 開発ガイドライン

### コード規約
- TypeScriptの型定義を必須とする
- コンポーネントは関数コンポーネントで記述
- スタイルはStyleSheet.createまたはdesignStylesを使用
- 新しい画面追加時はnavigationの型定義を更新

### コミット規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: コードスタイルの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの変更
```

### ブランチ戦略
- `main`: 本番リリース用
- `develop`: 開発用メインブランチ
- `feature/*`: 新機能開発
- `fix/*`: バグ修正

## バージョン管理

### バージョン更新

アプリのバージョンは統一管理されており、一つのコマンドで全ファイルを更新できます。

```bash
# バージョンを1.0.6に更新
npm run version:update 1.0.6
```

このコマンドは以下のファイルを自動的に更新します：
- `app.json` - Expoのバージョン情報
- `android/app/build.gradle` - Android用のversionNameとversionCode
- `src/constants/app.ts` - アプリ内で表示されるバージョン情報

### 更新されるファイル一覧

| ファイル | 更新内容 |
|---------|---------|
| `app.json` | `expo.version` |
| `android/app/build.gradle` | `versionName`, `versionCode` |
| `src/constants/app.ts` | `VERSION`, `VERSION_CODE` |
| アプリ内UI | 自動的に新バージョンを表示 |

### バージョン管理の仕組み

1. **単一責任の原則**: `src/constants/app.ts`がすべてのアプリ情報の中心
2. **自動同期**: スクリプトが全ファイルを一括更新
3. **型安全性**: TypeScriptで管理され、コンパイル時にエラーを検出

### リリース手順

1. **バージョン更新**
   ```bash
   npm run version:update 1.0.6
   ```

2. **変更の確認**
   ```bash
   git status
   git diff
   ```

3. **テスト実行**
   ```bash
   npm start
   ```

4. **コミット**
   ```bash
   git add .
   git commit -m "Bump version to 1.0.6"
   ```

5. **ビルド & 公開**
   ```bash
   eas build --platform android
   ```

## ビルド

### 開発ビルド
```bash
expo start --dev-client
```

### プロダクションビルド（EAS Build）
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## トラブルシューティング

### よくある問題

1. **Metro bundlerエラー**
   ```bash
   npx expo start --clear
   ```

2. **依存関係の問題**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS podのエラー**
   ```bash
   cd ios && pod install
   ```

## 今後の機能追加予定

- [ ] クラウド同期機能
- [ ] ソーシャル共有機能
- [ ] ファストパス/DPA記録
- [ ] 混雑予測機能
- [ ] Apple Watch対応

## ライセンス

このプロジェクトは個人利用を目的としています。商用利用については作者にお問い合わせください。

## 作者

Hayato Nakamura

---

東京ディズニーリゾートの思い出を、より豊かに記録し、振り返ることができるアプリを目指しています。