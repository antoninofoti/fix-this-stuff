<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">
          <i class="bi bi-person-plus"></i>
        </div>
        <h2>Sign Up</h2>
        <p>Create a new account to get started</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">
              <i class="bi bi-person"></i> First Name
            </label>
            <input 
              id="firstName"
              v-model.trim="firstName" 
              class="form-control" 
              placeholder="Your first name" 
              required 
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="lastName">
              <i class="bi bi-person"></i> Last Name
            </label>
            <input 
              id="lastName"
              v-model.trim="lastName" 
              class="form-control" 
              placeholder="Your last name" 
              required 
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="email">
            <i class="bi bi-envelope"></i> Email
          </label>
          <input 
            id="email"
            v-model.trim="email" 
            type="email" 
            class="form-control" 
            placeholder="example@email.com" 
            required 
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <i class="bi bi-lock"></i> Password
          </label>
          <div class="password-input-wrapper">
            <input 
              id="password"
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              class="form-control" 
              placeholder="Minimum 6 characters" 
              required 
              minlength="6" 
              :disabled="loading"
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="loading"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <small class="form-text">Password must contain at least 6 characters</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">
            <i class="bi bi-lock-fill"></i> Confirm Password
          </label>
          <div class="password-input-wrapper">
            <input 
              id="confirmPassword"
              v-model="confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              class="form-control" 
              placeholder="Repeat your password" 
              required 
              :disabled="loading"
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="loading"
            >
              <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          <i class="bi bi-exclamation-circle"></i>
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success">
          <i class="bi bi-check-circle"></i>
          {{ success }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary btn-submit" 
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Signing up...
          </span>
          <span v-else>
            <i class="bi bi-person-plus"></i> Sign Up
          </span>
        </button>
      </form>

      <div class="auth-footer">
        <p>Already have an account? 
          <router-link to="/login" class="auth-link">Sign in here</router-link>
        </p>
      </div>
    </div>

    <div class="auth-background">
      <div class="background-shape shape-1"></div>
      <div class="background-shape shape-2"></div>
      <div class="background-shape shape-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isFormValid = computed(() => {
  return firstName.value.trim() && 
         lastName.value.trim() && 
         email.value.trim() && 
         password.value && 
         confirmPassword.value
})

async function handleRegister () {
  error.value = ''
  success.value = ''

  // Client-side validations
  if (!isFormValid.value) {
    error.value = 'Please fill in all fields'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long'
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
    success.value = 'Registration completed successfully! Redirecting to login...'
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
   
  } catch (err) {
    const msg =
      (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.map(e => e.msg).join(', ')) ||
      err?.response?.data?.message ||
      (typeof err?.message === 'string' ? err.message : 'Registration failed')
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.auth-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  position: relative;
  z-index: 10;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.auth-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #6c757d;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.form-group label i {
  color: #667eea;
}

.form-control {
  padding: 0.875rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.form-text {
  color: #6c757d;
  font-size: 0.85rem;
}

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper .form-control {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.25rem;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #667eea;
}

.alert {
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.btn-submit {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-submit:hover::before {
  left: 100%;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  background: linear-gradient(135deg, #5568d3 0%, #653a8e 100%);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-submit i {
  font-size: 1.2rem;
}

.auth-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #dee2e6;
}

.auth-footer p {
  color: #6c757d;
  margin: 0;
}

.auth-link {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
}

.auth-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.auth-link:hover {
  color: #764ba2;
  background: rgba(102, 126, 234, 0.1);
}

.auth-link:hover::after {
  width: 100%;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

.background-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -100px;
  left: -100px;
}

.shape-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  bottom: -150px;
  right: -150px;
  animation-delay: -5s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(50px, 50px) scale(1.1);
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .auth-card {
    padding: 2rem 1.5rem;
  }

  .auth-header h2 {
    font-size: 1.5rem;
  }
}
</style>
