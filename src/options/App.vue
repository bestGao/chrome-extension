<template>
  <div id="app" class="container">
    <div class="info">
      当前版本：
      <span class="info-version">{{version}}</span>
    </div>
    <div @click="handleNotifications">显示通知</div>
    <div class="operation">
      <div class="radio-wrapper">
        <label class="radio-wrapper-item">
          天天基金网:
          <input
            type="radio"
            name="dataSources"
            @click="changeSource"
            value="tiantian"
            :checked="hasChecked === 'tiantian'"
          />
        </label>
        <label class="radio-wrapper-item">
          本地服务器:
          <input
            type="radio"
            name="dataSources"
            @click="changeSource"
            value="localserver"
            :checked="hasChecked === 'localserver'"
          />
        </label>
      </div>
      <div class="btn" @click="handleReset" title="重置后您的自定义选项都将失效">重置</div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      version: "",
      hasChecked: "tiantian",
    };
  },
  methods: {
    fetchSourceData() {
      chrome.storage.sync.get(["currentSources"], (res) => {
        this.hasChecked = res.currentSources || "tiantian";
      });
    },
    changeSource(value) {
      const val = value.target.value;
      if (val !== this.hasChecked) {
        this.hasChecked = val;
        chrome.storage.sync.set({
          currentSources: val,
        });
      }
    },
    handleNotifications() {
      chrome.notifications.create(null, {
        type: "image",
        iconUrl: "/assets/icons/icon16.png",
        title: "你好",
        message: "我是通知",
        imageUrl: "./assets/icons/icon48.png",
      });
    },
    getVersion() {
      this.version = chrome.runtime.getManifest().version;
    },
    handleReset() {
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
        function () {}
      );
    },
  },
  mounted() {
    this.getVersion();
    this.fetchSourceData();
  },
};
</script>

<style lang="scss" scoped>
.container {
  background-color: #fff8f1;
  padding: 20px;
  font-size: 16px;
  .info {
    &-version {
      color: pink;
    }
  }
  .operation {
    .radio-wrapper {
      margin: 10px 0;
      &-item {
        margin-right: 20px;
        vertical-align: -webkit-baseline-middle;
      }
    }
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
