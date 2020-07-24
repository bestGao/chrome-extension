import axios from "axios";

let Interval;

var isDuringDate = () => {

  // 时区转换为东8区
  var zoneOffset = 8;
  var offset8 = new Date().getTimezoneOffset() * 60 * 1000;
  var nowDate8 = new Date().getTime();
  var curDate = new Date(nowDate8 + offset8 + zoneOffset * 60 * 60 * 1000);
  var beginDateAM = new Date();
  var endDateAM = new Date();
  var beginDatePM = new Date();
  var endDatePM = new Date();

  beginDateAM.setHours(9, 30, 0);
  endDateAM.setHours(11, 35, 0);
  beginDatePM.setHours(13, 0, 0);
  endDatePM.setHours(15, 5, 0);
  if (curDate.getDay() == "6" || curDate.getDay() == "0") {
    return false;
  } else if (curDate >= beginDateAM && curDate <= endDateAM) {
    return true;
  } else if (curDate >= beginDatePM && curDate <= endDatePM) {
    return true;
  } else {
    return false;
  }
};

// 设置特别关注的基金数据
var setBadge = (fundcode) => {
  let url =
    "http://fundgz.1234567.com.cn/js/" +
    fundcode +
    ".js?rt=" +
    new Date().getTime();
  axios
    .get(url)
    .then(res => {
      let val = res.data.match(/\{(.+?)\}/);
      let ress = JSON.parse(val[0]);
      chrome.browserAction.setBadgeText({
        text: ress.gszzl
      });
      let color = ress.gszzl >= 0 ? "#F56C6C" : "#4eb61b";
      chrome.browserAction.setBadgeBackgroundColor({
        color: color
      });
    })
    .catch(error => {
      chrome.browserAction.setBadgeText({
        text: ""
      });
    });
};

var startInterval = RealtimeFundcode => {
  endInterval(Interval);
  let Realtime = isDuringDate();
  setBadge(RealtimeFundcode, Realtime);
  Interval = setInterval(() => {
    if (isDuringDate()) {
      setBadge(RealtimeFundcode, true);
    } else {
      chrome.browserAction.setBadgeBackgroundColor({
        color: "#4285f4"
      });
    }
  }, 2 * 60 * 1000);
};

var endInterval = () => {
  clearInterval(Interval);
  chrome.browserAction.setBadgeText({
    text: ""
  });
};

var runStart = RealtimeFundcode => {
  if (RealtimeFundcode) {
    startInterval(RealtimeFundcode);
  } else {
    endInterval();
  }
};

var RealtimeFundcode = null;
chrome.storage.sync.get(["RealtimeFundcode"], res => {
  RealtimeFundcode = res.RealtimeFundcode ? res.RealtimeFundcode : null;
  runStart(RealtimeFundcode);
});
// 监听来自content script脚本的请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "DuringDate") {
    let DuringDate = isDuringDate();
    sendResponse({
      farewell: DuringDate
    });
  }
  if (request.type == "endInterval") {
    endInterval();
  }
  if (request.type == "startInterval") {
    startInterval(request.id);
  }
  if (request.type == "refreshBadge") {
    chrome.browserAction.setBadgeText({
      text: request.data.gszzl
    });
    let color = isDuringDate() ?
      request.data.gszzl >= 0 ?
        "#F56C6C" :
        "#4eb61b" :
      "#4285f4";
    chrome.browserAction.setBadgeBackgroundColor({
      color: color
    });
  }
});