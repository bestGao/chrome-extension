<template>
  <div id="app" class="container">
    <div>
      <button @click="handleReset" title="重置后您的自定义选项都将失效了">重置</button>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {};
  },
  methods: {
    handleReset () {
      const result = window.confirm(
        "您的自定义设置将失效，包括显示的大盘指数，确定要重置吗?"
      );
      if (!result) {
        return false;
      }
      chrome.storage.sync.set(
        {
          searchIds: [
            "1.000001", // 上证
            "1.000300", // 沪深300
            "0.399006", // 创业板
            "0.399005", // 中小板
            "100.HSI", // 恒生
            "1.000688", // 科创50
          ],
        },
        function () { }
      );
    },
    openGithub () {
      window.open("https://github.com/bestGao/funds-chrome-extension");
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-width: 630px;
  min-height: 520px;
  text-align: center;
  padding-top: 15px;
  font-size: 13px;
  font-family: "Helvetica Neue", Helvetica, Arial, "PingFang SC",
    "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei",
    sans-serif;
}

.setting-list {
  width: 600px;
  margin: 0 auto;
  text-align: left;
  padding: 0;
}

.setting-list li {
  list-style: none;
  font-size: 16px;
  border-bottom: 1px solid #dddddd;
  padding: 10px 0;
}

.setting-list li p {
  margin: 0;
  font-size: 14px;
  color: #999999;
}

.list-title {
  min-height: 34px;
  line-height: 34px;
}

.list-title .select-row {
  line-height: 30px;
  padding-left: 20px;
}

.btn {
  display: inline-block;
  line-height: 1;
  cursor: pointer;
  background: #fff;
  padding: 6px 8px;
  border-radius: 3px;
  font-size: 14px;
  color: #000000;
  margin: 0 5px;
  border: 1px solid #dcdfe6;
}

.btn[disabled] {
  color: #aaaaaa;
}

.icon-btn-row {
  position: relative;
}

.githubIcon {
  position: absolute;
  top: -4px;
  left: 12px;
}
.githubText {
  padding-left: 30px;
  padding: 8px 8px 8px 36px;
}

.slt {
  color: #fff;
  background-color: #67c23a;
  border-color: #67c23a;
}

.input-row {
  text-align: center;
  margin-top: 10px;
}

.tips {
  font-size: 12px;
  margin: 0;
  color: #aaaaaa;
  line-height: 1.4;
  padding: 5px 15px;
}
.primary {
  color: #409eff;
  border-color: #409eff;
}

.black {
  color: #24292e;
  border-color: #24292e;
}
</style>
