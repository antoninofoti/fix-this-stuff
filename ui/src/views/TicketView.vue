<template>
  <div class="container mt-4">
    <div v-if="ticketData">
      <h2 class="mb-4">Ticket #{{ ticketData.id }} - {{ ticketData.title }}</h2>

      <div class="card">
        <div class="card-body">
          <p class="card-text"><strong>Description:</strong> {{ ticketData.description }}</p>
          <p class="card-text"><strong>Priority:</strong> {{ ticketData.priority }}</p>
          <p class="card-text"><strong>Category:</strong> {{ ticketData.category }}</p>
        </div>
      </div>
    </div>

    <div v-else>
      <p>Loading ticket details...</p>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useTicketStore } from '../store/ticket'

const ticketStore = useTicketStore()

const props = defineProps({
  ticketId: {
    type: String,
    required: true
  },
})

const fetchTicket = async (id) => {
  try {
    await ticketStore.fetchTicketByID(id)
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchTicket(props.ticketId)
})

watch(() => props.ticketId, (newId) => {
  fetchTicket(newId)
})

const ticketData = computed(() => ticketStore.getCurrentTicket)
</script>

<style scoped>
.card-text strong {
  width: 100px;
  display: inline-block;
}
</style>