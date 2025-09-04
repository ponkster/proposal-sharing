import type { RequestHandler } from "@sveltejs/kit";
import { dbGet, bcrypt } from "$lib/db";

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const password = url.searchParams.get('password');
    const { id, index } = params;
    const mockupIndex = parseInt(index);

    if (!password) {
      return new Response("Password is required", { status: 400 });
    }

    // Get the proposal
    const row = dbGet("SELECT * FROM proposals WHERE id = ?", id);

    if (!row) {
      return new Response("Proposal not found", { status: 404 });
    }

    // Verify password
    const ok = await bcrypt.compare(password, row.passwordHash);
    if (!ok) {
      return new Response("Wrong password", { status: 403 });
    }

    // Parse mockups
    let mockups = [];
    try {
      if (row.mockups) {
        mockups = JSON.parse(row.mockups);
      } else if (row.mockup) {
        // Backward compatibility
        mockups = [{ title: "Mockup", html: row.mockup }];
      }
    } catch (error) {
      console.error("Error parsing mockups:", error);
      mockups = row.mockup ? [{ title: "Mockup", html: row.mockup }] : [];
    }

    if (mockupIndex < 0 || mockupIndex >= mockups.length) {
      return new Response("Mockup not found", { status: 404 });
    }

    const mockup = mockups[mockupIndex];
    
    // Return the HTML content directly with enhanced form handling script
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mockup.title} - ${row.title}</title>
  <script>
    // Prevent all form submissions and interactions that could cause CSRF errors
    function preventFormSubmissions() {
      const forms = document.querySelectorAll('form');
      forms.forEach(function(form) {
        // Remove any existing action attributes
        form.removeAttribute('action');
        form.removeAttribute('method');
        
        // Add event listeners for all submission methods
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();
          alert('This is a mockup - form submissions are disabled for demonstration purposes.');
          return false;
        });
        
        // Also prevent onsubmit if it exists
        form.onsubmit = function(e) {
          e.preventDefault();
          e.stopPropagation();
          alert('This is a mockup - form submissions are disabled for demonstration purposes.');
          return false;
        };
      });
      
      // Prevent any buttons that might trigger form submissions
      const buttons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
      buttons.forEach(function(button) {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          alert('This is a mockup - form submissions are disabled for demonstration purposes.');
          return false;
        });
      });
    }
    
    // Run immediately and also when DOM is ready
    preventFormSubmissions();
    document.addEventListener('DOMContentLoaded', preventFormSubmissions);
    
    // Also run after a short delay in case content is dynamically loaded
    setTimeout(preventFormSubmissions, 100);
  </script>
</head>
<body>
  ${mockup.html}
</body>
</html>`;

    return new Response(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self'; form-action 'none';",
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  } catch (error) {
    console.error("Error serving mockup:", error);
    return new Response("Internal server error", { status: 500 });
  }
};