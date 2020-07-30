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
    <!-- 自选基金 -->
    <template v-if="selectedFunds.length">
      <div
        class="date-tip"
        :class="isDuringDate ? 'up' : 'down'"
      >{{isDuringDate ? '基金数据实时更新中' : '休市中'}}</div>
      <table>
        <thead>
          <tr>
            <th>基金名称</th>
            <th v-if="isEdit">基金代码</th>
            <th v-if="!isEdit">估算净值</th>
            <th>涨跌幅</th>
            <th>持有金额（元）</th>
            <th>估算收益（元）</th>
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
            <td title="持有金额（元）">{{ calculateMoney(el) }}</td>
            <td :class="el.gszzl >= 0 ? 'up' : 'down'" title="估算收益（元）">{{ calculate(el) }}</td>
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
              <button title="上移" @click="sortUp(index)" class="btn edit">↑</button>
            </td>
            <td v-if="isEdit">
              <button @click="toggleFavorite(el.fundcode)" class="btn edit" title="是否收藏">
                <span v-if="el.fundcode === RealtimeFundcode">💗</span>
                <span v-else>❤</span>
              </button>
            </td>
            <td v-if="isEdit">
              <button title="删除" @click="deleteFund(el.fundcode)" class="btn edit">❌</button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    <template v-else>
      <div :style="{'text-align':'center', 'padding': '10px'}">请添加想要关注的基金</div>
    </template>
    <div v-if="isEdit" class="input-row">
      <span>添加新基金:</span>
      <input class="input" v-model="fundcode" :min="0" type="number" placeholder="请输入基金代码" />
      <button @click="save" class="btn">确定</button>
    </div>
    <div class="input-row">
      <button class="btn" @click="isEdit = !isEdit; fundcode = ''">{{isEdit ? '保存' : '编辑'}}</button>
      <button class="btn" @click="option">设置</button>
      <div
        :style="{display: 'inline-block', 'font-size':'16px'}"
        v-if="selectedFunds.length"
        :class="allGains >= 0 ? 'good-color' : 'bad-color'"
        :title="allGains >= 0 ? '果然我的眼光是最好哒' : '小跌怡情，顶的住！！跌是为了更好的涨！！'"
      >估算收益（元）：{{allGains}}</div>
    </div>
  </div>
</template>

<script>
import { arrayChunk } from '../util'
export default {
  data () {
    return {
      searchIds: [], // 大盘指数id数组
      isEdit: false, // 是否编辑
      fundcode: '', // 输入基金的代码
      marketIndexes: [], // 大盘指数数组切片
      isLiveUpdate: true, // 是否实时更新 ajax轮询
      isDuringDate: false,
      RealtimeFundcode: null,
      selectedFunds: [], // 已添加的基金详情列表
      intervalId1: null,
      intervalId2: null,
      allGains: 0, // 估算收益
      originalMarketIndexes: []
    };
  },
  mounted () {
    chrome.storage.sync.get(
      ["RealtimeFundcode", "searchIds"],
      res => {
        this.RealtimeFundcode = res.RealtimeFundcode;
        this.searchIds = res.searchIds;
        this.getData();
        this.getmarketIndexes()
        this.startUpdateData()
      }
    );
    document.body.bgColor = '#fafff8'
  },
  methods: {
    startUpdateData () {
      const _that = this
      // 与后台脚本通信
      chrome.runtime.sendMessage({ type: "DuringDate" }, response => {
        _that.isDuringDate = response.isDuringDate;
        if (_that.isDuringDate && _that.searchIds) {
          _that.intervalId1 = setInterval(() => {
            _that.getmarketIndexes();
          }, 5 * 1000);
          _that.intervalId2 = setInterval(() => {
            _that.getData();
          }, 60 * 1000);
        } else {
          clearInterval(_that.intervalId1);
          clearInterval(_that.intervalId2);
        }
      });
    },
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
      this.marketIndexes = arrayChunk(sd, 3);
      this.searchIds = sd1
      console.log('最后')
      chrome.storage.sync.set({ 'searchIds': sd1 })
    },
    option () {
      window.open('/options/options.html')
      // chrome.tabs.create({ url: "/options/options.html" });
    },
    getmarketIndexes () {
      // console.log('getmarketIndexes', this.searchIds)
      if (!this.searchIds) {
        return false
      }
      // f1-f18: 指数参数 1.000001 是上证指数代号
      let url =
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${this.searchIds.join(',')}&_=` +
        new Date().getTime();
      this.$axios.get(url).then(res => {
        this.originalMarketIndexes = res.data.data.diff
        this.marketIndexes = arrayChunk(res.data.data.diff, 3);
      });
    },
    /* 请求自选的基金数据 */
    getData () {
      /* fundcode 基金代码 name 基金名称 jzrq 净值日期 dwjz 当日净值 gsz 估算净值 gszzl 估算涨跌百分比 gztime 估值时间 */
      const _that = this
      let axiosArray = [];
      let resultArray = []
      for (const fund of this.selectedFunds) {
        let url =
          "http://fundgz.1234567.com.cn/js/" +
          fund.code +
          ".js?rt=" +
          new Date().getTime();
        let newPromise = this.$axios({
          url,
          methods: 'GET'
        });
        axiosArray.push(newPromise);
      }
      this.$axios
        .all(axiosArray)
        .then(
          _that.$axios.spread((...responses) => {
            responses.forEach(res => {
              const val = res.data.match(/\{(.+?)\}/);
              let data = JSON.parse(val[0]);
              // 已购份额
              const currentFund = _that.selectedFunds.find(item => item.code === data.fundcode)
              data.num = currentFund.num
              resultArray.push(data)
              // 是特别关注的基金
              if (data.fundcode == _that.RealtimeFundcode) {
                chrome.runtime.sendMessage({
                  type: "refreshBadge",
                  data: data
                });
              }
            });
            _that.selectedFunds = resultArray
            _that.getAllGains();
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
      // vue实例创建后给selectedFunds对象添加新的属性
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
    // 删除单个自选的基金
    deleteFund (id) {
      const _that = this
      this.selectedFunds = this.selectedFunds.filter(function (ele) {
        return ele.code !== id;
      });
      chrome.storage.sync.set(
        {
          storedFunds: _that.fundListM,
        },
        () => {
          _that.getData();
        }
      );
    },
    toggleFavorite (id) {
      const _that = this
      // 取消特别关注
      if (id == this.RealtimeFundcode) {
        chrome.storage.sync.set(
          {
            RealtimeFundcode: undefined
          },
          () => {
            _that.RealtimeFundcode = undefined;
            chrome.runtime.sendMessage({ type: "endInterval" });
          }
        );
      } else {
        // 添加特别关注
        chrome.storage.sync.set(
          {
            RealtimeFundcode: id
          },
          () => {
            _that.RealtimeFundcode = id;
            // 发送简单的一次性请求 在background.js通过chrome.runtime.onMessage接收
            chrome.runtime.sendMessage({ type: "startInterval", id: id });
          }
        );
      }
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

  .date-tip {
    text-align: "center";
    margin-top: 10px;
    font-size: "16px";
    color: "pink";
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
