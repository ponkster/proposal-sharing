<script lang="ts">
  import { isLoggedIn, logout } from '$lib/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let proposals: Array<{id: string, title: string, createdAt: string}> = [];
  let loading = true;
  let error = '';
  let deleteModal = { show: false, proposalId: '', proposalTitle: '' };
  let deletingId = '';

  // Redirect if not logged in
  onMount(async () => {
    if (!$isLoggedIn) {
      goto('/login');
      return;
    }
    
    await loadProposals();
  });

  async function loadProposals() {
    try {
      // Get admin key from env (we'll need to pass it)
      const adminKey = sessionStorage.getItem('admin_key') || 'Eyjafjall@j0k3wl!'; // temporary production fix
      
      const res = await fetch('/api/proposals/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey })
      });

      const data = await res.json();

      if (res.ok) {
        proposals = data.proposals;
      } else {
        error = data.error || 'Failed to load proposals';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleLogout() {
    logout();
    goto('/');
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function copyLink(proposalId: string) {
    const link = `${window.location.origin}/p/${proposalId}`;
    navigator.clipboard.writeText(link);
    
    // Show temporary feedback
    const btn = document.getElementById(`copy-${proposalId}`);
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  }

  function showDeleteConfirmation(proposalId: string, proposalTitle: string) {
    deleteModal = { show: true, proposalId, proposalTitle };
  }

  function hideDeleteConfirmation() {
    deleteModal = { show: false, proposalId: '', proposalTitle: '' };
  }

  async function confirmDelete() {
    if (!deleteModal.proposalId) return;
    
    deletingId = deleteModal.proposalId;
    
    try {
      const adminKey = 'test123'; // We know they're logged in
      
      const res = await fetch(`/api/proposals/${deleteModal.proposalId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey })
      });

      const data = await res.json();

      if (res.ok) {
        // Remove from proposals list
        proposals = proposals.filter(p => p.id !== deleteModal.proposalId);
        hideDeleteConfirmation();
      } else {
        error = data.error || 'Failed to delete proposal';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      deletingId = '';
    }
  }
</script>

<div class="admin-container">
  <header class="admin-header">
    <h1>Proposal Management Dashboard</h1>
    <div class="header-actions">
      <a href="/create" class="btn btn-primary">Create New Proposal</a>
      <button on:click={handleLogout} class="btn btn-secondary">Logout</button>
    </div>
  </header>

  {#if loading}
    <div class="loading">Loading proposals...</div>
  {:else if error}
    <div class="error">{error}</div>
    <button on:click={loadProposals} class="btn btn-primary">Retry</button>
  {:else}
    <div class="proposals-section">
      <h2>Your Proposals ({proposals.length})</h2>
      
      {#if proposals.length === 0}
        <div class="empty-state">
          <h3>No proposals yet</h3>
          <p>Create your first proposal to get started.</p>
          <a href="/create" class="btn btn-primary">Create Proposal</a>
        </div>
      {:else}
        <div class="proposals-grid">
          {#each proposals as proposal}
            <div class="proposal-card">
              <div class="proposal-header">
                <h3>{proposal.title || 'Untitled Proposal'}</h3>
                <span class="proposal-date">{formatDate(proposal.createdAt)}</span>
              </div>
              
              <div class="proposal-actions">
                <a href="/p/{proposal.id}" class="btn btn-outline" target="_blank">
                  View Proposal
                </a>
                <button 
                  id="copy-{proposal.id}"
                  on:click={() => copyLink(proposal.id)} 
                  class="btn btn-outline"
                >
                  Copy Link
                </button>
                <a href="/edit/{proposal.id}" class="btn btn-outline">
                  Edit
                </a>
                <button 
                  on:click={() => showDeleteConfirmation(proposal.id, proposal.title)} 
                  class="btn btn-danger"
                  disabled={deletingId === proposal.id}
                >
                  {deletingId === proposal.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if deleteModal.show}
  <div class="modal-overlay" on:click={hideDeleteConfirmation}>
    <div class="modal" on:click|stopPropagation>
      <h3>Confirm Deletion</h3>
      <p>
        Are you sure you want to delete the proposal 
        <strong>"{deleteModal.proposalTitle || 'Untitled Proposal'}"</strong>?
      </p>
      <p class="warning">This action cannot be undone.</p>
      
      <div class="modal-actions">
        <button on:click={hideDeleteConfirmation} class="btn btn-outline">
          Cancel
        </button>
        <button on:click={confirmDelete} class="btn btn-danger" disabled={!!deletingId}>
          {deletingId ? 'Deleting...' : 'Delete Proposal'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .admin-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    background: #f8f9fa;
  }
  
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .admin-header h1 {
    margin: 0;
    color: #2d3748;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
  }
  
  .loading, .error {
    text-align: center;
    padding: 2rem;
    margin: 2rem 0;
  }
  
  .error {
    color: #e53e3e;
    background: #fed7d7;
    border-radius: 8px;
  }
  
  .loading {
    color: #4a5568;
    font-size: 1.1rem;
  }
  
  .proposals-section h2 {
    margin-bottom: 1.5rem;
    color: #2d3748;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 8px;
    border: 2px dashed #e2e8f0;
  }
  
  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: #4a5568;
  }
  
  .empty-state p {
    color: #718096;
    margin-bottom: 1.5rem;
  }
  
  .proposals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .proposal-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .proposal-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .proposal-header {
    margin-bottom: 1rem;
  }
  
  .proposal-header h3 {
    margin: 0 0 0.5rem 0;
    color: #2d3748;
    font-size: 1.1rem;
    line-height: 1.3;
  }
  
  .proposal-date {
    color: #718096;
    font-size: 0.9rem;
  }
  
  .proposal-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.9rem;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.2s;
    display: inline-block;
    text-align: center;
  }
  
  .btn-primary {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }
  
  .btn-primary:hover {
    background: #5a67d8;
    border-color: #5a67d8;
  }
  
  .btn-secondary {
    background: #718096;
    color: white;
    border-color: #718096;
  }
  
  .btn-secondary:hover {
    background: #4a5568;
    border-color: #4a5568;
  }
  
  .btn-outline {
    background: transparent;
    color: #4a5568;
    border-color: #e2e8f0;
  }
  
  .btn-outline:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }
  
  .btn-danger {
    background: #e53e3e;
    color: white;
    border-color: #e53e3e;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #c53030;
    border-color: #c53030;
  }
  
  .btn-danger:disabled {
    background: #fc8181;
    border-color: #fc8181;
    cursor: not-allowed;
  }
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  
  .modal h3 {
    margin: 0 0 1rem 0;
    color: #2d3748;
    font-size: 1.25rem;
  }
  
  .modal p {
    margin-bottom: 1rem;
    color: #4a5568;
    line-height: 1.5;
  }
  
  .modal .warning {
    color: #e53e3e;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  .modal-actions .btn {
    min-width: 100px;
  }
</style>