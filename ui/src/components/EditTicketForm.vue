<template>
  <div class="edit-ticket-form">
    <h3 class="mb-4"><i class="bi bi-pencil"></i> Edit Ticket</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group mb-3">
        <label for="title"><i class="bi bi-card-heading"></i> Title</label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          class="form-control"
          required
          :disabled="isSubmitting"
        />
      </div>

      <div class="form-group mb-3">
        <label for="description"><i class="bi bi-text-paragraph"></i> Description</label>
        <textarea
          id="description"
          v-model="formData.description"
          class="form-control"
          rows="5"
          required
          :disabled="isSubmitting"
        ></textarea>
        <small class="form-text">{{ formData.description.length }}/500 characters</small>
      </div>

      <div class="form-row mb-3">
        <div class="form-group">
          <label for="category"><i class="bi bi-tag"></i> Category / System</label>
          <select
            id="category"
            v-model.number="formData.category"
            class="form-select"
            required
            :disabled="isSubmitting"
          >
            <option value="1">System 1 - Web Application</option>
            <option value="2">System 2 - Mobile App</option>
            <option value="3">System 3 - API Backend</option>
            <option value="4">System 4 - Database</option>
            <option value="5">System 5 - Infrastructure</option>
          </select>
        </div>
      </div>

      <div class="form-group mb-3">
        <label for="priority"><i class="bi bi-exclamation-triangle"></i> Priority</label>
        <select 
          id="priority"
          v-model="formData.priority" 
          class="form-select priority-select" 
          required
          :disabled="isSubmitting"
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <small class="form-text text-muted">
          Changing priority will update the deadline: High (2 days), Medium (7 days), Low (14 days)
        </small>
      </div>

      <div v-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle"></i>
        {{ error }}
      </div>

      <div class="d-flex gap-2 justify-content-end">
        <button 
          type="button" 
          class="btn btn-secondary"
          @click="$emit('cancel')"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="isSubmitting || !isFormValid"
        >
          <span v-if="isSubmitting">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Saving...
          </span>
          <span v-else>
            <i class="bi bi-check-circle"></i> Save Changes
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTicketStore } from '../store/ticket'

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['updated', 'cancel'])

const ticketStore = useTicketStore()

const formData = ref({
  title: '',
  description: '',
  category: 1,
  priority: 'low'
})

const isSubmitting = ref(false)
const error = ref(null)

onMounted(() => {
  // Initialize form with ticket data
  formData.value = {
    title: props.ticket.title,
    description: props.ticket.request || props.ticket.description,
    category: props.ticket.system_id,
    priority: props.ticket.priority?.toLowerCase() || 'low'
  }
})

const isFormValid = computed(() => {
  return formData.value.title.trim().length > 0 &&
         formData.value.description.trim().length > 0 &&
         formData.value.category &&
         formData.value.priority
})

const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  error.value = null
  
  try {
    await ticketStore.updateTicket(props.ticket.id, {
      title: formData.value.title,
      description: formData.value.description,
      category: formData.value.category,
      priority: formData.value.priority
    })
    
    emit('updated')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update ticket'
    console.error('Error updating ticket:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.edit-ticket-form {
  width: 100%;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-control,
.form-select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  transition: border-color 0.3s;
}

.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-text {
  display: block;
  margin-top: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.priority-select option {
  padding: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
}

.alert {
  border-radius: 8px;
  padding: 1rem;
}

@media (max-width: 768px) {
  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
