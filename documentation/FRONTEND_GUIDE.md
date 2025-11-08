# Frontend Implementation Guide - Ticket Resolution & Leaderboard

Complete guide for implementing the ticket resolution system and leaderboard in the Vue.js frontend.

## API Client Methods

### File: `ui/src/api/ticket.js`

```javascript
// Request resolution approval (Developer)
export async function requestResolution(ticketId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/request-resolution`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// Approve resolution (Moderator/Admin)
export async function approveResolution(ticketId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/approve-resolution`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// Reject resolution (Moderator/Admin)
export async function rejectResolution(ticketId, reason) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/reject-resolution`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  return response.json();
}

// Get tickets pending approval (Moderator/Admin)
export async function getPendingApprovals() {
  const response = await fetch(`${API_BASE_URL}/tickets/admin/pending-approval`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
}

// Get leaderboard (Public)
export async function getLeaderboard(limit = 50) {
  const response = await fetch(`${API_BASE_URL}/tickets/leaderboard/top?limit=${limit}`);
  return response.json();
}

// Get developer statistics (Public)
export async function getDeveloperStats(developerId) {
  const response = await fetch(`${API_BASE_URL}/tickets/developers/${developerId}/stats`);
  return response.json();
}
```

## Component Implementation

### 1. Ticket Status Badge Component

**File: `ui/src/components/TicketStatusBadge.vue`**

```vue
<template>
  <div class="status-badges">
    <span :class="['badge', flagStatusClass]">
      {{ flagStatusText }}
    </span>
    
    <span :class="['badge', solveStatusClass]">
      {{ solveStatusText }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'TicketStatusBadge',
  props: {
    flagStatus: {
      type: String,
      required: true,
      validator: (value) => ['open', 'closed'].includes(value)
    },
    solveStatus: {
      type: String,
      required: true,
      validator: (value) => ['not_solved', 'pending_approval', 'solved'].includes(value)
    }
  },
  computed: {
    flagStatusClass() {
      return this.flagStatus === 'open' ? 'badge-success' : 'badge-secondary';
    },
    flagStatusText() {
      return this.flagStatus === 'open' ? 'Open' : 'Closed';
    },
    solveStatusClass() {
      const statusMap = {
        'not_solved': 'badge-danger',
        'pending_approval': 'badge-warning',
        'solved': 'badge-success'
      };
      return statusMap[this.solveStatus];
    },
    solveStatusText() {
      const statusMap = {
        'not_solved': 'Not Resolved',
        'pending_approval': 'Pending Approval',
        'solved': 'Resolved'
      };
      return statusMap[this.solveStatus];
    }
  }
};
</script>

<style scoped>
.status-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-success {
  background-color: #d1f2eb;
  color: #0f5132;
}

.badge-danger {
  background-color: #f8d7da;
  color: #842029;
}

.badge-warning {
  background-color: #fff3cd;
  color: #997404;
}

.badge-secondary {
  background-color: #e2e3e5;
  color: #41464b;
}
</style>
```

### 2. Ticket Action Buttons Component

**To be added in: `ui/src/components/TicketCard.vue` or `EditTicketForm.vue`**

```vue
<template>
  <div class="ticket-actions">
    <!-- Developer: Request Approval -->
    <button 
      v-if="canRequestResolution"
      @click="handleRequestResolution"
      class="btn btn-primary"
      :disabled="loading">
      Request Approval
    </button>
    
    <!-- Moderator/Admin: Approve -->
    <button 
      v-if="canApprove"
      @click="handleApprove"
      class="btn btn-success"
      :disabled="loading">
      Approve Resolution
    </button>
    
    <!-- Moderator/Admin: Reject -->
    <button 
      v-if="canReject"
      @click="showRejectModal"
      class="btn btn-danger"
      :disabled="loading">
      Reject Resolution
    </button>
  </div>
  
  <!-- Rejection Modal -->
  <div v-if="isRejectModalOpen" class="modal">
    <div class="modal-content">
      <h3>Reject Resolution</h3>
      <textarea 
        v-model="rejectionReason" 
        placeholder="Enter rejection reason..."
        rows="4"
        class="form-control"></textarea>
      <div class="modal-actions">
        <button @click="handleReject" class="btn btn-danger">Confirm Rejection</button>
        <button @click="isRejectModalOpen = false" class="btn btn-secondary">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import { requestResolution, approveResolution, rejectResolution } from '@/api/ticket';

export default {
  props: {
    ticket: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      isRejectModalOpen: false,
      rejectionReason: ''
    };
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
    canRequestResolution() {
      return (
        this.currentUser?.role === 'developer' &&
        this.ticket.assigned_developer_id === this.currentUser.id &&
        this.ticket.solve_status === 'not_solved' &&
        this.ticket.flag_status === 'open'
      );
    },
    canApprove() {
      return (
        ['moderator', 'admin'].includes(this.currentUser?.role) &&
        this.ticket.solve_status === 'pending_approval'
      );
    },
    canReject() {
      return this.canApprove;
    }
  },
  methods: {
    async handleRequestResolution() {
      if (!confirm('Are you sure you want to request approval?')) return;
      
      this.loading = true;
      try {
        const result = await requestResolution(this.ticket.id);
        this.$emit('ticket-updated', result.ticket);
        alert('Approval request submitted successfully!');
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    async handleApprove() {
      if (!confirm('Are you sure you want to approve this resolution?')) return;
      
      this.loading = true;
      try {
        const result = await approveResolution(this.ticket.id);
        this.$emit('ticket-updated', result.ticket);
        alert(`Resolution approved! Points awarded: ${result.pointsAwarded}`);
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    showRejectModal() {
      this.rejectionReason = '';
      this.isRejectModalOpen = true;
    },
    
    async handleReject() {
      if (!this.rejectionReason.trim()) {
        alert('Please enter a rejection reason');
        return;
      }
      
      this.loading = true;
      try {
        const result = await rejectResolution(this.ticket.id, this.rejectionReason);
        this.$emit('ticket-updated', result.ticket);
        this.isRejectModalOpen = false;
        alert('Resolution rejected');
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.ticket-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}
</style>
```

### 3. Leaderboard Table Component

**File: `ui/src/components/LeaderboardTable.vue`**

```vue
<template>
  <div class="leaderboard">
    <h2>Developer Leaderboard</h2>
    
    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <table v-else class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Developer</th>
          <th>Points</th>
          <th>Tickets Resolved</th>
          <th>Average Rating</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in leaderboard" :key="entry.developer_id" 
            :class="{ 'highlight': entry.developer_id === currentUserId }">
          <td class="rank">
            <span v-if="entry.rank === 1">1st</span>
            <span v-else-if="entry.rank === 2">2nd</span>
            <span v-else-if="entry.rank === 3">3rd</span>
            <span v-else>{{ entry.rank }}th</span>
          </td>
          <td class="name">{{ entry.name }}</td>
          <td class="points">{{ entry.total_points }}</td>
          <td class="tickets">{{ entry.tickets_resolved }}</td>
          <td class="rating">
            <span class="stars">{{ renderStars(entry.average_rating) }}</span>
            <span class="rating-value">({{ entry.average_rating.toFixed(2) }})</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { getLeaderboard } from '@/api/ticket';

export default {
  name: 'LeaderboardTable',
  props: {
    limit: {
      type: Number,
      default: 50
    }
  },
  data() {
    return {
      leaderboard: [],
      loading: true,
      error: null
    };
  },
  computed: {
    currentUserId() {
      return this.$store.state.auth.user?.id;
    }
  },
  mounted() {
    this.fetchLeaderboard();
  },
  methods: {
    async fetchLeaderboard() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await getLeaderboard(this.limit);
        this.leaderboard = response.leaderboard;
      } catch (error) {
        this.error = 'Error loading leaderboard';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    
    renderStars(rating) {
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
      
      return '★'.repeat(fullStars) + 
             (halfStar ? '½' : '') + 
             '☆'.repeat(emptyStars);
    }
  }
};
</script>

<style scoped>
.leaderboard {
  padding: 2rem;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.leaderboard-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.leaderboard-table tr:hover {
  background-color: #f8f9fa;
}

.leaderboard-table tr.highlight {
  background-color: #fff3cd;
  font-weight: 600;
}

.rank {
  font-size: 1.5rem;
  text-align: center;
  width: 80px;
}

.points {
  font-weight: 600;
  color: #0d6efd;
  font-size: 1.1rem;
}

.stars {
  font-size: 1.1rem;
  margin-right: 0.5rem;
  color: #ffc107;
}

.rating-value {
  color: #6c757d;
  font-size: 0.9rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #dc3545;
}
</style>
```

### 4. Leaderboard View

**File: `ui/src/views/LeaderboardView.vue`**

```vue
<template>
  <div class="leaderboard-view">
    <LeaderboardTable :limit="100" />
  </div>
</template>

<script>
import LeaderboardTable from '@/components/LeaderboardTable.vue';

export default {
  name: 'LeaderboardView',
  components: {
    LeaderboardTable
  }
};
</script>

<style scoped>
.leaderboard-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
```

### 5. Pending Approvals View (Moderator/Admin)

**File: `ui/src/views/PendingApprovalsView.vue`**

```vue
<template>
  <div class="pending-approvals">
    <h2>Tickets Pending Approval</h2>
    
    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="tickets.length === 0" class="empty">
      No tickets pending approval
    </div>
    
    <div v-else class="tickets-list">
      <TicketCard 
        v-for="ticket in tickets" 
        :key="ticket.id"
        :ticket="ticket"
        @ticket-updated="handleTicketUpdated" />
    </div>
  </div>
</template>

<script>
import { getPendingApprovals } from '@/api/ticket';
import TicketCard from '@/components/TicketCard.vue';

export default {
  name: 'PendingApprovalsView',
  components: {
    TicketCard
  },
  data() {
    return {
      tickets: [],
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchPendingApprovals();
  },
  methods: {
    async fetchPendingApprovals() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await getPendingApprovals();
        this.tickets = response.tickets;
      } catch (error) {
        this.error = 'Error loading pending tickets';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    
    handleTicketUpdated(updatedTicket) {
      // Remove ticket from list if no longer pending
      if (updatedTicket.solve_status !== 'pending_approval') {
        this.tickets = this.tickets.filter(t => t.id !== updatedTicket.id);
      }
    }
  }
};
</script>

<style scoped>
.pending-approvals {
  padding: 2rem;
}

.tickets-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
}
</style>
```

## Router Configuration

**File: `ui/src/router/index.js`**

```javascript
// Add these routes
{
  path: '/leaderboard',
  name: 'Leaderboard',
  component: () => import('@/views/LeaderboardView.vue'),
  meta: { public: true }  // Public, visible to all
},
{
  path: '/admin/pending-approvals',
  name: 'PendingApprovals',
  component: () => import('@/views/PendingApprovalsView.vue'),
  meta: { requiresAuth: true, roles: ['moderator', 'admin'] }
}
```

## Navigation Bar Updates

**File: `ui/src/components/Navbar.vue`**

```vue
<!-- Add to navigation menu -->
<router-link to="/leaderboard" class="nav-link">
  Leaderboard
</router-link>

<!-- Moderator/Admin only -->
<router-link 
  v-if="['moderator', 'admin'].includes(user?.role)"
  to="/admin/pending-approvals" 
  class="nav-link">
  Pending Approvals
  <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
</router-link>
```

## Implementation Checklist

- [ ] Add API methods to `api/ticket.js`
- [ ] Create `TicketStatusBadge.vue` component
- [ ] Add action buttons to `TicketCard.vue`
- [ ] Create `LeaderboardTable.vue` component
- [ ] Create `LeaderboardView.vue` view
- [ ] Create `PendingApprovalsView.vue` view
- [ ] Update router with new routes
- [ ] Update navbar with leaderboard link
- [ ] Test complete workflow
- [ ] Implement responsive design

## Important Implementation Notes

1. **Status Badge**: Use `TicketStatusBadge` in all ticket cards
2. **Conditional Buttons**: Display buttons only when user has appropriate permissions
3. **Public Leaderboard**: No authentication required for access
4. **Pending Approvals**: Only moderators and administrators can access
5. **Real-time Updates**: Consider WebSocket implementation for live updates (future enhancement)
6. **Notifications**: Implement toast notifications for approval/rejection feedback (future enhancement)

## Testing Guidelines

1. Test as developer: verify request approval button appears only for assigned tickets
2. Test as moderator: verify approve/reject buttons appear for pending tickets
3. Test public leaderboard access without authentication
4. Verify moderators do not appear in leaderboard
5. Test rejection reason validation (required field)
6. Verify points displayed after approval

---

Complete implementation guide ready for frontend development team.
