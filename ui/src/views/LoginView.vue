<template>
  <div class="container mt-5">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" class="form-control mb-2" required />
      <input v-model="password" type="password" placeholder="Password" class="form-control mb-2" required />
      <button class="btn btn-primary">Login</button>
      <p v-if="error" style="color:red">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.map(e => e.msg).join(', ')) ||
      err?.message ||
      'Login failed. Please try again.'
    error.value = msg
  }
}
</script>
