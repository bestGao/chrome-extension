import axios from "axios";
let Interval;
// console.log("我是background.js");
// 是否休市
const isDuringDate = () => {
  // 时区转换为东8区
  const zoneOffset = 8;
  const offset8 = new Date().getTimezoneOffset() * 60 * 1000;
  const nowDate8 = new Date().getTime();
  const curDate = new Date(nowDate8 + offset8 + zoneOffset * 60 * 60 * 1000);
  const beginDateAM = new Date();
  const endDateAM = new Date();
  const beginDatePM = new Date();
  const endDatePM = new Date();
  beginDateAM.setHours(9, 0, 0);
  endDateAM.setHours(12, 0, 0);
  beginDatePM.setHours(13, 0, 0);
  endDatePM.setHours(16, 0, 0);
  if (curDate.getDay() * 1 === 6 || curDate.getDay() * 1 === 0) {
    // 周末休市
    return false;
  } else if (curDate >= beginDateAM && curDate <= endDateAM) {
    // 上午交易时间
    return true;
  } else if (curDate >= beginDatePM && curDate <= endDatePM) {
    // 下午交易时间
    return true;
  } else {
    return false;
  }
};

const options = {
  id: "towebsite",
  title: "查看完整数据",
  contexts: ["all"],
  visible: true,
};

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create(options, () => {
    // console.log(`Created contextMenus Success, id:${options.id}`);
  });
});
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  chrome.tabs.create({
    url: "https://fund.eastmoney.com",
  });
});

// 设置特别关注的基金徽标/涨跌幅
const setBadge = (fundcode) => {
  let url = `https://fundgz.1234567.com.cn/js/${fundcode}.js?rt=${new Date().getTime()}`;
  axios
    .get(url)
    .then((res) => {
      let val = res.data.match(/\{(.+?)\}/);
      let resData = JSON.parse(val[0]);
      chrome.browserAction.setBadgeText({
        text: resData.gszzl, // 涨跌幅
      });
      let color = resData.gszzl >= 0 ? "red" : "green";
      chrome.browserAction.setBadgeBackgroundColor({
        color: color,
      });
    })
    .catch((error) => {
      console.log("设置特别关注的基金徽标接口error", error);
      chrome.browserAction.setBadgeText({
        text: "",
      });
    });
};

let startInterval = (attentionFundcode) => {
  endInterval(Interval);
  setBadge(attentionFundcode);
  Interval = setInterval(() => {
    if (true || isDuringDate()) {
      setBadge(attentionFundcode);
    }
  }, 2 * 60 * 1000);
};

var endInterval = () => {
  clearInterval(Interval);
  chrome.browserAction.setBadgeText({
    text: "",
  });
};

const runStart = (attentionFundcode) => {
  if (attentionFundcode) {
    startInterval(attentionFundcode);
  } else {
    endInterval();
  }
};

let attentionFundcode;
chrome.storage.sync.get(["attentionFundcode"], (res) => {
  attentionFundcode = res.attentionFundcode || "";
  runStart(attentionFundcode);
});
// 监听来自content script脚本的请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.log(sender.tab ? "来自内容脚本：" + sender.tab.url : "来自扩展程序");
  if (request.type == "DuringDate") {
    let DuringDate = isDuringDate();
    sendResponse({
      isEffective: DuringDate,
    });
  }
  if (request.type == "endInterval") {
    endInterval();
  }
  if (request.type == "startInterval") {
    startInterval(request.id);
  }
  /* 更新特别关注基金涨跌幅 */
  if (request.type == "refreshBadge") {
    chrome.browserAction.setBadgeText({
      text: request.data.gszzl,
    });
    let color = isDuringDate()
      ? request.data.gszzl >= 0
        ? "#F56C6C"
        : "#4eb61b"
      : "#4285f4";
    chrome.browserAction.setBadgeBackgroundColor({
      color: color,
    });
  }
});
