<template>
  <div id="app" :class="['container', {'more-width' :isEdit}]">
    <div>
      <div
        v-if="showTip"
        :style="{'text-align': 'center', 'color': '#c0c0c0', 'font-size': '12px'}"
      >实时数据来自服务器 {{serveraddress}} 的推送</div>
      <div class="tab-row">
        <div
          v-for="el in marketIndexes"
          class="tab-col"
          :key="el.f12"
          :class="el.f4 >= 0 ? 'up' : 'down'"
        >
          <p title="大盘指数名称">{{ el.f14 }}</p>
          <p
            :class="el.f4 >= 0 ? 'up' : 'down'"
            title="最新价"
            :style="{'font-size': '20px'}"
          >{{ el.f2 }}</p>
          <p :class="el.f4 >= 0 ? 'up' : 'down'">涨跌额：{{ el.f4 }}</p>
          <p :class="el.f4 >= 0 ? 'up' : 'down'">涨跌幅：{{ el.f3 }}%</p>
        </div>
      </div>
      <template v-if="selectedFunds.length">
        <div
          :style="{'text-align': 'center', 'margin-top': '10px', 'font-size': '16px', 'color': 'pink'}"
          :class="isDuringDate ? 'up' : 'down'"
          v-if="selectedFunds.length"
        >{{isDuringDate ? '基金数据实时更新中' : '休市中'}}</div>
        <table>
          <thead>
            <tr>
              <th>基金名称</th>
              <th v-if="isEdit">基金代码</th>
              <th v-if="!isEdit">估算净值</th>
              <th>涨跌幅</th>
              <th>持有金额（元）</th>
              <th>估算收益</th>
              <th v-if="!isEdit">更新时间</th>
              <th v-if="isEdit">持有份额</th>
              <th v-if="isEdit && selectedFunds.length > 1">排序</th>
              <th v-if="isEdit" title="收藏一个基金，后台脚本自动更新估值和涨跌幅，并在此扩展图标中以徽标的形式显示。">特别关注</th>
              <th v-if="isEdit">删除</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(el, index) in selectedFunds" :key="el.fundcode">
              <td class="fundName" :title="el.name">{{ el.name }}</td>
              <td v-if="isEdit">{{ el.fundcode }}</td>
              <td v-if="!isEdit">{{ el.gsz }}</td>
              <td :class="el.gszzl >= 0 ? 'up' : 'down'">{{ el.gszzl }}%</td>
              <td>{{ calculateMoney(el) }}</td>
              <td :class="el.gszzl >= 0 ? 'up' : 'down'">{{ calculate(el) }}</td>
              <td v-if="!isEdit">{{ el.gztime.substr(5) }}</td>
              <th v-if="isEdit">
                <input
                  class="btn num"
                  placeholder="输入持有份额"
                  v-model="el.num"
                  @input="changeNum(el, index)"
                  type="number"
                  :min="0"
                />
              </th>
              <td v-if="isEdit && selectedFunds.length > 1">
                <button title="上移" @click="sortUp(index)" class="btn edit">👆</button>
              </td>
              <td v-if="isEdit">
                <button
                  @click="slt(el.fundcode)"
                  :class="el.fundcode == attentionFundcode ? 'slt' : ''"
                  class="btn edit"
                  title="设为徽标"
                >💗</button>
              </td>
              <td v-if="isEdit">
                <button title="取消自选" @click="dlt(el.fundcode)" class="btn red edit">❌</button>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
      <template v-else>
        <div :style="{'text-align':'center', 'padding': '10px'}">请添加想要关注的基金</div>
      </template>
    </div>
    <div v-if="isEdit" class="input-row">
      <span>添加新基金:</span>
      <input v-model="fundcode" class="btn" type="number" placeholder="请输入基金代码" />
      <button @click="save" class="btn">确定</button>
    </div>
    <div class="input-row">
      <button class="btn" @click="isEdit = !isEdit; fundcode = ''">{{isEdit ? '保存' : '编辑'}}</button>
      <div
        :style="{display: 'inline-block', 'font-size':'16px'}"
        v-if="selectedFunds.length"
        :class="allGains >= 0 ? 'good-color' : 'bad-color'"
        :title="allGains >= 0 ? '果然我的眼光是最好哒' : '小跌怡情，顶的住！！跌是为了更好的涨！！'"
      >估算收益：{{allGains}}</div>
    </div>
  </div>
</template>

<script>
import { WSHOST } from "../util";
export default {
  name: "vueApp",
  data () {
    return {
      showTip: false,
      serveraddress: WSHOST,
      isEdit: false, // 是否编辑
      fundcode: "", // 输入基金的代码
      marketIndexes: [], // 大盘指数数组
      isDuringDate: true,
      attentionFundcode: "", // 特别关注的基金代码
      selectedFunds: [], // 已自选的基金s数组
      intervalId1: null,
      intervalId2: null,
      fundList: [],
      fundListM: [],
      allGains: 0, // 估算收益
    };
  },
  mounted () {
    const _that = this;
    chrome.storage.sync.get(
      ["attentionFundcode", "fundListM", "fundList"],
      (res) => {
        _that.fundList = res.fundList ? res.fundList : _that.fundList;
        if (res.fundListM) {
          _that.fundListM = res.fundListM;
        } else {
          for (const fund of _that.fundList) {
            let val = {
              code: fund,
              num: null,
            };
            _that.fundListM.push(val);
          }
        }
        if (res.attentionFundcode) {
          _that.attentionFundcode = res.attentionFundcode;
        }
        _that.getData();
        _that.getmarketIndexes();
      }
    );
    this.startUpdateData();
    document.body.bgColor = "#fafff8";

    const ws = new WebSocket(`ws://${this.serveraddress}`);
    ws.addEventListener("open", function (event) {
      _that.showTip = true;
      ws.send("jayGao");
    });
    ws.addEventListener("message", function (event) {
      console.log("服务器传来的数据", event.data);
      _that.marketIndexes = JSON.parse(event.data);
    });
    ws.onerror = function () {
      alert("websocket服务器连接失败");
      return false;
    };
    // ws.onclose = function () {
    //   // 关闭 websocket
    //   alert("服务器连接已关闭...");
    // };
  },
  methods: {
    startUpdateData () {
      // 与后台脚本通信
      chrome.runtime.sendMessage({ type: "DuringDate" }, (response) => {
        this.isDuringDate = response.isDuringDate;
      });
    },
    option () {
      chrome.tabs.create({ url: "/options/options.html" });
    },
    getmarketIndexes () {
      // f1-f18: 指数参数 1.000001 是上证指数代号
      let url =
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=1.000001,0.399006,100.HSI&_=` +
        new Date().getTime();
      this.$axios.get(url).then((res) => {
        this.marketIndexes = res.data.data.diff;
      });
    },
    getData () {
      /* fundcode 基金代码 name 基金名称 jzrq 净值日期 dwjz 当日净值 gsz 估算净值 gszzl 估算涨跌百分比 gztime 估值时间 */
      let axiosArray = [];
      for (const fund of this.fundListM) {
        let url =
          "http://fundgz.1234567.com.cn/js/" +
          fund.code +
          ".js?rt=" +
          new Date().getTime();
        let newPromise = this.$axios.get(url);
        axiosArray.push(newPromise);
      }

      this.$axios
        .all(axiosArray)
        .then(
          this.$axios.spread((...responses) => {
            this.selectedFunds = [];
            responses.forEach((res) => {
              let val = res.data.match(/\{(.+?)\}/);
              let data = JSON.parse(val[0]);
              let slt = this.fundListM.filter(
                (item) => item.code == data.fundcode
              );
              data.num = slt[0].num;
              this.selectedFunds.push(data);
              if (data.fundcode == this.attentionFundcode) {
                chrome.runtime.sendMessage({
                  type: "refreshBadge",
                  data: data,
                });
              }
            });
            this.getAllGains();
          })
        )
        .catch((error) => {
          console.log("数据请求出现错误！");
        });
    },
    getAllGains () {
      let allGains = 0;
      this.selectedFunds.forEach((val) => {
        allGains += parseFloat(this.calculate(val));
      });
      this.allGains = Number(allGains.toString().match(/^\d+(?:\.\d{0,2})?/));
    },
    changeNum (item, ind) {
      for (let fund of this.fundListM) {
        if (fund.code == item.fundcode) {
          fund.num = item.num;
        }
      }
      chrome.storage.sync.set({
        fundListM: this.fundListM,
      });
      this.getAllGains();
    },
    calculateMoney (val) {
      let sum = val.dwjz * val.num;
      sum = Number(sum.toString().match(/^\d+(?:\.\d{0,2})?/));
      return sum;
    },
    calculate (val) {
      let sum = (val.gsz - val.dwjz) * val.num;
      sum = Number(sum.toString().match(/^\d+(?:\.\d{0,2})?/));
      return sum;
    },
    save () {
      let hasCode = this.fundListM.some((currentValue, index, array) => {
        return currentValue.code == this.fundcode;
      });
      if (hasCode) {
        alert("该基金已添加！");
        return false;
      }

      // 基金详情
      let url =
        "http://fundgz.1234567.com.cn/js/" +
        this.fundcode +
        ".js?rt=" +
        new Date().getTime();
      this.$axios
        .get(url)
        .then((res) => {
          let val = res.data.match(/\{(.+?)\}/);
          if (val) {
            let val = {
              code: this.fundcode,
              num: null,
            };
            this.fundListM.push(val);
            chrome.storage.sync.set(
              {
                fundListM: this.fundListM,
              },
              () => {
                this.getData();
              }
            );
          } else {
            alert("基金详情接口返回空数据，该基金可能不存在");
          }
        })
        .catch((error) => {
          alert("无法获取该基金信息！");
        });
    },
    sortUp (ind) {
      if (ind == 0) {
        return false;
      }
      let val = this.selectedFunds[ind - 1];
      // vue实例创建后给selectedFunds对象添加新的属性
      this.$set(this.selectedFunds, ind - 1, this.selectedFunds[ind]);
      this.$set(this.selectedFunds, ind, val);
      this.fundListM[ind] = [
        this.fundListM[ind - 1],
        (this.fundListM[ind - 1] = this.fundListM[ind]),
      ][0];
      chrome.storage.sync.set({
        fundListM: this.fundListM,
      });
    },
    // 设置特别关注的基金
    slt (id) {
      if (id == this.attentionFundcode) {
        chrome.storage.sync.set(
          {
            attentionFundcode: undefined,
          },
          () => {
            this.attentionFundcode = undefined;
            chrome.runtime.sendMessage({ type: "endInterval" });
          }
        );
      } else {
        chrome.storage.sync.set(
          {
            attentionFundcode: id,
          },
          () => {
            this.attentionFundcode = id;
            chrome.runtime.sendMessage({ type: "startInterval", id: id });
          }
        );
      }
    },
    dlt (id) {
      // 删除一个自选的基金
      this.fundListM = this.fundListM.filter(function (ele) {
        return ele.code != id;
      });

      chrome.storage.sync.set(
        {
          fundListM: this.fundListM,
        },
        () => {
          this.getData();
        }
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-width: 500px;
  min-height: 150px;
  overflow-y: auto;
  padding: 8px 2px;
  font-size: 12px;
  font-family: "Helvetica Neue", Helvetica, Arial, "PingFang SC",
    "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei",
    sans-serif;
}

.more-height {
  height: 405px;
}

.more-width {
  width: 750px;
}

.num-all-width {
  min-width: 520px;
}

table {
  margin: 10px auto 0;
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

table th {
  padding: 8px 6px;
}

table td {
  padding: 6px 6px 5px;
}

.up {
  color: #f56c6c;
  font-weight: bold;
}

.down {
  color: #4eb61b;
  font-weight: bold;
}

tbody tr:hover {
  background: #f5fafe;
}

.btn {
  display: inline-block;
  line-height: 1;
  cursor: pointer;
  background: #fff;
  padding: 5px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #000000;
  margin: 0 5px;
  outline: none;
  border: 1px solid #dcdfe6;
}

.btn.edit {
  padding: 2px 5px;
  margin: 0;
}

.btn.red {
  color: #f56c6c;
}

.btn.num {
  width: 80px;
}

.good-color {
  color: #f56c6c;
  border-color: #f56c6c;
}

.bad-color {
  color: #4eb61b;
  border-color: #4eb61b;
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

.tab-row {
  padding: 6px 0;
  display: flex;
  .tab-col {
    margin: 0 2px;
    border-radius: 10px;
    padding: 12px;
    flex: 1;
    position: relative;
    .close-icon-wrapper {
      .close-icon {
        width: 16px;
        height: 16px;
      }
      position: absolute;
      right: 0px;
      top: -8px;
    }
    &.down {
      background-color: #dcdcdc;
    }
    &.up {
      background-color: #ffefef;
    }
  }
}

.tab-col h5 {
  margin: 4px 0;
  font-size: 12px;
}

.tab-col p {
  margin: 4px 0;
}

.tab-row:after,
.tab-row:before {
  display: table;
  content: "";
}

.tab-row:after {
  clear: both;
}

.primary {
  color: #409eff;
  border-color: #409eff;
}

.tips {
  font-size: 12px;
  margin: 0;
  color: #aaaaaa;
  line-height: 1.4;
  padding: 5px 15px;
}

.fundName {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: rgba(240, 240, 240, 1);
}

::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0px rgba(240, 240, 240, 0.5);
  border-radius: 10px;
  background-color: rgba(240, 240, 240, 0.5);
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  box-shadow: inset 0 0 0px rgba(240, 240, 240, 0.5);
  background-color: #cccccc;
}
</style>
