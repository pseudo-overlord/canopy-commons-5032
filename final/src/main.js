import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.js";
import { restoreSession, initialiseAccounts } from "./auth.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

// Check for an existing session before the first page is shown.
await restoreSession();
await initialiseAccounts();

createApp(App).use(router).mount("#app");
