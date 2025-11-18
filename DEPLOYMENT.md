# Render 部署指南

## 部署到 Render Static Site

这个项目已经配置好可以在 Render 上部署为静态网站。

### 快速部署步骤

1. **连接 GitHub 仓库**
   - 访问 [Render Dashboard](https://dashboard.render.com/)
   - 点击 "New +" → "Static Site"
   - 连接你的 GitHub 账号
   - 选择 `mayuhua/simplepoordashboard` 仓库

2. **配置部署设置**
   - **Name**: `simplepoordashboard` (或你喜欢的名字)
   - **Branch**: `main`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `./dist`
   - **Node Version**: `18`

3. **环境变量** (可选)
   - `NODE_VERSION`: `18`

4. **部署**
   - 点击 "Create Static Site"
   - Render 会自动构建和部署你的应用

### 自动部署

配置完成后，每次你推送代码到 `main` 分支时，Render 都会自动重新部署。

### 本地预览构建

```bash
# 安装 serve (如果还没有安装)
npm install -g serve

# 构建并预览
npm run preview:static
```

或者使用 Vite 的预览功能：
```bash
npm run build
npm run preview
```

### 项目特性

- ✅ **自动优化**: Vite 配置了生产环境优化
- ✅ **代码分割**: 供应商库、图表和工具分别打包
- ✅ **缓存控制**: 配置了适当的 HTTP 头
- ✅ **SPA 路由**: 所有路由重定向到 index.html
- ✅ **压缩**: 生产环境删除 console 和 debugger

### 故障排除

1. **构建失败**
   - 检查 Node 版本是否为 18 或更高
   - 确保 `npm install` 成功完成
   - 查看 Render 构建日志

2. **404 错误**
   - Render 配置文件包含了 SPA 路由重写规则
   - 所有路径都会重定向到 index.html

3. **样式问题**
   - Tailwind CSS 配置为包含所有必要样式
   - 构建时会自动清理未使用的 CSS

### 访问你的应用

部署成功后，你的应用将在以下地址可用：
- `https://simplepoordashboard.onrender.com`

(实际 URL 可能因你的设置而异，可以在 Render Dashboard 中找到)

### 性能优化

项目已经配置了多项性能优化：

- **代码分割**: 主要依赖分别打包
- **压缩**: JavaScript 和 CSS 已压缩
- **缓存优化**: 适当的 HTTP 缓存头
- **资源优化**: 图片和字体预加载

---

**需要帮助？** 查看 [Render 官方文档](https://render.com/docs/static-sites)