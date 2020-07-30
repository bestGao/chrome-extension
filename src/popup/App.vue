<template>
  <div id="app" :class="['container', {'more-width' :isEdit}]">
    <!-- 大盘指数 -->
    <div class="tab-row" :key="index" v-for="(rowItem, index) of marketIndexes">
      <div v-for="el of rowItem" class="tab-col" :class="el.f4 >= 0 ? 'up' : 'down'" :key="el.f12">
        <div class="close-icon-wrapper" @click="closeItem(el)">
          <img class="close-icon" src="/assets/images/icon_close.png" alt="不再显示" title="不看这条指数" />
        </div>
        <p title="大盘指数名">{{ el.f14 }}</p>
        <p
          :class="el.f4 >= 0 ? 'up' : 'down'"
          title="最新价"
          :style="{'font-size': '20px'}"
        >{{ el.f2 }}</p>
        <p :class="el.f4 >= 0 ? 'up' : 'down'">涨跌额：{{ el.f4 }}</p>
        <p :class="el.f4 >= 0 ? 'up' : 'down'">涨跌幅：{{ el.f3 }}%</p>
      </div>
    </div>
    <div class="date-tip">
      {{isDuringDate ? '基金数据实时更新中' : '休市中'}}
      <span
        :style="{'font-size': '12px', color: '#c0c0c0'}"
      >{{isDuringDate ? '' :'(不会实时更新数据)'}}</span>
    </div>
    <!-- 自选基金 -->
    <template v-if="selectedFunds.length">
      <table>
        <thead>
          <tr>
            <th>基金名称</th>
            <th v-if="isEdit">基金代码</th>
            <th v-if="!isEdit">估算净值</th>
            <th>涨跌幅</th>
            <th>持有金额(元)</th>
            <th>估算收益(元)</th>
            <th v-if="!isEdit">更新时间</th>
            <th v-if="isEdit">持有份额</th>
            <th v-if="isEdit && selectedFunds.length > 1">排序</th>
            <th v-if="isEdit" title="收藏一个基金，后台脚本自动更新涨跌幅，并显示在此扩展图标上。">收藏</th>
            <th v-if="isEdit">删除</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(el, index) of selectedFunds" :key="el.fundcode">
            <td class="fundName" :title="el.name">{{ el.name }}</td>
            <td v-if="isEdit" title="基金代码">{{ el.fundcode }}</td>
            <td v-if="!isEdit" title="估算净值">{{ el.gsz }}</td>
            <td :class="el.gszzl >= 0 ? 'up' : 'down'" title="涨跌幅">{{ el.gszzl }}%</td>
            <td title="持有金额(元)">{{ calculateMoney(el) }}</td>
            <td :class="el.gszzl >= 0 ? 'up' : 'down'" title="估算收益(元)">{{ calculate(el) }}</td>
            <td v-if="!isEdit">{{ el.gztime.substr(5) }}</td>
            <th v-if="isEdit">
              <input
                class="input num"
                placeholder="输入持有份额"
                v-model="el.num"
                @input="changeNum(el, index)"
                type="number"
                :min="0"
              />
            </th>
            <td v-if="isEdit && selectedFunds.length > 1">
              <div title="上移" @click="sortUp(index)" class="icon" v-if="index > 0">↑</div>
            </td>
            <td v-if="isEdit">
              <div @click="toggleFavorite(el.fundcode)" class="icon" title="是否收藏">
                <span v-if="el.fundcode === attentionFundcode">💗</span>
                <span v-else>❤️</span>
              </div>
            </td>
            <td v-if="isEdit">
              <div title="删除" @click="deleteFund(el.fundcode)" class="icon">❌</div>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    <template v-else>
      <div :style="{'text-align':'center', 'padding': '10px'}">请添加您想要关注的基金</div>
    </template>
    <div v-if="isEdit" class="input-row">
      <span>添加新基金:</span>
      <input class="input" v-model="fundcode" :min="0" type="number" placeholder="请输入基金代码" />
      <button @click="handleAdd" class="btn">确定</button>
    </div>
    <div class="input-row">
      <button
        class="btn"
        @click="isEdit = !isEdit; fundcode = null"
      >{{isEdit ? '保存' : selectedFunds.length ? '编辑': '添加'}}</button>
      <button class="btn" @click="option">扩展设置</button>
      <div
        :style="{display: 'inline-block', 'font-size':'18px'}"
        v-if="selectedFunds.length"
        :class="allGains >= 0 ? 'good-color' : 'bad-color'"
        :title="allGains >= 0 ? '果然我的眼光是最好哒' : '小跌怡情，顶的住！！跌是为了更好的涨！！'"
      >估算收益(元)：{{allGains}}</div>
    </div>
  </div>
</template>

<script>
import { arrayChunk } from "../util";

export default {
  data() {
    return {
      searchIds: [], // 大盘指数id数组
      isEdit: false, // 是否编辑
      fundcode: null, // 将要添加的基金代码
      marketIndexes: [], // 大盘指数数组切片
      isDuringDate: false, // 是否有效的交易时间
      attentionFundcode: null, // 特别关注的基金
      selectedFunds: [], // 已添加的基金详情列表
      intervalId1: null, // 获取大盘指数定时器ID
      intervalId2: null, // 获取基金数据定时器ID
      allGains: 0, // 估算收益
      originalMarketIndexes: [], // 大盘指数数组
    };
  },
  mounted() {
    // this.fetchFundsData();
    chrome.storage.sync.get(
      ["attentionFundcode", "searchIds", "storedFunds"],
      (res) => {
        this.attentionFundcode = res.attentionFundcode;
        /* res.searchIds: undefined 默认值 res.searchIds: [] 用户手动删除 */
        this.searchIds = res.searchIds || [
          "1.000001", // 上证
          "1.000300", // 沪深300
          "0.399006", // 创业板
          "0.399005", // 中小板
          "100.HSI", // 恒生
          "1.000688", // 科创50
        ];
        // console.log("返回", res.searchIds);
        if (!(JSON.stringify(res.searchIds) === "[]")) {
          this.getmarketIndexes();
        }
        // console.log("自选的基金", res.storedFunds);
        this.selectedFunds = res.storedFunds || [];
        this.startUpdateData();
      }
    );
    document.body.bgColor = "#fafff8";
  },
  methods: {
    startUpdateData() {
      const _that = this;
      // 与后台脚本background.js通信
      chrome.runtime.sendMessage({ type: "DuringDate" }, (res) => {
        _that.isDuringDate = res.isEffective;
        // console.log(res.isEffective)
        if (res.isEffective) {
          // 手动删除完是[]
          // alert(_that.searchIds && _that.searchIds.length)
          if (_that.searchIds && _that.searchIds.length >= 1) {
            _that.intervalId1 = setInterval(() => {
              _that.getmarketIndexes();
            }, 5 * 1000);
          }
          if (_that.selectedFunds && _that.selectedFunds.length) {
            _that.intervalId2 = setInterval(() => {
              _that.fetchFundsData();
            }, 5 * 1000);
          }
        } else {
          clearInterval(_that.intervalId1);
          clearInterval(_that.intervalId2);
        }
      });
    },
    closeItem(item) {
      const result = window.confirm("确定不再展示该指数?");
      if (!result) {
        return false;
      }
      const id = item.f12;
      let sd = [];
      let sd1 = [];
      this.originalMarketIndexes.forEach(function (sItem) {
        if (id.includes(sItem.f12) === false) {
          sd.push(sItem);
        }
      });
      this.searchIds.forEach(function (sItem) {
        if (sItem.includes(id) === false) {
          sd1.push(sItem);
        }
      });
      this.originalMarketIndexes = sd;
      this.marketIndexes = arrayChunk(sd, 3);
      this.searchIds = sd1;
      chrome.storage.sync.set({ searchIds: sd1 });
    },
    option() {
      window.open("/options/options.html");
      // chrome.tabs.create({ url: "/options/options.html" });
    },
    getmarketIndexes() {
      // f1-f18: 指数参数 1.000001 是上证指数代号
      let url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${this.searchIds.join(
        ","
      )}&_=${new Date().getTime()}`;
      this.$axios.get(url).then((res) => {
        this.originalMarketIndexes = res.data.data.diff;
        this.marketIndexes = arrayChunk(res.data.data.diff, 3);
      });
    },
    /* 请求自选的基金数据 */
    fetchFundsData() {
      /* fundcode 基金代码 name 基金名称 jzrq 净值日期 dwjz 当日净值 gsz 估算净值 gszzl 估算涨跌百分比 gztime 估值时间 */
      const _that = this;
      let axiosArray = [];
      let resultArray = [];
      for (const fund of this.selectedFunds) {
        let url =
          "http://fundgz.1234567.com.cn/js/" +
          fund.fundcode +
          ".js?rt=" +
          new Date().getTime();
        let newPromise = this.$axios({
          url,
          methods: "GET",
        });
        axiosArray.push(newPromise);
      }
      this.$axios
        .all(axiosArray)
        .then(
          _that.$axios.spread((...responses) => {
            responses.forEach((res) => {
              const val = res.data.match(/\{(.+?)\}/);
              let data = JSON.parse(val[0]);
              // 已购份额
              const currentFund = _that.selectedFunds.find(
                (item) => item.fundcode === data.fundcode
              );
              data.num = currentFund.num;
              resultArray.push(data);
              // 是特别关注的基金
              if (data.fundcode == _that.attentionFundcode) {
                chrome.runtime.sendMessage({
                  type: "refreshBadge",
                  data: data,
                });
              }
            });
            _that.selectedFunds = resultArray;
            _that.getAllGains();
          })
        )
        .catch((error) => {
          console.log("数据请求出现错误！");
        });
    },
    getAllGains() {
      let allGains = 0;
      this.selectedFunds.forEach((val) => {
        allGains += parseFloat(this.calculate(val));
      });
      this.allGains = allGains.toFixed(1);
    },
    changeNum(item) {
      for (let fund of this.selectedFunds) {
        if (fund.fundcode == item.fundcode) {
          fund.num = item.num;
        }
      }
      chrome.storage.sync.set({
        storedFunds: this.selectedFunds,
      });
      this.getAllGains();
    },
    calculateMoney(val) {
      let sum = val ? (val.dwjz * val.num).toFixed(2) : 0;
      return sum;
    },
    calculate(val) {
      let sum = val ? ((val.gsz - val.dwjz) * val.num).toFixed(2) : 0;
      return sum;
    },
    handleAdd() {
      const _that = this;
      // 判断是否已存在
      let hasCode;
      if (this.selectedFunds && this.selectedFunds.length > 0) {
        hasCode = this.selectedFunds.some((currentValue) => {
          return currentValue.fundcode == this.fundcode;
        });
      }

      if (hasCode) {
        alert("该基金已存在！");
        return false;
      }

      // 获取基金详情
      let url = `http://fundgz.1234567.com.cn/js/${
        this.fundcode
      }.js?rt=${new Date().getTime()}`;
      this.$axios
        .get(url)
        .then((res) => {
          let val = res.data.match(/\{(.+?)\}/);
          if (val) {
            let itemData = {
              fundcode: _that.fundcode,
              num: null,
            };
            _that.selectedFunds.push(itemData);
            chrome.storage.sync.set(
              {
                storedFunds: _that.selectedFunds,
              },
              () => {
                _that.fetchFundsData();
                // 判断是否第一条
                if (_that.selectedFunds.length === 1) {
                  _that.intervalId2 = setInterval(() => {
                    _that.fetchFundsData();
                  }, 5 * 1000);
                }
              }
            );
          } else {
            alert("请输入正确的基金代码");
          }
        })
        .catch((error) => {
          alert("无法获取该基金信息！");
        });
    },
    sortUp(index) {
      // debugger
      let val = this.selectedFunds[index - 1];
      // vue实例创建后给selectedFunds对象添加新的属性
      this.$set(this.selectedFunds, index - 1, this.selectedFunds[index]);
      this.$set(this.selectedFunds, index, val);
      // this.selectedFunds[index] = [
      //   this.selectedFunds[index - 1],
      //   (this.selectedFunds[index - 1] = this.selectedFunds[index]),
      // ][0];
      chrome.storage.sync.set({
        storedFunds: this.selectedFunds,
      });
    },
    // 删除单个自选的基金
    deleteFund(id) {
      debugger;
      const _that = this;
      this.selectedFunds = this.selectedFunds.filter(function (ele) {
        return ele.fundcode !== id;
      });
      chrome.storage.sync.set(
        {
          storedFunds: _that.selectedFunds,
        },
        () => {
          // 判断是否最后一条
          if (this.selectedFunds.length) {
            _that.fetchFundsData();
          } else {
            clearInterval(intervalId2);
          }
        }
      );
    },
    toggleFavorite(id) {
      const _that = this;
      // 取消特别关注
      if (id == this.attentionFundcode) {
        chrome.storage.sync.set(
          {
            attentionFundcode: undefined,
          },
          () => {
            _that.attentionFundcode = undefined;
            chrome.runtime.sendMessage({ type: "endInterval" });
          }
        );
      } else {
        // 添加特别关注
        chrome.storage.sync.set(
          {
            attentionFundcode: id,
          },
          () => {
            _that.attentionFundcode = id;
            // 发送简单的一次性请求 在background.js通过chrome.runtime.onMessage接收
            chrome.runtime.sendMessage({ type: "startInterval", id: id });
          }
        );
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-width: 550px;
  min-height: 150px;
  overflow-y: auto;
  padding: 8px 2px;
  font-size: 12px;

  .date-tip {
    text-align: center;
    margin-top: 10px;
    font-size: 18px;
    color: pink;
  }
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
  cursor: pointer;
  background-color: #f7adad;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 18px;
  color: #1f1018;
  margin: 0 10px;
  outline: none;
  text-shadow: none;
  box-shadow: none;
  border: none;
  font-family: cursive;
}

.input {
  padding: 4px 8px;
  border-radius: 20px;
  border: none;
  outline: none;
}

.icon {
  cursor: pointer;
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
    flex: 1; // flex-grow flex-shrink flex-basis|auto|initial|inherit
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
