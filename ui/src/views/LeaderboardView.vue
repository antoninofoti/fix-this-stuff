<template>
  <div class="leaderboard-container">
    <div class="leaderboard-header">
      <h1>🏆 User Leaderboard</h1>
      <p class="subtitle">Top contributors in our community</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading leaderboard...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadLeaderboard" class="retry-button">Retry</button>
    </div>

    <div v-else class="leaderboard-content">
      <div class="leaderboard-info">
        <p>Total users in leaderboard: <strong>{{ leaderboard.length }}</strong></p>
        <div class="filter-controls">
          <label for="limit-select">Show:</label>
          <select id="limit-select" v-model="selectedLimit" @change="loadLeaderboard">
            <option :value="10">Top 10</option>
            <option :value="25">Top 25</option>
            <option :value="50">Top 50</option>
            <option :value="100">Top 100</option>
          </select>
        </div>
      </div>

      <div class="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th class="position-col">Pos.</th>
              <th class="medal-col"></th>
              <th class="name-col">User</th>
              <th class="role-col">Role</th>
              <th class="score-col">Score</th>
              <th class="date-col">Member since</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="user in leaderboard" 
              :key="user.id" 
              :class="{ 'top-three': user.position <= 3, 'current-user': isCurrentUser(user.id) }"
            >
              <td class="position">{{ user.position }}</td>
              <td class="medal">
                <span v-if="user.position === 1" class="medal-icon gold">🥇</span>
                <span v-else-if="user.position === 2" class="medal-icon silver">🥈</span>
                <span v-else-if="user.position === 3" class="medal-icon bronze">🥉</span>
              </td>
              <td class="name">
                <div class="user-info">
                  <div class="avatar">{{ getInitials(user.name, user.surname) }}</div>
                  <div class="user-details">
                    <span class="full-name">{{ user.name }} {{ user.surname }}</span>
                    <span class="email">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td class="role">
                <span :class="['role-badge', `role-${user.role}`]">
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="score">
                <span class="score-value">{{ user.rank || 0 }}</span>
                <span class="score-label">points</span>
              </td>
              <td class="date">{{ formatDate(user.registration_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="leaderboard.length === 0" class="no-data">
        <p>No users in the leaderboard yet.</p>
      </div>
    </div>

    <div class="leaderboard-footer">
      <div class="info-box">
        <h3>💡 How does scoring work?</h3>
        <ul>
          <li>Resolve tickets to earn points</li>
          <li>Receive positive ratings from requesters</li>
          <li>The more tickets you successfully resolve, the more points you accumulate</li>
          <li>Ratings from 1 to 5 stars contribute to your score</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { getLeaderboard } from '../api/user';
import { useAuthStore } from '../store/auth';

export default {
  name: 'LeaderboardView',
  setup() {
    const leaderboard = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedLimit = ref(10);
    const authStore = useAuthStore();

    const currentUserId = computed(() => authStore.userId);

    const loadLeaderboard = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await getLeaderboard(selectedLimit.value);
        leaderboard.value = response.leaderboard || [];
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        error.value = 'Unable to load the leaderboard. Please try again later.';
      } finally {
        loading.value = false;
      }
    };

    const isCurrentUser = (userId) => {
      return currentUserId.value && parseInt(currentUserId.value) === parseInt(userId);
    };

    const getInitials = (name, surname) => {
      return `${name?.charAt(0) || ''}${surname?.charAt(0) || ''}`.toUpperCase();
    };

    const getRoleLabel = (role) => {
      const roleLabels = {
        admin: 'Admin',
        moderator: 'Moderator',
        developer: 'Developer'
      };
      return roleLabels[role] || role;
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    onMounted(() => {
      loadLeaderboard();
    });

    return {
      leaderboard,
      loading,
      error,
      selectedLimit,
      loadLeaderboard,
      isCurrentUser,
      getInitials,
      getRoleLabel,
      formatDate
    };
  }
};
</script>

<style scoped>
.leaderboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.leaderboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.leaderboard-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 2rem;
  background-color: #fee;
  border-radius: 8px;
  color: #c33;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}

.retry-button:hover {
  background-color: #2980b9;
}

.leaderboard-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-controls select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
}

.leaderboard-table {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #34495e;
  color: white;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.position-col { width: 60px; text-align: center; }
.medal-col { width: 50px; text-align: center; }
.name-col { width: 35%; }
.role-col { width: 15%; }
.score-col { width: 15%; text-align: center; }
.date-col { width: 15%; }

tbody tr {
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s;
}

tbody tr:hover {
  background-color: #f8f9fa;
}

tbody tr.top-three {
  background-color: #fff9e6;
}

tbody tr.current-user {
  background-color: #e3f2fd;
  font-weight: 500;
}

td {
  padding: 1rem;
}

.position {
  text-align: center;
  font-weight: bold;
  font-size: 1.1rem;
  color: #7f8c8d;
}

.medal {
  text-align: center;
}

.medal-icon {
  font-size: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.full-name {
  font-weight: 600;
  color: #2c3e50;
}

.email {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.role-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-admin {
  background-color: #e74c3c;
  color: white;
}

.role-moderator {
  background-color: #f39c12;
  color: white;
}

.role-developer {
  background-color: #3498db;
  color: white;
}

.score {
  text-align: center;
}

.score-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #27ae60;
}

.score-label {
  display: block;
  font-size: 0.75rem;
  color: #7f8c8d;
  text-transform: uppercase;
}

.date {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.leaderboard-footer {
  margin-top: 3rem;
}

.info-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.info-box h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.info-box ul {
  list-style: none;
  padding: 0;
}

.info-box li {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
}

.info-box li:before {
  content: "✓";
  position: absolute;
  left: 0;
  font-weight: bold;
  color: #2ecc71;
}

@media (max-width: 768px) {
  .leaderboard-container {
    padding: 1rem;
  }

  .leaderboard-header h1 {
    font-size: 2rem;
  }

  .leaderboard-info {
    flex-direction: column;
    gap: 1rem;
  }

  table {
    font-size: 0.9rem;
  }

  th, td {
    padding: 0.5rem;
  }

  .user-info {
    gap: 0.5rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }

  .email {
    display: none;
  }
}
</style>
