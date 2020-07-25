import Vue from "vue";
import App from "./AppDev";
import axios from "axios";

Vue.prototype.$axios = axios;

new Vue({
  el: "#app",
  render: h => h(App)
});