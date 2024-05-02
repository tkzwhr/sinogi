Sinogi
==

自分で用意した詰碁・手筋問題を使って囲碁の練習ができるアプリです。

![demo](./demo.webp)

## Users Guide

ユーザーズガイドは[こちら](users-guide/UsersGuide.md)にあります。

## Build & Test

下記のものが必要です。

- Rust 1.77
- Volta 1.x
- Node 20.x

### Frontend

フロントエンド開発用のサーバーは

```shell
yarn
yarn dev
```

で起動できます。

### Frontend Tests

テストは

- React hooks
- Helpers

について記載しており、

```shell
yarn test --coverage
```

で実行できます。

### Backend

事前に関連ライブラリをインストールします。

https://tauri.app/v1/guides/getting-started/prerequisites/#setting-up-linux

バックエンド部分も含めたアプリは

```shell
cargo install cargo-cli # 初回のみ
cargo tauri dev
```

で起動できます。

## Licence

このアプリはMITでライセンスしています。
