#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 dist 产物打包成单个 HTML 文件（双击离线可开）。
内联：css、js、favicon、音乐 mp3（base64 data URI）。
"""
import base64
import re
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
OUT = "C:/Users/Administrator/Desktop/CoreForge-装机平台-单文件版.html"

html = open(os.path.join(DIST, "index.html"), encoding="utf-8").read()

# 1. favicon
favicon = open(os.path.join(DIST, "favicon.svg"), encoding="utf-8").read()
favicon_uri = "data:image/svg+xml;base64," + base64.b64encode(favicon.encode("utf-8")).decode()
html = html.replace('href="/favicon.svg"', f'href="{favicon_uri}"')

# 2. css
css_file = re.search(r'href="(/assets/[^"]+\.css)"', html).group(1)
css_path = os.path.join(DIST, css_file.lstrip("/"))
css = open(css_path, encoding="utf-8").read()
css_uri = "data:text/css;base64," + base64.b64encode(css.encode("utf-8")).decode()
html = html.replace(f'href="{css_file}"', f'href="{css_uri}"')

# 3. js（先内联音乐 data URI，再 base64 编码整体）
js_file = re.search(r'src="(/assets/[^"]+\.js)"', html).group(1)
js_path = os.path.join(DIST, js_file.lstrip("/"))
js = open(js_path, encoding="utf-8").read()

# 音乐：在 js 原文里把 `/music/` + encodeURI(file) 替换成 data URI 前缀
# minify 后形如：function f(e){return`/music/`+encodeURI(e.file)}
music_dir = os.path.join(DIST, "music")
mp3_path = os.path.join(music_dir, "晴天.mp3")
mp3_b64 = base64.b64encode(open(mp3_path, "rb").read()).decode()
js = js.replace(
    "`/music/`+encodeURI(e.file)",
    "`data:audio/mpeg;base64," + mp3_b64 + "`",
)

js_uri = "data:text/javascript;base64," + base64.b64encode(js.encode("utf-8")).decode()
html = html.replace(f'src="{js_file}"', f'src="{js_uri}"')

# 5. 产品图片：把 107 张 jpg 内联为 base64 映射，组件从 window.__PRODUCT_IMAGES__ 读取
img_dir = os.path.join(DIST, "images")
img_map = {}
if os.path.isdir(img_dir):
    for fn in sorted(os.listdir(img_dir)):
        if fn.lower().endswith(".jpg"):
            pid = os.path.splitext(fn)[0]
            with open(os.path.join(img_dir, fn), "rb") as fh:
                img_map[pid] = "data:image/jpeg;base64," + base64.b64encode(fh.read()).decode()
img_json = "{,".join(f'"{k}":"{v}"' for k, v in img_map.items())
inject = "<script>window.__PRODUCT_IMAGES__={" + img_json + "}</script>"
html = html.replace("<head>", "<head>" + inject, 1)

# 去掉 type="module" 以便 file:// 直接运行
html = html.replace('<script type="module" crossorigin ', '<script ')

open(OUT, "w", encoding="utf-8").write(html)
size = os.path.getsize(OUT)
print(f"OK -> {OUT}")
print(f"size: {size/1024/1024:.2f} MB")
