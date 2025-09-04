<div class="container">
  <h1>Proposal Sharing App</h1>
  <p>A secure way to share password-protected proposals with Markdown content and HTML mockups.</p>
  
  <div class="nav-links">
    <a href="/login" class="button button-primary">Admin Login</a>
    <a href="/admin" class="button button-secondary">Dashboard</a>
  </div>
  
  <div class="features">
    <h2>Features</h2>
    <ul>
      <li>📝 Write proposals in Markdown</li>
      <li>🎨 Include HTML mockups</li>
      <li>🔐 Password protection for each proposal</li>
      <li>📱 Responsive design with tab navigation</li>
      <li>🔗 Easy sharing with generated links</li>
    </ul>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
  }
  
  .nav-links {
    margin: 2rem 0;
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    transition: all 0.2s;
  }
  
  .button-primary {
    background: #667eea;
    color: white;
  }
  
  .button-primary:hover {
    background: #5a67d8;
  }
  
  .button-secondary {
    background: transparent;
    color: #667eea;
    border: 2px solid #667eea;
  }
  
  .button-secondary:hover {
    background: #667eea;
    color: white;
  }
  
  .features {
    margin-top: 3rem;
    text-align: left;
  }
  
  .features h2 {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .features ul {
    list-style: none;
    padding: 0;
  }
  
  .features li {
    padding: 0.5rem 0;
    font-size: 1.1rem;
  }
  
  h1 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    font-size: 1.1rem;
    line-height: 1.6;
  }
</style>
