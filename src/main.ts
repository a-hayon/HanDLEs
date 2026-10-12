import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

// Entry point: create the app from the root component, plug in Pinia (the stores),
// then render it into <div id="app"> (index.html).
createApp(App).use(createPinia()).mount("#app");
