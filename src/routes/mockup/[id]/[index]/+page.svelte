<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  let password = "";
  let error = "";
  let loading = false;

  const proposalId = $page.params.id;
  const mockupIndex = $page.params.index;

  async function unlockMockup() {
    if (!password) {
      error = "Password is required";
      return;
    }

    loading = true;
    error = "";

    try {
      // Redirect to the API endpoint with password
      const mockupUrl = `/api/mockup/${proposalId}/${mockupIndex}?password=${encodeURIComponent(password)}`;
      window.location.href = mockupUrl;
    } catch (err) {
      error = "Failed to access mockup";
      loading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      unlockMockup();
    }
  }

  onMount(() => {
    // Focus password input when page loads
    const passwordInput = document.getElementById('password-input') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.focus();
    }
  });
</script>

<div class="container">
  <div class="unlock-container">
    <h1>🔒 Mockup Access</h1>
    <p class="description">Enter the password to view this mockup</p>
    
    <div class="unlock-form">
      <input 
        id="password-input"
        type="password" 
        bind:value={password} 
        placeholder="Enter password"
        on:keypress={handleKeyPress}
        disabled={loading}
      />
      <button 
        on:click={unlockMockup}
        disabled={loading || !password}
        class="unlock-btn"
      >
        {#if loading}
          Accessing...
        {:else}
          View Mockup
        {/if}
      </button>
    </div>
    
    {#if error}
      <p class="error">{error}</p>
    {/if}
    
    <div class="info">
      <p>📋 Proposal ID: <code>{proposalId}</code></p>
      <p>🎨 Mockup Index: <code>{mockupIndex}</code></p>
    </div>
  </div>
</div>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .unlock-container {
    background: white;
    padding: 3rem 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    text-align: center;
    max-width: 400px;
    width: 100%;
    margin: 1rem;
  }
  
  h1 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 2rem;
    font-weight: 600;
  }
  
  .description {
    color: #666;
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
  }
  
  .unlock-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .unlock-form input {
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    background: #f8f9fa;
  }
  
  .unlock-form input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .unlock-form input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .unlock-btn {
    background: #667eea;
    color: white;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .unlock-btn:hover:not(:disabled) {
    background: #5a67d8;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
  
  .unlock-btn:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .error {
    color: #e53e3e;
    background: #fed7d7;
    padding: 0.75rem;
    border-radius: 6px;
    margin: 1rem 0;
    font-weight: 500;
  }
  
  .info {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .info p {
    margin: 0.5rem 0;
  }
  
  .info code {
    background: #f1f1f1;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    color: #333;
    font-weight: 600;
  }
</style>