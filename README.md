实时查看已关注的基金动态。

包括实时估值情况，可以增减自选基金。

首先输入基金代码添加基金，将基金添加特别关注后，可以以角标的形式展示在浏览器中。可以在设置中单独开启显示份额与收益选项，在编辑中输入持有的份额，可以计算出每个基金的实时估值与收益，以及总收益。

### 什么是 chrome extensions

> chrome 扩展是基于 HTML、CSS、JavaScript 构建的作用于自定义 chrome 浏览器体验的程序

### 如何开发一个自己的 chrome extension

[Vue2.x](https://cn.vuejs.org/v2/guide/instance.html) + [Webpack4.x](https://v4.webpack.js.org/concepts/plugins/)

当然完全可以直接用 HTML CSS JavaScript

首先，该扩展项目的根目录必须包含一个[manifest.json](https://developer.chrome.com/extensions/manifest)用来配置该扩展程序，chrome识别该json文件

使用web worker 实现ajax 轮询

Chrome浏览器扩展通过chrome.storage.* API，可以存取数据或监听数据的变化
chrome.storage.sync方式实现了自动数据同步，相同的chrome用户无论使用什么物理设备，只要以相同的账户登录即可访问存储的数据。设备离线时数据存储在本地，一旦设备上线则同步数据。如果用户禁止了数据同步，则采用chrome.storage.local方式

在manifest.json文件中的[permissions字段](https://developer.chrome.com/extensions/declare_permissions)注册'storage'后可以在项目中使用[chrome.storage](https://developer.chrome.com/extensions/storage)

### 调试

yarn run watch 监听文件修改并编译

1. 打开 chrome://extensions 开启开发者模式 加载已解压的扩展程序
2. 点击扩展程序在弹出页面右键/检查 或在 扩展程序 icon 上右键 审查弹出内容

#### 参考资料

- [官方文档](https://developer.chrome.com/extensions)

#### 数据来源

- 天天基金网/大盘指数：[获取指数接口示例](https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&invt=2&fields=f2,f3,f4,f6,f12,f14,f104,f105,f106&ut=267f9ad526dbe6b0262ab19316f5a25b&cb=jQuery183027144151760481683_1595495878685&_=1595495878944)

- 天天基金网/基金详情：[基金数据接口示例](http://fundgz.1234567.com.cn/js/519674.js?rt=1595495344238)
