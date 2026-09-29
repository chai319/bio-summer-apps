# フエルッチ｜クボカワダイズ

最終収量一定の法則を約25分で学ぶ、iPad向けの静的Web教材です。ダイズを119日間育て、個体群密度と収量の関係を植物の姿・数値・対数グラフで結びつけます。

## 教材の流れ

1. 119日目の収量を予想する。
2. 10・50・100・500本/m²の畑へ自由に種をまく。
3. 12・21・31・45・84・119日目で、畑を直接触る水やり・追肥・声かけ・観察・害虫対策・収穫ゲームを行う。
4. 収穫時の植物を見ながら、2つの対数グラフへ8点を記入する。
5. 最終収量一定の法則を一文でまとめる。

## ローカル確認

プロジェクト直下で次を実行します。

```sh
python3 -m http.server 8765 --directory dist
```

ブラウザで `http://127.0.0.1:8765/` を開きます。

Antigravityへの引き継ぎ事項は `ANTIGRAVITY_HANDOFF.md` にまとめています。

## GitHub Pagesで公開

外部ライブラリもビルド工程もありません。`main` ブランチへのpushで `.github/workflows/pages.yml` が `dist/` を公開します。

GitHub側では、リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。

## 主なファイル

- `dist/index.html`: 教材本体（HTML・CSS・JavaScript）
- `dist/assets/kubokawa-soy-sprites.png`: ダイズの成長・世話・混雑状態をまとめた4×3スプライト
- `dist/.nojekyll`: GitHub Pages用
- `.github/workflows/pages.yml`: GitHub Pages公開ワークフロー
- `ANTIGRAVITY_HANDOFF.md`: 設計・数値・引き継ぎ記録

育成中、右側は説明と進捗だけです。実際の操作は、左の畑でジョーロをドラッグ、肥料を連射、自由文を弾幕送信、葉をタップ、害虫をフリック、収穫札をタップして行います。
