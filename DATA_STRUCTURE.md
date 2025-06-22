# TDR Days - データ構造設計書

## 概要
東京ディズニーリゾート（TDR）の来園記録管理アプリのデータ設計ドキュメントです。将来的なRailsバックエンド同期に対応した設計となっています。

## 1. 基本エンティティ

### 🏰 **Visit（来園記録）**
来園の基本情報を管理する中核エンティティ

```typescript
interface Visit extends BaseModel {
  date: Date;                    // 来園日
  parkType: ParkType;            // LAND/SEA
  passType?: PassType;           // 1DAY/EARLY_EVENING/WEEKNIGHT
  companionIds: string[];        // 同行者IDのリスト
  numberOfPeople?: number;       // 総人数（オプション）
  notes?: string;               // メモ
  weather?: WeatherType;        // 天気（SUNNY/CLOUDY/RAINY/SNOWY）
  startTime?: Date;             // 入園時間
  endTime?: Date;               // 退園時間
  actionCount?: number;         // アクション数（キャッシュ）
  totalPhotoCount?: number;     // 写真総数（キャッシュ）
}
```

**特徴:**
- 来園記録の基本単位
- パスタイプに基づいた滞在時間計算（1日12時間、アーリー6時間、ウィーク4時間）
- 後方互換性のため`passType`はオプション（既存データはONE_DAYとして扱われる）

### 👥 **Companion（同行者）**
来園の同行者情報を管理

```typescript
interface Companion extends BaseModel {
  name: string;           // 名前
  visitIds: string[];     // 参加した来園記録IDのリスト
  avatar?: string;        // アバター画像URL/パス
  notes?: string;         // メモ
}
```

**特徴:**
- 多対多の関係でVisitと関連付け
- 統計情報でよく一緒に行く人を分析可能

### 🎢 **TimelineAction（タイムラインアクション）**
来園中の活動（アトラクション、レストラン、ショーなど）を記録

```typescript
interface TimelineAction extends BaseModel {
  visitId: string;              // 所属する来園記録ID
  category: ActionCategory;     // カテゴリ（アトラクション/レストラン等）
  area: ParkArea;              // エリア
  locationName?: string;        // 施設名
  locationId?: string;          // プリセット施設ID（将来用）
  time: Date;                  // 実施時間
  duration?: number;           // 所要時間（分）
  waitTime?: number;           // 待ち時間（分）
  notes?: string;              // メモ
  photos: Photo[];             // 写真リスト
  
  // カテゴリ別の特殊フィールド
  purchaseAmount?: number;      // 購入金額（ショッピング）
  purchasedItems?: string[];    // 購入アイテム（ショッピング）
  mealType?: MealType;         // 食事タイプ（レストラン）
  performerNames?: string[];    // 出演者（ショー/グリーティング）
  showTime?: string;           // ショー時間
  customTitle?: string;        // カスタムタイトル
  sortOrder?: number;          // 並び順
}
```

**特徴:**
- カテゴリごとに特殊フィールドを持つ柔軟な設計
- 時系列でのタイムライン表示に対応
- 写真添付機能

### 📷 **Photo（写真）**
タイムラインアクションに添付される写真

```typescript
interface Photo {
  id: string;
  uri: string;              // ローカルURI or URL
  thumbnailUri?: string;    // サムネイルURI
  width?: number;           // 幅
  height?: number;          // 高さ
  takenAt?: Date;          // 撮影日時
  caption?: string;         // キャプション
}
```

## 2. 列挙型（Enums）

### 🏞️ **ParkType（パークタイプ）**
```typescript
enum ParkType {
  LAND = 'LAND',    // 東京ディズニーランド
  SEA = 'SEA'       // 東京ディズニーシー
}
```

### 🎫 **PassType（パスタイプ）**
```typescript
enum PassType {
  ONE_DAY = 'ONE_DAY',                    // 1デーパスポート（12時間）
  EARLY_EVENING = 'EARLY_EVENING',       // アーリーイブニング（6時間）
  WEEKNIGHT = 'WEEKNIGHT'                 // ウィークナイト（4時間）
}
```

**平均滞在時間計算:**
- ONE_DAY: 12時間
- EARLY_EVENING: 6時間  
- WEEKNIGHT: 4時間

### 🎯 **ActionCategory（アクションカテゴリ）**
```typescript
enum ActionCategory {
  ATTRACTION = 'ATTRACTION',   // アトラクション
  RESTAURANT = 'RESTAURANT',   // レストラン
  SHOW = 'SHOW',              // ショー
  GREETING = 'GREETING',       // グリーティング
  SHOPPING = 'SHOPPING',       // ショッピング
  CUSTOM = 'CUSTOM'           // カスタム
}
```

### 🗺️ **ParkArea（パークエリア）**

**ディズニーランド（LandArea）**
```typescript
enum LandArea {
  WORLD_BAZAAR = 'ワールドバザール',
  ADVENTURELAND = 'アドベンチャーランド',
  WESTERNLAND = 'ウエスタンランド',
  CRITTER_COUNTRY = 'クリッターカントリー',
  FANTASYLAND = 'ファンタジーランド',
  TOONTOWN = 'トゥーンタウン',
  TOMORROWLAND = 'トゥモローランド'
}
```

**ディズニーシー（SeaArea）**
```typescript
enum SeaArea {
  MEDITERRANEAN_HARBOR = 'メディテレーニアンハーバー',
  AMERICAN_WATERFRONT = 'アメリカンウォーターフロント',
  PORT_DISCOVERY = 'ポートディスカバリー',
  LOST_RIVER_DELTA = 'ロストリバーデルタ',
  ARABIAN_COAST = 'アラビアンコースト',
  MERMAID_LAGOON = 'マーメイドラグーン',
  MYSTERIOUS_ISLAND = 'ミステリアスアイランド',
  FANTASY_SPRINGS = 'ファンタジースプリングス'
}
```

**Union Type**
```typescript
type ParkArea = LandArea | SeaArea;
```

## 3. 分析・統計データ

### 📊 **VisitStats（来園統計）**
```typescript
interface VisitStats {
  totalVisits: number;                    // 総来園回数
  landVisits: number;                     // ランド来園回数
  seaVisits: number;                      // シー来園回数
  averageVisitDuration?: number;          // 平均滞在時間（分）
  favoriteCompanions: Array<{             // よく一緒に行く人
    companion: Companion;
    visitCount: number;
  }>;
  visitsByMonth: Array<{                  // 月別来園回数
    month: string;  // YYYY-MM format
    count: number;
  }>;
  visitsByYear: Array<{                   // 年別来園回数
    year: number;
    count: number;
  }>;
}
```

### 📈 **ActionStats（アクション統計）**
```typescript
interface ActionStats {
  totalActions: number;                           // 総アクション数
  actionsByCategory: Record<ActionCategory, number>; // カテゴリ別集計
  topAttractions: Array<{                         // 人気アトラクション
    locationName: string;
    count: number;
    averageWaitTime?: number;
  }>;
  topRestaurants: Array<{                         // 人気レストラン
    locationName: string;
    count: number;
  }>;
  areaDistribution: Array<{                       // エリア別統計
    area: ParkArea;
    visitCount: number;
    timeSpent?: number; // in minutes
  }>;
  averageActionsPerVisit: number;                 // 1回あたり平均アクション数
  photoCount: number;                             // 総写真数
}
```

### 👤 **CompanionStats（同行者統計）**
```typescript
interface CompanionStats {
  companion: Companion;
  visitCount: number;
  lastVisitDate: Date;
  favoriteAreas: ParkArea[];
  commonActivities: Array<{
    category: ActionCategory;
    count: number;
  }>;
}
```

## 4. フィルタリング・ソート

### 🔍 **VisitFilter（来園記録フィルター）**
```typescript
interface VisitFilter {
  dateRange?: DateRange;      // 期間指定
  parkType?: ParkType;        // パーク指定
  companionIds?: string[];    // 同行者指定
}
```

### 🔍 **ActionFilter（アクションフィルター）**
```typescript
interface ActionFilter {
  visitId?: string;           // 来園記録指定
  category?: ActionCategory;  // カテゴリ指定
  area?: ParkArea;           // エリア指定
  dateRange?: DateRange;     // 期間指定
  locationName?: string;     // 施設名指定
}
```

### 📅 **DateRange（期間）**
```typescript
interface DateRange {
  startDate: Date;
  endDate: Date;
}
```

### 🔄 **SortOptions（ソート）**
```typescript
type SortDirection = 'ASC' | 'DESC';

interface SortOptions<T> {
  field: keyof T;
  direction: SortDirection;
}
```

## 5. データ保存設計

### 🗄️ **StorageKeys（AsyncStorageキー）**
```typescript
const STORAGE_KEYS = {
  VISITS: '@tdr_days:visits',           // 来園記録
  ACTIONS: '@tdr_days:actions',         // タイムラインアクション
  COMPANIONS: '@tdr_days:companions',   // 同行者
  METADATA: '@tdr_days:metadata',       // アプリメタデータ
  MIGRATIONS: '@tdr_days:migrations'    // データマイグレーション
} as const;
```

### ⚡ **BaseModel（基底モデル）**
全エンティティの共通フィールド
```typescript
interface BaseModel {
  id: string;           // UUID
  createdAt: Date;      // 作成日時
  updatedAt: Date;      // 更新日時
  syncedAt?: Date;      // 同期日時（将来用）
  remoteId?: string;    // リモートID（将来用）
}
```

### 🛠️ **ユーティリティ型**
```typescript
// 作成時の入力型（BaseModelフィールドを除外）
export type CreateInput<T extends BaseModel> = Omit<T, keyof BaseModel>;

// 更新時の入力型（id, createdAtを除外してPartial）
export type UpdateInput<T extends BaseModel> = Partial<Omit<T, 'id' | 'createdAt'>>;
```

## 6. エンティティ関係

### 関係図
```
Visit (1) ←→ (N) TimelineAction
Visit (N) ←→ (N) Companion
TimelineAction (1) ←→ (N) Photo
```

### 関係の詳細

**Visit ↔ Companion（多対多）**
- Visit.companionIds: string[] // Companionのidリスト
- Companion.visitIds: string[] // Visitのidリスト

**Visit ↔ TimelineAction（一対多）**
- TimelineAction.visitId: string // 所属するVisitのid

**TimelineAction ↔ Photo（一対多）**
- TimelineAction.photos: Photo[] // 添付写真のリスト

## 7. データフロー

### 基本操作フロー
1. **来園記録作成**
   - Visit作成 → Companionとの関連付け
   - パスタイプに基づく滞在時間設定

2. **タイムライン記録**
   - TimelineAction作成 → Visitへの関連付け
   - カテゴリ別フィールドの設定
   - Photo添付

3. **統計生成**
   - 全データからの集計処理
   - パスタイプ別滞在時間計算
   - エリア・カテゴリ別分析

### キャッシュ戦略
- Visit.actionCount: そのVisitのTimelineAction数
- Visit.totalPhotoCount: そのVisitの全Photo数
- 統計データは都度計算（将来的にはキャッシュ検討）

## 8. 将来拡張対応

### 🔄 **Rails同期対応**
```typescript
// 同期用フィールド
interface BaseModel {
  syncedAt?: Date;      // 最終同期日時
  remoteId?: string;    // サーバー側ID
}

// アプリメタデータ
interface AppMetadata extends BaseModel {
  dataVersion: number;    // データスキーマバージョン
  lastSyncDate?: Date;    // 最終同期日時
  userId?: string;        // ユーザーID（将来用）
  settings?: Record<string, any>; // アプリ設定
}

// マイグレーション管理
interface DataMigration {
  version: number;
  appliedAt: Date;
  description: string;
}
```

### 🎯 **プリセット施設対応**
```typescript
interface PresetLocation {
  id: string;
  name: string;
  nameEn?: string;
  category: ActionCategory;
  parkType: ParkType;
  area: ParkArea;
  isActive: boolean;
  openingDate?: Date;
  closingDate?: Date;
  tags?: string[];
}
```

### 📱 **マルチユーザー対応**
- AppMetadata.userIdでユーザー識別
- Storage keyにユーザーIDを含める設計

### 🌐 **多言語対応**
- エリア名は日本語をenum値として使用
- 表示時に言語に応じて変換
- PresetLocationでnameEn対応

## 9. パフォーマンス考慮事項

### インデックス戦略
- Visit: date, parkType
- TimelineAction: visitId, time, category
- Companion: name

### メモリ管理
- 大量データ時のページング検討
- 画像のサムネイル生成
- 統計データのキャッシュ

### バックアップ・復元
- AsyncStorageの定期バックアップ
- エクスポート・インポート機能
- クラウド同期対応

## 10. データ整合性

### 制約
- Visit.companionIds ⊆ 全Companion.id
- TimelineAction.visitId ∈ 全Visit.id
- Companion.visitIds ⊆ 全Visit.id

### データクリーンアップ
- 孤立したTimelineActionの削除
- 未使用Companionの整理
- 破損データの検出・修復

---

この設計により、来園記録からタイムライン、写真、統計まで一貫した管理が可能で、将来的な機能拡張にも柔軟に対応できる構造となっています。