<script lang="ts">
  import { isLoggedIn } from '$lib/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let adminKey = '';
  let error = '';
  let loading = false;

  // Redirect if already logged in
  onMount(() => {
    if ($isLoggedIn) {
      goto('/admin');
    }
  });

  async function handleLogin() {
    if (!adminKey.trim()) {
      error = 'Please enter admin key';
      return;
    }

    loading = true;
    error = '';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey })
      });

      const data = await res.json();

      if (res.ok) {
        isLoggedIn.set(true);
        goto('/admin');
      } else {
        error = data.error || 'Login failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>Admin Login</h1>
    <p>Enter your admin key to access the proposal management system.</p>
    
    <div class="form-group">
      <input 
        type="password" 
        placeholder="Admin Key" 
        bind:value={adminKey}
        on:keypress={handleKeyPress}
        disabled={loading}
      />
    </div>
    
    {#if error}
      <div class="error">{error}</div>
    {/if}
    
    <button 
      on:click={handleLogin} 
      disabled={loading}
      class:loading
    >
      {loading ? 'Logging in...' : 'Login'}
    </button>
    
    <div class="back-link">
      <a href="/">← Back to Home</a>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
  }
  
  .login-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
  }
  
  h1 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.8rem;
  }
  
  p {
    color: #666;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  
  input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
  
  input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
  
  button {
    width: 100%;
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover:not(:disabled) {
    background: #5a67d8;
  }
  
  button:disabled {
    background: #a0a0a0;
    cursor: not-allowed;
  }
  
  button.loading {
    background: #a0a0a0;
  }
  
  .error {
    color: #e53e3e;
    background: #fed7d7;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .back-link {
    margin-top: 1.5rem;
  }
  
  .back-link a {
    color: #667eea;
    text-decoration: none;
    font-size: 0.9rem;
  }
  
  .back-link a:hover {
    text-decoration: underline;
  }
</style>