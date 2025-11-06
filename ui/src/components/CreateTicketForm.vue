<template>
  <form @submit.prevent="handleCreateTicket" class="modern-form">
    <div class="form-group">
      <label for="title"><i class="bi bi-card-heading"></i> Ticket Title</label>
      <input
        id="title"
        v-model="title"
        placeholder="Enter a descriptive title"
        required
        class="form-control"
        :disabled="isSubmitting"
      />
    </div>

    <div class="form-group">
      <label for="description"><i class="bi bi-text-paragraph"></i> Description</label>
      <textarea
        id="description"
        v-model="description"
        placeholder="Describe the problem in detail..."
        required
        class="form-control"
        rows="5"
        :disabled="isSubmitting"
      ></textarea>
      <small class="form-text">{{ description.length }}/500 characters</small>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="category"><i class="bi bi-tag"></i> Category / System</label>
        <select
          id="category"
          v-model.number="category"
          class="form-select"
          required
          :disabled="isSubmitting"
        >
          <option value="" disabled selected>Select a category</option>
          <option value="1">
            <i class="bi bi-globe"></i> System 1 - Web Application
          </option>
          <option value="2">
            <i class="bi bi-phone"></i> System 2 - Mobile App
          </option>
          <option value="3">
            <i class="bi bi-server"></i> System 3 - API Backend
          </option>
          <option value="4">
            <i class="bi bi-database"></i> System 4 - Database
          </option>
          <option value="5">
            <i class="bi bi-cloud"></i> System 5 - Infrastructure
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="priority"><i class="bi bi-exclamation-triangle"></i> Priority</label>
        <select 
          id="priority"
          v-model="priority" 
          class="form-select priority-select" 
          required
          :disabled="isSubmitting"
        >
          <option value="" disabled selected>Select priority</option>
          <option value="low" class="priority-low">🟢 Low</option>
          <option value="medium" class="priority-medium">🟡 Medium</option>
          <option value="high" class="priority-high">🔴 High</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">
      <i class="bi bi-exclamation-circle"></i>
      {{ error }}
    </div>

    <div v-if="success" class="alert alert-success">
      <i class="bi bi-check-circle"></i>
      Ticket created successfully!
    </div>

    <button 
      type="submit" 
      class="btn btn-primary btn-submit"
      :disabled="isSubmitting || !isFormValid"
    >
      <span v-if="isSubmitting">
        <span class="spinner-border spinner-border-sm me-2"></span>
        Creating...
      </span>
      <span v-else>
        <i class="bi bi-plus-circle"></i> Create Ticket
      </span>
    </button>
  </form>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { useTicketStore } from '../store/ticket';

  const ticketStore = useTicketStore()

  const title = ref('');
  const description = ref('');
  const category = ref(null);
  const priority = ref('');
  const error = ref('')
  const success = ref(false)
  const isSubmitting = ref(false)

  const isFormValid = computed(() => {
    return title.value.trim() && 
           description.value.trim() && 
           category.value && 
           priority.value
  })

  const emit = defineEmits(['ticketCreated'])

  const handleCreateTicket = async () => {
    if (!isFormValid.value) return

    error.value = '';
    success.value = false;
    isSubmitting.value = true;

    try {
        const newTicket = await ticketStore.createTicket({
          title: title.value,
          description: description.value,
          category: category.value,
          priority: priority.value,
        });
        
        // Show success message
        success.value = true;
        
        // Emit event to notify parent component
        emit('ticketCreated', newTicket);
        
        // Reset form
        title.value = '';
        description.value = '';
        category.value = null;
        priority.value = '';

        // Hide success message after 3 seconds
        setTimeout(() => {
          success.value = false;
        }, 3000);

    } catch (err) {
        if (err.response?.data?.errors?.length) {
          error.value = err.response.data.errors.map(e => e.msg).join(', ');
        } else if (err.response?.data?.message) {
          error.value = err.response.data.message;
        } else {
          error.value = 'Error creating ticket. Please try again.';
        }
    } finally {
        isSubmitting.value = false;
    }
  };
</script>

<style scoped>
.modern-form {
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
  font-size: 0.95rem;
}

.form-group label i {
  color: #667eea;
}

.form-control,
.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.form-control:focus,
.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.form-control:disabled,
.form-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

textarea.form-control {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.form-text {
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.priority-select option {
  padding: 0.5rem;
}

.alert {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease;
}

.alert i {
  font-size: 1.25rem;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>