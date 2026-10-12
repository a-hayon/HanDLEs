import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

// Point d'entrée : on crée l'application à partir du composant racine,
// on branche Pinia (les stores), puis on l'affiche dans <div id="app"> (index.html).
createApp(App).use(createPinia()).mount("#app");
