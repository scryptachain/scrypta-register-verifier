import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "about" */ '../views/Home.vue')
  },
  {
    path: '/scan/:address',
    name: 'Scan',
    component: () => import(/* webpackChunkName: "about" */ '../views/Scan.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
