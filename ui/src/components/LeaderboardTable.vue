<template>
  <div class="leaderboard-container">
    <div class="leaderboard-header">
      <h2><i class="bi bi-trophy-fill"></i> Developer Leaderboard</h2>
      <p class="subtitle">Top developers ranked by points and performance</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading leaderboard...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <p>{{ error }}</p>
      <button @click="loadLeaderboard" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="leaderboard.length === 0" class="empty-state">
      <i class="bi bi-inbox"></i>
      <p>No developers on the leaderboard yet.</p>
    </div>

    <div v-else class="leaderboard-table">
      <table>
        <thead>
          <tr>
            <th class="rank-col">Rank</th>
            <th class="name-col">Developer</th>
            <th class="points-col">Points</th>
            <th class="tickets-col">Tickets Resolved</th>
            <th class="rating-col">Avg Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(developer, index) in leaderboard"
            :key="developer.developer_id"
            :class="['leaderboard-row', getRankClass(index)]"
          >
            <td class="rank-col">
              <div class="rank-badge">
                <i v-if="index === 0" class="bi bi-trophy-fill gold"></i>
                <i v-else-if="index === 1" class="bi bi-trophy-fill silver"></i>
                <i v-else-if="index === 2" class="bi bi-trophy-fill bronze"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
            </td>
            <td class="name-col">
              <div class="developer-info">
                <div class="avatar">{{ getInitials(developer.developer_name) }}</div>
                <div class="developer-details">
                  <span class="name">{{ developer.developer_name }}</span>
                  <span class="email">{{ developer.developer_email }}</span>
                </div>
              </div>
            </td>
            <td class="points-col">
              <span class="points-value">
                <i class="bi bi-star-fill"></i>
                {{ developer.total_points }}
              </span>
            </td>
            <td class="tickets-col">
              <span class="tickets-value">{{ developer.tickets_resolved }}</span>
            </td>
            <td class="rating-col">
              <div class="rating-display">
                <i class="bi bi-heart-fill"></i>
                <span>{{ formatRating(developer.average_rating) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="leaderboard.length > 0" class="leaderboard-footer">
      <button v-if="!showAll && totalDevelopers > limit" @click="loadMore" class="load-more-btn">
        Show More <i class="bi bi-chevron-down"></i>
      </button>
      <p class="total-count">Showing {{ leaderboard.length }} of {{ totalDevelopers }} developers</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLeaderboard } from '../api/ticket.js'

const leaderboard = ref([])
const loading = ref(true)
const error = ref(null)
const limit = ref(10)
const showAll = ref(false)
const totalDevelopers = ref(0)

const loadLeaderboard = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await getLeaderboard(limit.value)
    leaderboard.value = response.data.leaderboard || []
    totalDevelopers.value = response.data.total || leaderboard.value.length
  } catch (err) {
    console.error('Error loading leaderboard:', err)
    error.value = err.response?.data?.error || 'Failed to load leaderboard'
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  limit.value = 50
  showAll.value = true
  loadLeaderboard()
}

const getRankClass = (index) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const formatRating = (rating) => {
  if (!rating || rating === 0) return 'N/A'
  return Number(rating).toFixed(1)
}

onMounted(() => {
  loadLeaderboard()
})
</script>

<style scoped>
.leaderboard-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.leaderboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.leaderboard-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.leaderboard-header h2 i {
  font-size: 2.5rem;
  color: #ffd700;
}

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
}

.loading-state,
.error-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #6c757d;
}

.loading-state .spinner-border {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.error-state i,
.empty-state i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
  display: block;
}

.empty-state i {
  color: #6c757d;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

.leaderboard-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.rank-col {
  width: 80px;
  text-align: center;
}

.points-col,
.tickets-col,
.rating-col {
  text-align: center;
}

tbody tr {
  border-bottom: 1px solid #f1f3f5;
  transition: all 0.3s ease;
}

tbody tr:hover {
  background: #f8f9fa;
  transform: scale(1.01);
}

.leaderboard-row.rank-1 {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%);
}

.leaderboard-row.rank-2 {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.1) 0%, transparent 100%);
}

.leaderboard-row.rank-3 {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.1) 0%, transparent 100%);
}

td {
  padding: 1.25rem 1rem;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
}

.rank-badge i {
  font-size: 1.5rem;
}

.rank-badge i.gold {
  color: #ffd700;
}

.rank-badge i.silver {
  color: #c0c0c0;
}

.rank-badge i.bronze {
  color: #cd7f32;
}

.developer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.developer-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.developer-details .name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
}

.developer-details .email {
  font-size: 0.85rem;
  color: #6c757d;
}

.points-value {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
}

.points-value i {
  color: #ffd700;
}

.tickets-value {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #e7f1ff;
  color: #0d6efd;
  border-radius: 20px;
  font-weight: 600;
}

.rating-display {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffe7e7;
  color: #dc3545;
  border-radius: 20px;
  font-weight: 600;
}

.rating-display i {
  color: #dc3545;
}

.leaderboard-footer {
  padding: 1.5rem;
  text-align: center;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.load-more-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.total-count {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .leaderboard-header h2 {
    font-size: 1.5rem;
  }

  table {
    font-size: 0.9rem;
  }

  th,
  td {
    padding: 0.75rem 0.5rem;
  }

  .developer-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .avatar {
    width: 35px;
    height: 35px;
    font-size: 0.8rem;
  }

  .email {
    display: none;
  }
}
</style>
