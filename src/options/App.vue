<template>
  <div id="app" class="container">
    <div>
      <ul class="setting-list">
        <li>
          <div class="list-title">
            显示份额与收益信息
            <div class="select-row">
              显示持有金额
              <input type="radio" id="numFalse" :value="false" v-model="showAmount" />
              <label for="numFalse">否</label>
              <input type="radio" id="numTrue" :value="true" v-model="showAmount" />
              <label for="numTrue">是</label>
            </div>
            <div class="select-row">
              显示估值收益
              <input type="radio" id="numFalse" :value="false" v-model="showGains" />
              <label for="numFalse">否</label>
              <input type="radio" id="numTrue" :value="true" v-model="showGains" />
              <label for="numTrue">是</label>
            </div>
          </div>
          <p>tips：在编辑设置里，输入基金的持有份额，即可计算出收益估值情况。</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      disabled: false,
      showAmount: false,
      showGains: false
    };
  },
  mounted () {
    chrome.storage.sync.get(
      ["showNum", "showAmount", "showGains"],
      res => {
        if (res.showNum) {
          chrome.storage.sync.set({
            showNum: false
          });
          chrome.storage.sync.set(
            {
              showAmount: true
            },
            () => {
              this.showAmount = true;
            }
          );
          chrome.storage.sync.set(
            {
              showGains: true
            },
            () => {
              this.showGains = true;
            }
          );
        } else {
          this.showAmount = res.showAmount ? res.showAmount : false;
          this.showGains = res.showGains ? res.showGains : false;
        }
      }
    );
  },
  watch: {
    showAmount (val) {
      chrome.storage.sync.set(
        {
          showAmount: val
        },
        () => {
          this.showAmount = val;
        }
      );
    },
    showGains (val) {
      chrome.storage.sync.set(
        {
          showGains: val
        },
        () => {
          this.showGains = val;
        }
      );
    }
  },
  methods: {
    openGithub () {
      window.open("https://github.com/bestGao/funds-chrome-extension");
    }
  }
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
