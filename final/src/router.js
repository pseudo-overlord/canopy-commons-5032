import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import DiscoverView from "./views/DiscoverView.vue";
import OpportunityView from "./views/OpportunityView.vue";
import RegisterView from "./views/RegisterView.vue";
import NotFoundView from "./views/NotFoundView.vue";

const routes = [
  { path: "/", name: "Home", component: HomeView },
  { path: "/discover", name: "Discover", component: DiscoverView },
  {
    path: "/opportunities/:id",
    name: "Opportunity",
    component: OpportunityView,
  },
  { path: "/register", name: "Register", component: RegisterView },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
