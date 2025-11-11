<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">
          <i class="bi bi-box-arrow-in-right"></i>
        </div>
        <h2>Sign In</h2>
        <p>Welcome back! Enter your credentials to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">
            <i class="bi bi-envelope"></i> Email
          </label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            placeholder="example@email.com" 
            class="form-control" 
            required 
            :disabled="isLoading"
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
              placeholder="Enter your password" 
              class="form-control" 
              required 
              :disabled="isLoading"
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="isLoading"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          <i class="bi bi-exclamation-circle"></i>
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary btn-submit"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Signing in...
          </span>
          <span v-else>
            <i class="bi bi-box-arrow-in-right"></i> Sign In
          </span>
        </button>
      </form>

      <div class="auth-footer">
        <p>Don't have an account? 
          <router-link to="/register" class="auth-link">Sign up now</router-link>
        </p>
        <div class="admin-link-section">
          <p class="admin-hint">
            <i class="bi bi-shield-lock"></i>
            Are you an administrator or moderator?
          </p>
          <router-link to="/admin" class="admin-link">
            <i class="bi bi-gear-fill"></i> Access Admin Panel
          </router-link>
        </div>
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

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

const isFormValid = computed(() => {
  return email.value.trim() && password.value.trim()
})

const handleLogin = async () => {
  if (!isFormValid.value) return

  error.value = ''
  isLoading.value = true

  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (err) {
    // Handle different error cases
    if (err?.response?.status === 401) {
      // Unauthorized - wrong credentials
      error.value = err?.response?.data?.message || 'Invalid email or password. Please check your credentials and try again.'
    } else if (err?.response?.status === 400) {
      // Bad request - validation errors
      const validationErrors = err?.response?.data?.errors
      if (Array.isArray(validationErrors)) {
        error.value = validationErrors.map(e => e.msg).join(', ')
      } else {
        error.value = err?.response?.data?.message || 'Invalid input. Please check your credentials.'
      }
    } else {
      // Other errors
      error.value = err?.response?.data?.message || err?.message || 'An error occurred during login. Please try again.'
    }
  } finally {
    isLoading.value = false
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
  max-width: 450px;
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
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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

.admin-link-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.admin-hint {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.admin-hint i {
  color: #e74c3c;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  text-decoration: none;
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
}

.admin-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
  background: linear-gradient(135deg, #d63031 0%, #b93629 100%);
  color: white;
}

.admin-link i {
  font-size: 1.1rem;
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

@media (max-width: 576px) {
  .auth-card {
    padding: 2rem 1.5rem;
  }

  .auth-header h2 {
    font-size: 1.5rem;
  }
}
</style>
