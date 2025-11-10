<template>
  <div id="app">
    <Navbar/>
    <main class="container mt-4">
      <router-view />
    </main>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted } from 'vue'
  import Navbar from './components/Navbar.vue'
  import { useAuthStore } from './store/auth'

  const authStore = useAuthStore()

  onMounted(() => {
    // Initialize profile data if user is logged in
    if (authStore.isAuthenticated && authStore.userId) {
      authStore.fetchUserProfile()
      authStore.startProfileRefresh()
    }

    // Refresh profile when window gains focus (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && authStore.isAuthenticated && authStore.userId) {
        authStore.fetchUserProfile()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Store the cleanup function
    window._appCleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  onUnmounted(() => {
    // Stop profile refresh when app unmounts
    authStore.stopProfileRefresh()
    
    // Cleanup event listeners
    if (window._appCleanup) {
      window._appCleanup()
      delete window._appCleanup
    }
  })
</script>

<style scoped>
</style>
