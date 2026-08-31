# Xiaoying Ye｜GitHub Pages 发布副本

本目录是可独立发布的纯静态作品集，只包含页面、CSS、JavaScript、字体、图片和视频素材，不包含项目检查点、开发服务器或测试文件。

## 发布方式

将 `github-pages` 目录中的全部内容上传到 GitHub 仓库的根目录，然后在仓库设置中开启 GitHub Pages，选择部署分支的根目录（`/root`）。保留 `.nojekyll` 文件，以免静态资源路径被 Jekyll 处理。

如果使用项目站点，页面会通过相对路径加载资源，适用于 `https://用户名.github.io/仓库名/` 形式的地址；不需要修改 HTML 中的路径。

## 视频发布副本

GitHub 单文件限制要求视频小于 100MB。本目录中三部超过限制的原视频已转换为 1280×720、H.264/AAC 的发布副本；项目根目录 `assets/videos/` 中的原视频未被修改。

| 文件 | 发布版大小 |
| --- | ---: |
| `jingwei-reclamation.mp4` | 84.83 MiB |
| `jingwei-fill-the-sea.mp4` | 64.45 MiB |
| `untitled.mp4` | 26.36 MiB |
| `gaint-panda.mp4` | 54.80 MiB（原文件） |
| `bilibili-splash-screen.mp4` | 8.30 MiB（原文件） |

## 本地预览

在 `github-pages` 目录中运行任意静态服务器即可预览，例如：

~~~powershell
python -m http.server 4173
~~~

然后打开 `http://localhost:4173/`。也可以直接双击根目录的 `index.html` 查看页面。

## 注意

本目录只负责准备发布文件，本轮没有创建 GitHub 账户、仓库、上传或部署。GitHub Pages 的免费额度和中国大陆访问质量以 GitHub 当前规则及实际网络为准。
