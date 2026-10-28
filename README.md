# CS2 鸡相册文件名生成器

根据 CS2 宠物相册的公开脚本规则，为自定义 JPG 图片生成可复制的图库文件名。

[在线使用](https://steam.pet/cs2-pet-album/) · [English](./README.en.md)

## 功能

- 按成长阶段、相册要求及可选地图、姿势或动作生成文件名，默认选择“幼鸡近景”。
- 可粘贴原图库文件名，保留原时间戳和无关标签，仅更新所选要求与主动修改的字段。
- 支持七种宽高比、标签变化预览、一键复制及重新生成时间戳。
- 严格检查文件名与标签；`book_` 文件提示先移回图库，异常输入不生成结果。

## 使用

直接双击 `index.html` 即可在浏览器中离线运行。页面使用原生 HTML、CSS 和 JavaScript，样式与逻辑都在单个文件内，无需后端、上传图片或安装依赖。

开发与构建需要 Node.js 22 或更高版本：

```bash
npm test
npm run build
npm run sync:site
```

`npm test` 使用 `node --test` 验证命名规则；`npm run build` 生成 `dist/index.html`；`npm run sync:site` 将该文件复制到相邻仓库的 `../steam.pet/cs2-pet-album/index.html`。生产发布沿用 `steam.pet` 的 `main` → Cloudflare Workers Builds 流程，无独立 Worker。

## 说明

退出游戏并备份后，将真正的 JPG 图片按生成名称放入对应宠物的 `library` 文件夹，再进入游戏拖入相册。修改标签只影响相册识别，不改变图片画面或鸡的实际年龄。每张图片使用不同时间戳；备份放在宠物目录之外，避免在 `library/book` 保留同时间戳副本。

所有文件名处理均在浏览器本地完成，不读取或上传图片。成就中的火烧、电击和 C4 事故报告页不提供普通照片命名选项。

规则参考 SteamTracking 公开提取的[相册页面代码](https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/panorama/scripts/popups/pet_book_pages.js)和[照片标签代码](https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/panorama/scripts/popups/pet_photo_tag.js)。按当前公开脚本规则生成；跨阶段补放尚未在游戏内实测，后续版本可能调整。

## 版权说明

本项目为非官方工具，未提供开源许可证，原创实现保留所有权利；仓库访问权限或页面公开可用不构成复制、修改或再发布授权。Steam、Counter-Strike、游戏名称、规则及相关第三方内容遵循各自权利与条款。
