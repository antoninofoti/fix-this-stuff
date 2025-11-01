<template>
  <h2>New Ticket</h2>
  <CreateTicketForm/>
  <h2>Existing Tickets</h2>
  <TicketCard v-for="ticket in tickets" :ticketData="ticket"/> 
</template>
  
<script setup>
  import CreateTicketForm from '../components/CreateTicketForm.vue'
  import TicketCard from '../components/TicketCard.vue'

  import { onMounted } from 'vue'
  import { computed } from 'vue'
  import { useTicketStore } from '../store/ticket'
  import { useAuthStore } from '../store/auth'
  import { useRouter } from 'vue-router'
  
  const ticketStore = useTicketStore()
  const authStore = useAuthStore()

  const router = useRouter()

  onMounted(async () => {
    try {
      await ticketStore.fetchAllTickets()
    } catch (error) {
      console.error(error)
    }
  })
  
  const tickets = computed(() => ticketStore.getTickets)
</script>