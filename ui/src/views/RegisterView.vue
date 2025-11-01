<!-- src/views/RegisterView.vue -->
<template>
  <div class="container mt-4" style="max-width: 420px;">
    <h3 class="mb-3">Registrazione</h3>

    <form @submit.prevent="handleRegister" novalidate>
      <input v-model.trim="firstName" class="form-control mb-2" placeholder="Nome" required />
      <input v-model.trim="lastName" class="form-control mb-2" placeholder="Cognome" required />
      <input v-model.trim="email" type="email" class="form-control mb-2" placeholder="Email" required />
      <input v-model="password" type="password" class="form-control mb-2" placeholder="Password" required minlength="6" />
      <input v-model="confirmPassword" type="password" class="form-control mb-3" placeholder="Conferma password" required />

      <button class="btn btn-primary w-100" :disabled="loading">
        {{ loading ? 'Invio...' : 'Registrati' }}
      </button>

      <p v-if="error" class="mt-3 text-danger">{{ error }}</p>
      <p v-if="success" class="mt-3 text-success">{{ success }}</p>

      <router-link class="d-block mt-3" to="/login">Hai già un account? Accedi</router-link>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleRegister () {
  error.value = ''
  success.value = ''



  // Validazioni minime lato client
  if (!firstName.value || !lastName.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Compila tutti i campi'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Le password non coincidono'
    return
  }
  if (password.value.length < 6) {
    error.value = 'La password deve avere almeno 6 caratteri'
    return
  }

  loading.value = true
  try {
    await authStore.register({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
    })
    success.value = 'Registrazione completata'
   
  } catch (err) {
    const msg =
      (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.map(e => e.msg).join(', ')) ||
      err?.response?.data?.message ||
      (typeof err?.message === 'string' ? err.message : 'Registrazione fallita')
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>
