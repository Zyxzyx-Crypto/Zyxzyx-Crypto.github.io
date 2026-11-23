# 音乐文件放置说明

把你想播放的 mp3 文件放到这个文件夹（public/music/）里。

然后打开 src/components/MusicPlayer.vue，修改顶部 playlist 数组：

```js
const playlist = [
  { title: '歌名', artist: '歌手', file: '你的文件名.mp3' },
  { title: '歌名2', artist: '歌手2', file: '文件2.mp3' },
]
```

其中 file 填的就是你放进本目录的 mp3 文件名。

提示：
- 文件必须是 mp3 格式（或浏览器支持的 m4a/wav/ogg）
- 修改后刷新页面即可