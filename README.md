# WardStock

WardStock – Visual Equipment Tracking for Hospital Wards

WardStock is a public prototype for visually tracking shared equipment on a hospital ward map. It is designed for portfolio sharing, hospital introduction, and early implementation review.

## Overview

WardStock helps ward teams see where shared equipment is placed, which items are unused, and which items are currently loaned to another ward. The app runs entirely in the browser and stores prototype data in localStorage on the user's device.

## Main Features

- 病棟マップ上での物品配置
- 車椅子・クッション・歩行器・柵などの管理
- カテゴリー追加・削除
- 物品の編集・削除
- 未使用一覧
- 貸出台帳

## Startup

Open `index.html` directly in a browser, or serve the folder with any static file server.

Example:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173/
```

## Build

No build step is required. WardStock is a static HTML/CSS/JavaScript prototype.

## Public URL

https://ordialabs.github.io/WardStock/

## Privacy Notes

This public prototype does not include patient names, patient records, real hospital names, credentials, or internal hospital documents. Sample data uses generic ward labels and equipment IDs only.

## Created By

Created by Shoma Okano / OrdiaLabs
