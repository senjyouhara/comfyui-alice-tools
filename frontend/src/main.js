import "@/extensions";
import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from 'pinia'
import PrimeVue from "primevue/config";

const ROOT_ID = "comfyui-alice-tools-root";

let root = document.getElementById(ROOT_ID);
if (!root) {
  root = document.createElement("div");
  root.id = ROOT_ID;
  root.style.display = "contents";
  const graphCanvas = document.getElementsByClassName("graph-canvas-container")?.[0];
  (graphCanvas ?? document.body).append(root);
}
const app = createApp(App)
app.use(PrimeVue);
app.use(createPinia())
app.mount(root);
