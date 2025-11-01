<template>
  <form @submit.prevent="handleCreateTicket">
      <input
        v-model="title"
        placeholder="Title"
        required
        class="form-control mb-2"
      />
      <textarea
        v-model="description"
        placeholder="Description"
        required
        class="form-control mb-2"
        rows="3"
      ></textarea>
      <select
        v-model.number="category"
        class="form-select mb-2"
        required
      >
        <option value="" disabled selected>Select Category/System</option>
        <option value="1">System 1 - Web Application</option>
        <option value="2">System 2 - Mobile App</option>
        <option value="3">System 3 - Backend API</option>
        <option value="4">System 4 - Database</option>
        <option value="5">System 5 - Infrastructure</option>
      </select>
    <select v-model="priority" class="form-select mb-2" id="priority" name="priority" required>
      <option value="" disabled selected>Select priority</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>

    <button type="submit" class="btn btn-primary">Create Ticket</button>
    <p v-if="error" style="color:red">{{ error }}</p>
  </form>
</template>

<script setup>
  import { ref } from 'vue';
  import { useTicketStore } from '../store/ticket';

  const ticketStore = useTicketStore()

  const title = ref('');
  const description = ref('');
  const category = ref(null); // Changed to null for number validation
  const priority = ref('');
  const error = ref('')

  const handleCreateTicket = async () => {
    error.value = '';

    try {
        await ticketStore.createTicket({
        title: title.value,
        description: description.value,
        category: category.value,
        priority: priority.value,
        });
        // Redirect or show success message
    } catch (err) {
        if (err.response?.data?.errors?.length) {
        // Combine multiple validation messages into one string
        error.value = err.response.data.errors.map(e => e.msg).join(', ');
        } else if (err.response?.data?.message) {
        error.value = err.response.data.message;
        } else if (err.response?.length) {
        error.value = 'Ticket creation failed. Please try again.';
        }
        error.value = err
    }
  };
</script>