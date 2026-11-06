# 发布清单（DSH 社区）

这个目录就是可直接推到 GitHub 公开仓库的内容。下面每一步做完再进下一步。

## 0. 发布前在本机验证

```sh
npm install
npm run build:client    # 从 src/entry.jsx 重新生成 lib/client.js
npm run check:client    # 已提交产物与源码一致
npm run check           # 语法
npm run smoke           # 结构 / 组合声明 / 宿主路由 / 鉴权 / 产物 / 伴随插件 六关
```

`scripts/smoke.mjs` 不起应用、不发网络请求、不写文件：桩 ctx 跑 `apply` 验证三条路由注册，
用假 req/res 验证 403（非回环）、405（方法不对）、200（状态路由读空状态），再核对 `lib/client.js`
的外壳 id 与路由、座位标记。任一条失败退出码 1。

## 0.5 检查打包内容

```sh
npm pack --dry-run
```

包里只应出现：`index.js`、`invariant.js`、`cordis.patch.yml`、`src/`、`lib/client.js`、`scripts/`、
两个 README、`LICENSE`。`node_modules/`、`publish/`、`*.tgz` 都不该进包。

**`lib/client.js` 必须提交进 git。** 它不是构建垃圾：从 GitHub 安装时不跑构建，缺了它界面不会加载。

## 1. 建 GitHub 仓库

- 公开仓库与包名同名：`dsh-prompt-shelf`，安装命令写 `github:OWNER/dsh-prompt-shelf`。
- 推送本目录内容。
- 给仓库加 topic：`dsh-plugin`（收录检查会看）。
- 仓库创建要满 1 天才能进目录（自动检查），当天建好、第二天再提 PR。

## 2. 填占位符

- `package.json` 的 `repository` / `homepage` / `bugs` 三处 URL。
- `publish/registry-entry.yml` 的两处 URL 与 `name`。
- 若走 npm，先确认包名可用：`npm view dsh-prompt-shelf version`（404 表示未被占用）。

## 3. 发布到 npm（可选但推荐）

```sh
npm publish --access public
```

不发 npm 也能被收录：安装命令走 GitHub。发 npm 的好处是市场能做版本更新检查。

## 4. 提交目录收录

到 GitHub 仓库 `awesome-dsh-plugin/awesome-dsh-plugin` 开 PR，只加一个文件：

- 路径：`data/plugins/<OWNER>__dsh-prompt-shelf.yml`
- 内容：`publish/registry-entry.yml` 全文

分类填 `ui`。本包不含图片资源，条目里不写 `icon` 行。

## 5. 之后的版本更新

1. 改 `package.json` 的 `version`（语义化版本）。
2. 改了界面就重新 `npm run build:client`，把 `lib/client.js` 一起提交。
3. 打 tag：`git tag v0.1.1 && git push && git push --tags`。
4. `npm publish`（如果走 npm）。
5. 目录条目本身不用改，市场按 npm 版本或 GitHub HEAD 检查更新。

## 收录要求对照

| 要求 | 本仓库状态 |
| --- | --- |
| `package.json` 声明 `dsh.bundle.patch` | 已声明，指向 `cordis.patch.yml` |
| 仓库有真实可用代码 | 有（宿主三条路由、状态文件读写、客户端窗口与卡片） |
| 仓库满 1 天 | 建库后次日再提 PR |
| 加 `dsh-plugin` topic | 建库时加 |
| 描述只说功能、不夸大 | `registry-entry.yml` 按实际能力写 |
| 分类贴合 | `ui` |
| 客户端半边可复现 | `lib/client.js` 已提交，`npm run check:client` 可核对 |

## 已知注意事项

- 数据文件在 `$DSH_HOME/data/dsh-prompt-shelf/`，与包分开；卸载插件不会删数据，要清就手工删这个目录。
- 宿主半边只响应回环地址；远程访问的 DSH 上界面会读不到条目（会走 localStorage 缓存兜底）。
