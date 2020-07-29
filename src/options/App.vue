<template>
  <div id="app" class="container">
    <div class="info">当前版本{{version}}</div>
    <div class="operation">
      <div class="btn" @click="handleReset" title="重置后您的自定义选项都将失效">重置</div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      version: ''
    };
  },
  methods: {
    getVersion () {
      this.version = chrome.runtime.getManifest().version;
    },
    handleReset () {
      const result = window.confirm(
        "您的自定义设置将失效，包括设置的的大盘指数，确定要重置吗?"
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
    }
  },
  mounted () {
    this.getVersion()
  },
};
</script>

<style lang="scss" scoped>
.container {
  background-color: #fff8f1;
  padding: 20px;
  .info {
    padding: 10px;
  }
  .operation {
    .btn {
      padding: 10px 28px;
      font-size: 20px;
      background-color: #727cec;
      color: white;
      display: inline-block;
      border-radius: 20px;
      font-family: monospace;
    }
  }
}
</style>
