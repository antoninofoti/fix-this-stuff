<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">Fix This Stuff</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li v-if="isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/')" href="">Home</a>
          </li>
          <li v-if="isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/tickets')" href="">Tickets</a>
          </li>
          <li v-if="isAuthenticated" class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              User Area
            </a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#">Account settings</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" @click="logout" href="">Logout</a></li>
            </ul>
          </li>
        </ul>
        <ul class="navbar-nav">
          <li v-if="!isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/login')" href="#">Login</a>
          </li>
          <li v-if="!isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/register')" href="#">Register</a>
          </li>
        </ul>
      </div>
      <div>
        <form class="d-flex" role="search" @submit.prevent="handleSearch">
          <input
            class="form-control me-2"
            type="search"
            v-model="searchQuery"
            placeholder="Search by Ticket Number"
            aria-label="Search"
          />
          <button class="btn btn-outline-success" type="submit">Search</button>
        </form>
      </div>
    </div>
  </nav>

</template>
  
<script setup>
  import { computed } from 'vue'
  import { ref } from 'vue'
  import { useAuthStore } from '../store/auth'
  import { useRouter } from 'vue-router'
  
  const authStore = useAuthStore()
  const router = useRouter()
  
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  
  const logout = () => {
    authStore.logout()
    router.push('/')
  }

  const searchQuery = ref('')

  const handleSearch = () => {
    const trimmed = searchQuery.value.trim()
    if (trimmed) {
      console.log(trimmed)
      router.push(`/tickets/${trimmed}`)
    }
  }
</script>
  
<style>
</style>