<template>
  <div class="container mt-5">
    <h2>{{ email }} [{{ role }}]</h2>
  </div>
</template>
  
<script setup>
  import { onMounted } from 'vue'
  import { computed } from 'vue'
  import { useAuthStore } from '../store/auth'
  import { useTicketStore } from '../store/ticket'

  const authStore = useAuthStore()
  const ticketStore = useTicketStore()


  onMounted(async () => {
    try {
      await ticketStore.fetchAllTickets()
    } catch (error) {
      console.error(error)
    }
  })

  const tickets = computed(() => ticketStore.getTickets)
  const email = computed(() => authStore.getEmail)
  const role = computed(() => authStore.getRole)
</script>