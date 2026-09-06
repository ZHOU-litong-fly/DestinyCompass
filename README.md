# 命运罗盘｜易学卦象分析工具

这是 GitHub Pages 部署版。

## 最简单部署步骤
1. 在 GitHub 新建一个 Repository。
2. 把本文件夹内的全部文件上传到仓库根目录。
3. 打开仓库 `Settings` → `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/ (root)`，保存。
6. 等待 GitHub Pages 发布完成后，用生成的 HTTPS 地址访问。

## 文件说明
- `index.html`：工具主页
- `share-cover.png`：分享/封面图
- `favicon.png`：浏览器图标
- `apple-touch-icon.png`：iPhone 添加到主屏幕图标
- `icon-192.png` / `icon-512.png`：PWA 图标
- `manifest.webmanifest`：手机网页应用配置
- `.nojekyll`：避免 GitHub Pages 对静态文件额外处理

> 注意：GitHub Pages 可以用于免费测试，但中国大陆网络访问稳定性无法保证。正式面向中国大陆用户时，建议后续迁移到中国大陆云服务并配置备案域名。
