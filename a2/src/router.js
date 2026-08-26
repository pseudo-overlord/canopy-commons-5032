import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import DiscoverView from "./views/DiscoverView.vue";

const routes = [
  { path: "/", name: "Home", component: HomeView },
  { path: "/discover", name: "Discover", component: DiscoverView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
