<script lang="ts">
  import { isLoggedIn, logout } from '$lib/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let title = "";
  let markdown = "";
  let mockups = [{ title: "", html: "" }]; // Start with one empty mockup
  let password = "";
  let link = "";
  let loading = false;

  // Redirect if not logged in
  onMount(() => {
    if (!$isLoggedIn) {
      goto('/login');
    }
  });

  function addMockup() {
    if (mockups.length < 5) {
      mockups = [...mockups, { title: "", html: "" }];
    }
  }

  function removeMockup(index: number) {
    if (mockups.length > 1) {
      mockups = mockups.filter((_, i) => i !== index);
    }
  }

  async function submit() {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!password.trim()) {
      alert('Please enter a password for the proposal');
      return;
    }

    // Filter out empty mockups and validate
    const validMockups = mockups.filter(m => m.title.trim() && m.html.trim());
    
    if (validMockups.length === 0) {
      alert('Please add at least one mockup with both title and HTML content');
      return;
    }
    
    if (validMockups.length > 5) {
      alert('Maximum 5 mockups allowed');
      return;
    }
    
    // Check for duplicate mockup titles
    const titles = validMockups.map(m => m.title.trim().toLowerCase());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      alert('Each mockup must have a unique title');
      return;
    }

    loading = true;
    const adminKey = 'test123'; // We know they're logged in, so use the test key
    
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, markdown, mockups: validMockups, password, adminKey })
    });
    
    const data = await res.json();
    if (res.ok) {
      link = `${window.location.origin}/p/${data.id}`;
      // Clear form
      title = "";
      markdown = "";
      mockups = [{ title: "", html: "" }];
      password = "";
    } else {
      alert(data.error || "Failed to save");
    }
    
    loading = false;
  }

  function handleLogout() {
    logout();
    goto('/');
  }
</script>

<div class="container">
  <header class="page-header">
    <h1>Create Proposal</h1>
    <div class="header-actions">
      <a href="/admin" class="btn btn-outline">← Back to Dashboard</a>
      <button on:click={handleLogout} class="btn btn-secondary">Logout</button>
    </div>
  </header>
  
  <div class="form-group">
    <label for="title">Proposal Title *</label>
    <input id="title" placeholder="Enter proposal title" bind:value={title} />
  </div>

  <div class="form-group">
    <h3>Proposal (Markdown)</h3>
    <textarea placeholder="Markdown content" bind:value={markdown}></textarea>
    <small>Tip: Use ```mermaid code blocks for diagrams</small>
  </div>

  <div class="form-group">
    <div class="mockups-header">
      <h3>HTML Mockups (max 5)</h3>
      <button type="button" on:click={addMockup} disabled={mockups.length >= 5} class="btn-add">
        + Add Mockup
      </button>
    </div>
    
    {#each mockups as mockup, index}
      <div class="mockup-item">
        <div class="mockup-header">
          <div class="mockup-title">
            <label for="mockup-title-{index}">Mockup {index + 1} Title *</label>
            <input 
              id="mockup-title-{index}"
              placeholder="e.g. Mobile Mockup, Dashboard Mockup" 
              bind:value={mockup.title}
              maxlength="50"
            />
          </div>
          {#if mockups.length > 1}
            <button 
              type="button" 
              on:click={() => removeMockup(index)} 
              class="btn-remove"
              title="Remove this mockup"
            >
              ✕
            </button>
          {/if}
        </div>
        <textarea 
          placeholder="HTML content for {mockup.title || 'this mockup'}" 
          bind:value={mockup.html}
        ></textarea>
      </div>
    {/each}
  </div>

  <div class="form-group">
    <label for="password">Proposal Password *</label>
    <input id="password" placeholder="Password for viewing this proposal" type="password" bind:value={password} />
    <small>This password will be required to view the proposal</small>
  </div>
  
  <button on:click={submit} disabled={loading} class:loading>
    {loading ? 'Saving...' : 'Create Proposal'}
  </button>

  {#if link}
    <div class="link-result">
      <p>Share this link: <a href={link} target="_blank">{link}</a></p>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .page-header h1 {
    margin: 0;
    color: #2d3748;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
  }
  
  input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  
  input:focus, textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
  
  textarea {
    min-height: 150px;
    resize: vertical;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
  
  small {
    display: block;
    margin-top: 0.25rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  button, .btn {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.9rem;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.2s;
    display: inline-block;
    text-align: center;
  }
  
  button {
    background: #667eea;
    color: white;
    border-color: #667eea;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
  }
  
  button:hover:not(:disabled) {
    background: #5a67d8;
    border-color: #5a67d8;
  }
  
  button:disabled {
    background: #a0aec0;
    border-color: #a0aec0;
    cursor: not-allowed;
  }
  
  button.loading {
    background: #a0aec0;
    border-color: #a0aec0;
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
  
  .btn-secondary {
    background: #718096;
    color: white;
    border-color: #718096;
  }
  
  .btn-secondary:hover {
    background: #4a5568;
    border-color: #4a5568;
  }
  
  .link-result {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f0fff4;
    border: 1px solid #c6f6d5;
    border-radius: 4px;
  }
  
  .link-result a {
    color: #38a169;
    font-weight: 600;
  }
  
  h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }
  
  /* Mockups section styling */
  .mockups-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .btn-add {
    background: #48bb78;
    color: white;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-add:hover:not(:disabled) {
    background: #38a169;
  }
  
  .btn-add:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
  
  .mockup-item {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
    background: #f9fafb;
  }
  
  .mockup-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 0.75rem;
    gap: 1rem;
  }
  
  .mockup-title {
    flex: 1;
  }
  
  .mockup-title label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .mockup-title input {
    width: 100%;
  }
  
  .btn-remove {
    background: #f56565;
    color: white;
    border: none;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .btn-remove:hover {
    background: #e53e3e;
  }
  
  .mockup-item textarea {
    margin-top: 0.5rem;
  }
</style>