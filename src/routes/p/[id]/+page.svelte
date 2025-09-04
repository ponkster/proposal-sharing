<script lang="ts">
  import { page } from "$app/stores";
  import { marked } from "marked";
  import mermaid from "mermaid";
  import { onMount } from "svelte";
  import { jsPDF } from "jspdf";
  import html2canvas from "html2canvas";

  let password = "";
  let markdown: string | null = null;
  let mockups: Array<{title: string, html: string}> = [];
  let title: string | null = null;
  let error = "";
  let activeTab: "proposal" = "proposal";
  let renderedMarkdown = "";
  let markdownContainer: HTMLElement;
  let mermaidDiagrams: Array<{id: string, code: string}> = [];
  let isExportingPDF = false;

  async function processMarkdown(markdownText: string) {
    console.log('Original markdown:', markdownText);
    
    // Reset diagram storage
    mermaidDiagrams = [];
    
    // Extract and store mermaid blocks, replace with placeholders
    let diagramIndex = 0;
    let processedText = markdownText.replace(/```mermaid[\r\n]+([\s\S]*?)[\r\n]+```/g, (match, diagram) => {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      const cleanDiagram = diagram.trim();
      
      // Store the clean diagram code
      mermaidDiagrams[diagramIndex] = { id, code: cleanDiagram };
      
      console.log(`Found mermaid block ${diagramIndex}:`, cleanDiagram);
      diagramIndex++;
      
      // Return a simple placeholder that won't confuse markdown parser
      return `\n\n<!-- MERMAID_PLACEHOLDER_${diagramIndex - 1} -->\n\n`;
    });
    
    console.log('Processed text before markdown (with placeholders):', processedText);
    console.log('Stored diagrams:', mermaidDiagrams);
    
    // Render markdown to HTML
    let html = await marked(processedText);
    
    // Replace placeholders with actual mermaid divs
    for (let i = 0; i < mermaidDiagrams.length; i++) {
      const placeholder = `<!-- MERMAID_PLACEHOLDER_${i} -->`;
      const mermaidDiv = `<div class="mermaid" id="${mermaidDiagrams[i].id}" data-diagram-index="${i}">${mermaidDiagrams[i].code}</div>`;
      html = html.replace(placeholder, mermaidDiv);
    }
    
    console.log('Final HTML after placeholder replacement:', html);
    
    return html;
  }

  async function renderMermaidCharts() {
    if (!markdownContainer || mermaidDiagrams.length === 0) return;
    
    // Clear any existing mermaid instance
    try {
      // @ts-ignore - accessing internal mermaid state
      if (mermaid.mermaidAPI) {
        mermaid.mermaidAPI.reset();
      }
    } catch (e) {
      // Ignore reset errors
    }
    
    // Initialize mermaid with clean state
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'arial',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    });
    
    // Find all mermaid elements
    const mermaidElements = markdownContainer.querySelectorAll('.mermaid');
    console.log(`Found ${mermaidElements.length} mermaid diagrams, stored ${mermaidDiagrams.length} codes`);
    
    for (let i = 0; i < Math.min(mermaidElements.length, mermaidDiagrams.length); i++) {
      const element = mermaidElements[i] as HTMLElement;
      const diagramCode = mermaidDiagrams[i].code;
      
      if (!diagramCode) {
        console.log(`Skipping empty mermaid element ${i}`);
        continue;
      }
      
      console.log(`Rendering mermaid diagram ${i}:`, diagramCode);
      
      try {
        const svgId = `diagram_${i}_${Date.now()}`;
        
        // Use mermaid.render directly without temporary DOM manipulation
        const { svg } = await mermaid.render(svgId, diagramCode);
        
        // Set the SVG content
        element.innerHTML = svg;
        console.log(`Successfully rendered mermaid diagram ${i}`);
        
      } catch (error) {
        console.error(`Mermaid rendering error for diagram ${i}:`, error);
        element.innerHTML = `<div style="color: red; border: 1px solid red; padding: 1rem; margin: 1rem 0; font-family: monospace;">
          <strong>Mermaid Rendering Error:</strong><br>
          <pre style="white-space: pre-wrap; margin: 0.5rem 0;">${error}</pre>
          <br><strong>Diagram Code:</strong><br>
          <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 0.5rem; margin: 0.5rem 0;">${diagramCode}</pre>
        </div>`;
      }
    }
  }

  async function unlock() {
    const id = $page.params.id;
    const res = await fetch(`/api/unlock/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok) {
      title = data.title;
      markdown = data.markdown;
      mockups = data.mockups || [];
      
      // Process markdown and render it
      if (data.markdown) {
        renderedMarkdown = await processMarkdown(data.markdown);
        console.log('Processed markdown:', renderedMarkdown);
        
        // Use setTimeout to ensure the DOM is updated before rendering mermaid
        setTimeout(async () => {
          console.log('About to render mermaid charts...');
          await renderMermaidCharts();
        }, 200);
      }
      
      // Store mockups without modification for new tab functionality
      // No need to inject scripts since mockups will open in new tabs
    } else {
      error = data.error;
    }
  }

  // Re-render mermaid when switching to proposal tab
  $: if (activeTab === "proposal" && renderedMarkdown && markdownContainer) {
    setTimeout(async () => {
      console.log('Re-rendering mermaid on tab switch...');
      await renderMermaidCharts();
    }, 100);
  }

  async function openMockupInNewTab(index: number) {
    const proposalId = $page.params.id;
    
    try {
      // Open password prompt page in new tab
      const promptUrl = `/mockup/${proposalId}/${index}`;
      window.open(promptUrl, '_blank');
    } catch (error) {
      console.error('Error opening mockup in new tab:', error);
      alert('Failed to open mockup in new tab');
    }
  }

  async function exportToPDF() {
    if (!markdownContainer || activeTab !== 'proposal') {
      alert('Please switch to the Proposal tab to export PDF');
      return;
    }

    isExportingPDF = true;

    try {
      // Create a clone of the content for PDF export
      const exportContainer = document.createElement('div');
      exportContainer.className = 'pdf-export-container';
      exportContainer.innerHTML = markdownContainer.innerHTML;
      
      // Style the export container
      exportContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 210mm;
        padding: 20mm;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #333;
      `;

      // Add PDF-specific styles
      const style = document.createElement('style');
      style.textContent = `
        .pdf-export-container h1 { font-size: 24px; margin: 0 0 16px 0; page-break-before: auto; }
        .pdf-export-container h2 { font-size: 20px; margin: 24px 0 12px 0; page-break-before: auto; }
        .pdf-export-container h3 { font-size: 16px; margin: 20px 0 10px 0; }
        .pdf-export-container h4 { font-size: 14px; margin: 16px 0 8px 0; }
        .pdf-export-container p { margin: 0 0 12px 0; }
        .pdf-export-container ul, .pdf-export-container ol { margin: 0 0 12px 0; padding-left: 20px; }
        .pdf-export-container li { margin-bottom: 4px; }
        .pdf-export-container table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .pdf-export-container th, .pdf-export-container td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .pdf-export-container th { background-color: #f2f2f2; font-weight: bold; }
        .pdf-export-container .mermaid { margin: 16px 0; text-align: center; }
        .pdf-export-container .mermaid svg { max-width: 100%; height: auto; }
        .pdf-export-container code { background: #f1f1f1; padding: 2px 4px; border-radius: 3px; font-size: 11px; }
        .pdf-export-container pre { background: #f8f8f8; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 12px 0; }
        .pdf-export-container blockquote { border-left: 4px solid #ddd; padding-left: 12px; margin: 12px 0; color: #666; }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(exportContainer);

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the content as canvas
      const canvas = await html2canvas(exportContainer, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: exportContainer.scrollWidth,
        height: exportContainer.scrollHeight
      });

      // Clean up
      document.body.removeChild(exportContainer);
      document.head.removeChild(style);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const filename = `${title || 'proposal'}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      isExportingPDF = false;
    }
  }
</script>

<div class="container">
  {#if !markdown}
    <div class="unlock-container">
      <h1>Enter Password</h1>
      <div class="unlock-form">
        <input type="password" bind:value={password} placeholder="Password" />
        <button on:click={unlock}>Unlock</button>
      </div>
      {#if error}<p class="error">{error}</p>{/if}
    </div>
  {:else}
    <h1>{title}</h1>

    <div class="header-with-actions">
      <h2>Proposal</h2>
      
      <div class="actions-row">
        <button 
          on:click={exportToPDF} 
          class="export-pdf-btn"
          disabled={isExportingPDF}
        >
          {#if isExportingPDF}
            📄 Generating PDF...
          {:else}
            📄 Export PDF
          {/if}
        </button>
      </div>
    </div>

    {#if mockups.length > 0}
      <div class="mockups-section">
        <h3>HTML Mockups</h3>
        <div class="mockup-buttons">
          {#each mockups as mockup, index}
            <button 
              class="mockup-btn"
              on:click={() => openMockupInNewTab(index)}
            >
              🔗 Open {mockup.title}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="content">
      <div class="markdown-content" bind:this={markdownContainer}>
        {@html renderedMarkdown}
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .unlock-container {
    text-align: center;
    max-width: 400px;
    margin: 4rem auto;
  }
  
  .unlock-form {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .unlock-form input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .unlock-form button {
    background: #0070f3;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .unlock-form button:hover {
    background: #0056b3;
  }
  
  .error {
    color: red;
    margin-top: 1rem;
  }
  
  .header-with-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .header-with-actions h2 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
  }
  
  .actions-row {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .mockups-section {
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  .mockups-section h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.2rem;
  }
  
  .mockup-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .mockup-btn {
    padding: 0.75rem 1.25rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .mockup-btn:hover {
    background: #5a67d8;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .content {
    min-height: 400px;
  }
  
  .markdown-content {
    padding: 1rem 0;
  }
  
  
  h1 {
    margin-bottom: 2rem;
    color: #333;
  }
  
  /* Markdown styling */
  .markdown-content :global(h1),
  .markdown-content :global(h2),
  .markdown-content :global(h3),
  .markdown-content :global(h4),
  .markdown-content :global(h5),
  .markdown-content :global(h6) {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  .markdown-content :global(p) {
    margin-bottom: 1rem;
    line-height: 1.6;
  }
  
  .markdown-content :global(ul),
  .markdown-content :global(ol) {
    margin-bottom: 1rem;
    padding-left: 2rem;
  }
  
  .markdown-content :global(li) {
    margin-bottom: 0.5rem;
  }
  
  .markdown-content :global(code) {
    background: #f1f1f1;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9em;
  }
  
  .markdown-content :global(pre) {
    background: #f8f8f8;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  
  .markdown-content :global(blockquote) {
    border-left: 4px solid #ddd;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #666;
  }
  
  /* Mermaid diagram styling */
  .markdown-content :global(.mermaid) {
    text-align: center;
    margin: 2rem 0;
  }
  
  .markdown-content :global(.mermaid svg) {
    max-width: 100%;
    height: auto;
  }
  
  /* PDF Export Button */
  .export-pdf-btn {
    background: #38a169;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .export-pdf-btn:hover:not(:disabled) {
    background: #2f855a;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .export-pdf-btn:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* Table styling */
  .markdown-content :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    border: 1px solid #ddd;
  }
  
  .markdown-content :global(th),
  .markdown-content :global(td) {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }
  
  .markdown-content :global(th) {
    background-color: #f2f2f2;
    font-weight: bold;
  }
  
  .markdown-content :global(tr:nth-child(even)) {
    background-color: #f9f9f9;
  }
  
  .markdown-content :global(tr:hover) {
    background-color: #f5f5f5;
  }
  
  .markdown-content :global(td:nth-child(n+2)) {
    text-align: right;
  }
  
  .markdown-content :global(th:first-child),
  .markdown-content :global(td:first-child) {
    text-align: left;
  }
</style>