> 大家好，很高兴给老表们开启这次组内分享，算是第一个做分享的咯，所以我先来抛砖引玉，期待后续有小伙伴带来更多精彩有趣可爱的分享。

> 这次分享的是一个特别可爱的小工具 — chrome extension，我们可以在[chrome商店](https://chrome.google.com/webstore/category/extensions)下载一个体验下。虽然它比较不起眼，被提及的频率不高，也不算什么高科技，但是小小的身体却蕴藏着大大的能力 - 自定义您的浏览器。

### 什么是 chrome extensions

> chrome 扩展是基于web技术 （如：HTML、CSS、JavaScript) 构建的可包含多个组件和功能的单一目的的小型软件；它具体能做什么：
-  修改当前浏览的web内容，例如 整页翻译
- 自定义浏览器启动页、主页、主题/背景色
- 通过开放的chrome API控制浏览器的交互
- so on ...

我们每天都要使用的浏览器既然有这么高的可定制化，那我们亲自动手来开发一个chrome扩展叭

### 开发
首先chrome扩展区别于chrome插件
实时查看已关注的基金动态。

包括实时估值情况，可以增减自选基金。

首先输入基金代码添加基金，将基金添加特别关注后，可以以角标的形式展示在浏览器中。可以在设置中单独开启显示份额与收益选项，在编辑中输入持有的份额，可以计算出每个基金的实时估值与收益，以及总收益。
[Vue2.x](https://cn.vuejs.org/v2/guide/instance.html) + [Webpack4.x](https://v4.webpack.js.org/concepts/plugins/)

(本地代码保存后reload扩展)[https://www.nodenpm.com/webpack-extension-reloader/package.html]
> This plugin doesn't allow Hot Module Replacement (HMR) yet 该扩展打开时不能更新代码，需要重新加载

当然完全可以直接用 HTML CSS JavaScript

首先，该扩展项目的根目录必须包含一个[manifest.json](https://developer.chrome.com/extensions/manifest)用来配置该扩展程序，chrome 识别该 json 文件

使用 web worker 实现 ajax 轮询
build 和build:dev最大的区别就是build:dev 把ajax轮询放到了node.js服务器，让服务器判断数据是否变化通过websocket向客户端推送大盘指数数据
websocket

同源策略
从上面的测试可以看出，WebSocket协议本身不要求同源策略（Same-origin Policy），也就是某个地址为http://a.com的网页可以通过WebSocket连接到ws://b.com。但是，浏览器会发送Origin的HTTP头给服务器，服务器可以根据Origin拒绝这个WebSocket请求。所以，是否要求同源要看服务器端如何检查

扩展常常用一个单独的长时间运行的脚本来管理一些任务或者状态

[background.js](https://developer.chrome.com/extensions/background_pages) 长时间在后台运行 用于实时更新特别关注的基金数据

如同 architecture overview 的解释。背景页是一个运行在扩展进程中的 HTML 页面。它在你的扩展的整个生命周期都存在，同时，在同一时间只有一个实例处于活动状态。

在一个有背景页的典型扩展中，用户界面（比如，浏览器行为或者页面行为和任何选项页）是由沉默视图实现的。当视图需要一些状态，它从背景页获取该状态。当背景页发现了状态改变，它会通知视图进行更新。

清单
请在扩展清单中注册背景页。一般，背景页不需要任何 HTML，仅仅需要 js 文件，比如：

Chrome 浏览器扩展通过 chrome.storage.\* API，可以存取数据或监听数据的变化
chrome.storage.sync 方式实现了自动数据同步，相同的 chrome 用户无论使用什么物理设备，只要以相同的账户登录即可访问存储的数据。设备离线时数据存储在本地，一旦设备上线则同步数据。
如果用户禁止了数据同步或者没有登录chrome账户，则采用 chrome.storage.local 方式

在 manifest.json 文件中的[permissions 字段](https://developer.chrome.com/extensions/declare_permissions)注册'storage'后可以在项目中使用[chrome.storage](https://developer.chrome.com/extensions/storage)

### 调试

yarn run watch 监听文件修改并编译

1. 打开 chrome://extensions 开启开发者模式 加载已解压的扩展程序
2. 点击扩展程序在弹出页面右键/检查 或在 扩展程序 icon 上右键 审查弹出内容

#### 参考资料

- [官方文档](https://developer.chrome.com/extensions)

#### 数据来源

- 天天基金网/大盘指数：[获取指数接口示例](https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&invt=2&fields=f2,f3,f4,f6,f12,f14,f104,f105,f106&ut=267f9ad526dbe6b0262ab19316f5a25b&cb=jQuery183027144151760481683_1595495878685&_=1595495878944)

- 天天基金网/基金详情：[基金数据接口示例](http://fundgz.1234567.com.cn/js/519674.js?rt=1595495344238)

还可以做什么
怎么打通支付宝的基金页面实现在扩展程序的popup.html买卖基金？