# Sunlit Cobblemon · Best Worker

[简体中文](README.md) | [English](README.en.md)

<p align="center">
  <a href="https://thirace446.github.io/sunlit-cobblemon-best-worker/">
    <img src="https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E4%BD%BF%E7%94%A8-%E6%89%93%E5%BC%80%E7%BD%91%E7%AB%99-2563eb?style=for-the-badge" alt="在线使用">
  </a>
</p>

面向 **Society: Sunlit Cobblemon** 整合包的工作站最佳宝可梦查询页。

纯静态 HTML，无后端、无数据库。玩家数据在浏览器本地解析和保存，网站不托管游戏文件。

## 功能

- 查看加工台、园艺站、神秘矿井、水晶球、能量塔的最佳宝可梦
- 按宝可梦属性、实际职能、配方类型筛选
- 支持等级、个体值（IV）、努力值（EV）、性格修正、闪光模拟
- 综合评分、速度倍率、期望产出、作用范围与培养建议
- 英语 / 中文 / 韩语界面
- 亮色 / 暗色主题
- 浏览器内虚拟滚动，1337 条数据也能流畅浏览

## 玩家使用

1. 打开 GitHub Pages 站点根地址。
2. 第一次使用会进入 **导入整合包数据** 页面。
3. 当前只支持整合包版本：

```text
1.1.4-SSV4.1.5A
```

4. 从 CurseForge 下载整合包 zip，以及页面提示的两个模组 jar：
   - Sunlit Cobblebackported
   - Cobblemon Farmers
5. 把 zip 和两个 jar 拖进导入页，点击 **解析并进入站点**。

导入完成后，数据会保存在当前浏览器的 `localStorage` 中。关闭网页不会重置；换浏览器、换设备或清除站点数据后需要重新导入。

## 本地运行

```powershell
npm run serve
```

或双击 `start-server.bat`，然后打开：

```text
http://localhost:4173/
```

## 部署

站点按纯静态文件部署到 GitHub Pages 即可，不需要构建命令或 GitHub Actions。

- `index.html`：有导入数据时进入查询页，否则进入导入页
- `.nojekyll`：跳过 Jekyll，直接按静态文件发布
- `.gitignore`：排除本地缓存、发布包和从游戏文件生成的数据

## 文档

- [CHANGELOG.md](CHANGELOG.md)：版本记录

## 声明

本站是 Society: Sunlit Cobblemon 的玩家自制工作站查询工具，用于比较各宝可梦在五个工作站的表现。  
数据来自玩家本地导入的整合包文件；本站不托管、不分发游戏文件。  
所有脚本算法来自整合包公开数据，一切以游戏内实际内容为准。

问题反馈：[GitHub Issues](https://github.com/Thirace446/sunlit-cobblemon-best-worker/issues)
