import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import DiscoverView from "./views/DiscoverView.vue";
import OpportunityView from "./views/OpportunityView.vue";
import LoginView from "./views/LoginView.vue";
import RegisterView from "./views/RegisterView.vue";
import AccountView from "./views/AccountView.vue";
import CoordinatorView from "./views/CoordinatorView.vue";
import AccessDeniedView from "./views/AccessDeniedView.vue";
import NotFoundView from "./views/NotFoundView.vue";
import { currentUser } from "./identity.js";

const routes = [
  { path: "/", name: "Home", component: HomeView },
  { path: "/discover", name: "Discover", component: DiscoverView },
  {
    path: "/opportunities/:id",
    name: "Opportunity",
    component: OpportunityView,
  },
  { path: "/login", name: "Login", component: LoginView },
  { path: "/register", name: "Register", component: RegisterView },
  // Any logged-in user can see their own account page.
  {
    path: "/account",
    name: "Account",
    component: AccountView,
    meta: { requiresAuth: true },
  },
  // Only coordinators can see the overview page.
  {
    path: "/coordinator",
    name: "Coordinator",
    component: CoordinatorView,
    meta: { requiresAuth: true, role: "coordinator" },
  },
  { path: "/access-denied", name: "AccessDenied", component: AccessDeniedView },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// This runs before every page change, including when someone types the
// address in directly, so the checks cannot be skipped by using the URL.
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !currentUser.value) {
    return { path: "/login", query: { denied: "1", redirect: to.fullPath } };
  }

  if (to.meta.role && currentUser.value?.role !== to.meta.role) {
    return "/access-denied";
  }
});

export default router;
