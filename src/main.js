import Vue from "vue";
import vgl from "vue-golden-layout";
import Fragment from "vue-fragment";
import "./components/inputs";
import ElectronLink from "./components/ElectronLink";
import "./components/directives/InfoView";
import "./components/directives/Search";
import "./components/directives/ValueTooltip";

import App from "./App.vue";
import ModV from "./application";
import store from "./ui-store";
import contextMenuPlugin from "./application/plugins/context-menu";

Vue.config.ignoredElements = ["grid", "c"];
Vue.config.productionTip = false;
Vue.use(vgl);
Vue.use(Fragment.Plugin);
Vue.component("ElectronLink", ElectronLink);

const modV = new ModV();
window.modV = modV;

modV.use("plugin", contextMenuPlugin);

Object.defineProperty(Vue.prototype, "$modV", {
  get() {
    return modV;
  }
});

window.Vue = new Vue({
  render: h => h(App),
  store
});

async function start() {
  modV.setup();
  await modV.ready;
  window.Vue.$mount("#app");
}

start();
