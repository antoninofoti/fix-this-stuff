import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import TicketsView from '../views/TicketsView.vue'
import TicketView from '../views/TicketView.vue'
import ProfileView from '../views/ProfileView.vue'
import AdminView from '../views/AdminView.vue'
import LeaderboardView from '../views/LeaderboardView.vue'
import PendingApprovalsView from '../views/PendingApprovalsView.vue'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/', name: 'Home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/tickets', name: 'Tickets', component: TicketsView },
  { path: '/tickets/:ticketId', name: "Ticket Details", component: TicketView, props:true },
  { path: '/profile', name: 'Profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/leaderboard', name: 'Leaderboard', component: LeaderboardView, meta: { requiresAuth: false } },
  { path: '/pending-approvals', name: 'PendingApprovals', component: PendingApprovalsView, meta: { requiresAuth: true, requiresModerator: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin) {
    const role = authStore.getRole?.toUpperCase()
    if (role === 'ADMIN' || role === 'MODERATOR') {
      next()
    } else {
      next('/')
    }
  } else if (to.meta.requiresModerator) {
    const role = authStore.getRole?.toUpperCase()
    if (role === 'ADMIN' || role === 'MODERATOR') {
      next()
    } else {
      next('/')
    }
  } else {
    next()
  }
})

export default router