import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Login from "./views/Login.vue";
import Marketing from "./views/Marketing.vue";
import Members from "./views/Members.vue";
import Orders from "./views/Orders.vue";
import Products from "./views/Products.vue";

export const router = createRouter({
  history: createWebHashHistory("/admin/"),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/login", component: Login },
    { path: "/dashboard", component: Dashboard },
    { path: "/orders", component: Orders },
    { path: "/products", component: Products },
    { path: "/members", component: Members },
    { path: "/marketing", component: Marketing },
  ],
});

router.beforeEach((to) => {
  const authed = sessionStorage.getItem("nf-admin-auth") === "1";
  if (to.path !== "/login" && !authed) return "/login";
  if (to.path === "/login" && authed) return "/dashboard";
  return true;
});
