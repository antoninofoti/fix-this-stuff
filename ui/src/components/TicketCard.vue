<template>
  <div class="card mb-3">
    <div class="card-header">
      <h5 class="card-title mb-0">
        <router-link :to="`/tickets/${ticketData.id}`" class="unstyled-link">
            Ticket #{{ ticketData.id }} - {{ ticketData.title }}
        </router-link>
      </h5>
    </div>

    <div class="card-body">
      <p class="card-text"><strong>Description:</strong> {{ ticketData.description }}</p>
      <p class="card-text"><strong>Priority:</strong> {{ ticketData.priority }}</p>
      <p class="card-text"><strong>Category:</strong> {{ ticketData.category }}</p>
    </div>
</div>
</template>

<script setup>
    defineProps({
        ticketData: {
            type: Object,
            required: true
        },
    })
</script>

<style>
    .unstyled-link {
    color: inherit;
    text-decoration: none;
    }

    .unstyled-link:hover {
    text-decoration: underline; /* Optional hover effect */
    }
</style>