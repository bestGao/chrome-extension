<template>
  <div id="app" class="container" :class="customClass">
    <div>
      <div class="tab-row" :key="index" v-for="(rowItem, index) of marketIndexes">
        <div
          v-for="el in rowItem"
          class="tab-col"
          :key="el.f12"
          :class="el.f4 >= 0 ? 'up' : 'down'"
        >
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
      <template v-if="selectedFunds.length">
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
              <th v-if="isEdit && (showAmount || showGains)">持有份额</th>
              <th v-if="isEdit">排序</th>
              <th v-if="isEdit" title="收藏一个基金，后台脚本自动更新估值和涨跌幅，并在扩展图标中以徽标的形式显示。">特别关注</th>
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
              <th v-if="isEdit && isEdit && (showAmount || showGains)">
                <input
                  class="btn num"
                  placeholder="输入持有份额"
                  v-model="el.num"
                  @input="changeNum(el, index)"
                  type="text"
                />
              </th>
              <td v-if="isEdit">
                <button title="上移" @click="sortUp(index)" class="btn edit">👆</button>
              </td>
              <td v-if="isEdit">
                <button
                  @click="slt(el.fundcode)"
                  :class="el.fundcode == RealtimeFundcode ? 'slt' : ''"
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
      <button
        class="btn"
        @click="isDuringDate ? isLiveUpdate = !isLiveUpdate : null"
      >{{isDuringDate ? (isLiveUpdate ? '暂停实时更新' : '实时更新') : '休市中'}}</button>
      <button class="btn" @click="isEdit = !isEdit">{{isEdit ? '保存' : '编辑'}}</button>
      <button class="btn" @click="option">设置</button>
      <div
        :style="{display: 'inline-block', 'font-size':'16px'}"
        v-if="showGains"
        :class="allGains >= 0 ? 'good-color' : 'bad-color'"
        :title="allGains >= 0 ? '果然我的眼光是最好哒' : '小跌怡情，顶的住！！跌是为了更好的涨！！'"
      >估算收益：{{allGains}}</div>
    </div>
  </div>
</template>

<script>
import { arrayChunk } from '../util'
export default {
  data () {
    return {
      searchIds: [], // 大盘指数id
      isEdit: false, // 是否编辑
      fundcode: 0, // 输入基金的代码
      marketIndexes: [], // 切片的大盘指数数组
      isLiveUpdate: true, // 是否实时更新 ajax轮询
      isDuringDate: false,
      RealtimeFundcode: null,
      selectedFunds: [], // 已添加的基金详情列表
      intervalId1: null,
      intervalId2: null,
      fundList: [],
      fundListM: [],
      allGains: 0, // 估算收益
      originalMarketIndexes: []
    };
  },
  mounted () {
    this.getmarketIndexes();
    chrome.storage.sync.get(
      ["searchIds","RealtimeFundcode", "fundListM", "showAmount", "showGains", "fundList"],
      res => {
        this.fundList = res.fundList ? res.fundList : this.fundList;
        if (res.fundListM) {
          this.fundListM = res.fundListM;
        } else {
          for (const fund of this.fundList) {
            let val = {
              code: fund,
              num: null
            };
            this.fundListM.push(val);
          }
        }
        this.RealtimeFundcode = res.RealtimeFundcode;
        this.searchIds = res?.searchIds || ['1.000001', '1.000300', '0.399001', '0.399006', '0.399005', '100.HSI', '100.SPX', '100.NDX'],
        this.getData();
      }
    );
    document.body.bgColor = '#fafff8'
  },
  computed: {
    customClass () {
      if (this.rewardShadow) {
        return "more-height";
      } else if (this.isEdit) {
        return "more-width";
      } else if (this.showAmount && this.showGains) {
        return "num-all-width";
      } else if (this.showAmount || this.showGains) {
        return "num-one-width";
      }
    }
  },
  watch: {
    isLiveUpdate (val) {
      chrome.runtime.sendMessage({ type: "DuringDate" }, response => {
        this.isDuringDate = response.farewell;
        if (val && this.isDuringDate) {
          this.intervalId1 = setInterval(() => {
            this.getmarketIndexes();
          }, 5 * 1000);
          this.intervalId2 = setInterval(() => {
            this.getData();
          }, 60 * 1000);
        } else {
          clearInterval(this.intervalId1);
          clearInterval(this.intervalId2);
        }
      });
    }
  },
  methods: {
    closeItem (item) {
      const result = window.confirm('确定不再展示该指数?')
      if (!result) {
        return false
      }
      const id = item.f12
      let sd = []
      let sd1 = []
      this.originalMarketIndexes.forEach(function (sItem) {
        if (id.includes(sItem.f12) === false) {
          sd.push(sItem)
        }
      })
      this.searchIds.forEach(function (sItem) {
        if (sItem.includes(id) === false) {
          sd1.push(sItem)
        }
      })
      this.originalMarketIndexes = sd;
      this.marketIndexes = arrayChunk(sd, 4);
      this.searchIds = sd1
      chrome.storage.sync.set({'searchIds': sd1})
    },
    option () {
      window.open('/options/options.html')
      // chrome.tabs.create({ url: "/options/options.html" });
    },
    getmarketIndexes () {
      // f1-f18: 指数参数 1.000001 是上证指数代号
      let url =
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${this.searchIds.join(',')}&_=` +
        new Date().getTime();
      this.$axios.get(url).then(res => {
        this.originalMarketIndexes = res.data.data.diff
        this.marketIndexes = arrayChunk(res.data.data.diff, 4);
      });
    },
    getData () {
      // 	  ["fundcode"]=>"519983"           //基金代码
      // 	  ["name"]=>"长信量化先锋混合A"    //基金名称
      // 	  ["jzrq"]=>"2018-09-21"           //净值日期
      // 	  ["dwjz"]=>"1.2440"               //当日净值
      // 	  ["gsz"]=>"1.2388"                //估算净值
      // 	  ["gszzl"]=>"-0.42"               //估算涨跌百分比 即-0.42%
      // 	  ["gztime"]=>"2018-09-25 15:00"   //估值时间

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
            responses.forEach(res => {
              let val = res.data.match(/\{(.+?)\}/);
              let data = JSON.parse(val[0]);
              if (this.showAmount || this.showGains) {
                let slt = this.fundListM.filter(
                  item => item.code == data.fundcode
                );
                data.num = slt[0].num;
              }
              this.selectedFunds.push(data);
              if (data.fundcode == this.RealtimeFundcode) {
                chrome.runtime.sendMessage({
                  type: "refreshBadge",
                  data: data
                });
              }
            });
            this.getAllGains();
          })
        )
        .catch(error => {
          console.log("数据请求出现错误！");
        });
    },
    getAllGains () {
      let allGains = 0;
      this.selectedFunds.forEach(val => {
        allGains += parseFloat(this.calculate(val));
      });
      this.allGains = allGains.toFixed(1);
    },
    changeNum (item, ind) {
      for (let fund of this.fundListM) {
        if (fund.code == item.fundcode) {
          fund.num = item.num;
        }
      }
      chrome.storage.sync.set({
        fundListM: this.fundListM
      });
      this.getAllGains();
    },
    calculateMoney (val) {
      let sum = (val.dwjz * val.num).toFixed(1);
      return sum;
    },
    calculate (val) {
      let sum = ((val.gsz - val.dwjz) * val.num).toFixed(1);
      return sum;
    },
    save () {
      //验证
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
        .then(res => {
          let val = res.data.match(/\{(.+?)\}/);
          if (val) {
            let val = {
              code: this.fundcode,
              num: null
            };
            this.fundListM.push(val);
            chrome.storage.sync.set(
              {
                fundListM: this.fundListM
              },
              () => {
                this.getData();
              }
            );
          } else {
            alert("该基金可能为新发基金，暂无详细数据！");
          }
        })
        .catch(error => {
          alert("无法获取该基金信息！");
        });
    },
    sortUp (ind) {
      if (ind == 0) {
        return false;
      }
      let val = this.selectedFunds[ind - 1];
      this.$set(this.selectedFunds, ind - 1, this.selectedFunds[ind]);
      this.$set(this.selectedFunds, ind, val);
      this.fundListM[ind] = [
        this.fundListM[ind - 1],
        (this.fundListM[ind - 1] = this.fundListM[ind])
      ][0];
      chrome.storage.sync.set({
        fundListM: this.fundListM
      });
    },
    slt (id) {
      if (id == this.RealtimeFundcode) {
        chrome.storage.sync.set(
          {
            RealtimeFundcode: null
          },
          () => {
            this.RealtimeFundcode = null;
            chrome.runtime.sendMessage({ type: "endInterval" });
          }
        );
      } else {
        chrome.storage.sync.set(
          {
            RealtimeFundcode: id
          },
          () => {
            this.RealtimeFundcode = id;
            chrome.runtime.sendMessage({ type: "startInterval", id: id });
          }
        );
      }
    },
    dlt (id) {
      this.fundListM = this.fundListM.filter(function (ele) {
        return ele.code != id;
      });

      chrome.storage.sync.set(
        {
          fundListM: this.fundListM
        },
        () => {
          this.getData();
        }
      );
    }
  }
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
  width: 700px;
}

.num-all-width {
  min-width: 520px;
}

.num-one-width {
  min-width: 440px;
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
