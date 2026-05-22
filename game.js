document.addEventListener('DOMContentLoaded', function() {
    
    // Function 1: Generate a Strongly Chordal Graph (Interval Graph)
    function generateStronglyChordal() {
      let intervals = [];
      let maxEnd = 0;
      
      for (let i = 0; i < 10; i++) {
        let start = i === 0 ? 0 : Math.random() * maxEnd; 
        let end = start + 20 + Math.random() * 30;
        intervals.push({ id: i.toString(), start: start, end: end });
        if (end > maxEnd) maxEnd = end;
      }
      
      let elements = [];
      for (let i = 0; i < 10; i++) elements.push({ data: { id: intervals[i].id } }); 
      
      for (let i = 0; i < 10; i++) {
        for (let j = i + 1; j < 10; j++) {
          if (intervals[i].start < intervals[j].end && intervals[j].start < intervals[i].end) {
            elements.push({ data: { source: intervals[i].id, target: intervals[j].id } });
          }
        }
      }
      return elements;
    }

   // Function 2: Generate a General Graph (Guaranteed NOT Strongly Chordal)
    function generateGeneralGraph() {
      let elements = [];
      for (let i = 0; i < 10; i++) {
        elements.push({ data: { id: i.toString() } });
      }
      
      // Step 1: Force a C5 (Chordless Cycle of 5 vertices: 0-1-2-3-4-0).
      // This mathematically guarantees the graph is NOT chordal.
      elements.push({ data: { source: '0', target: '1' } });
      elements.push({ data: { source: '1', target: '2' } });
      elements.push({ data: { source: '2', target: '3' } });
      elements.push({ data: { source: '3', target: '4' } });
      elements.push({ data: { source: '4', target: '0' } });
      
      // Step 2: Attach the remaining vertices (5 to 9) to keep the graph connected.
      for (let i = 5; i < 10; i++) {
        // Connect each new vertex to at least one previously placed vertex
        let target = Math.floor(Math.random() * i); 
        elements.push({ data: { source: i.toString(), target: target.toString() } });
      }
      
      // Step 3: Add a few random edges among the higher vertices to make it messy, 
      // but avoid adding edges between 0-4 to ensure our C5 remains chordless.
      for (let i = 5; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          if (i !== j && Math.random() < 0.25) {
            // Check if edge already exists to avoid duplicates
            let exists = elements.some(e => 
              (e.data.source === i.toString() && e.data.target === j.toString()) || 
              (e.data.source === j.toString() && e.data.target === i.toString())
            );
            if (!exists) {
              elements.push({ data: { source: i.toString(), target: j.toString() } });
            }
          }
        }
      }
      return elements;
    }
  
    // Initialize the Graph (Defaults to Strongly Chordal on first load)
    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: generateStronglyChordal(), 
      style: [
        {
          selector: 'node',
          style: { 'background-color': '#94a3b8', 'label': 'data(id)', 'color': '#fff', 'text-valign': 'center', 'text-halign': 'center', 'width': 40, 'height': 40 }
        },
        {
          selector: 'edge',
          style: { 'width': 3, 'line-color': '#cbd5e1' }
        },
        {
          selector: '.guard',
          style: { 'background-color': '#0ea5e9', 'border-width': 4, 'border-color': '#0284c7' }
        },
        {
          selector: '.attacked',
          style: { 'background-color': '#ef4444', 'border-width': 4, 'border-color': '#b91c1c' }
        },
        {
          selector: '.selected-guard',
          style: { 'background-color': '#f59e0b' }
        }
      ],
      layout: { name: 'cose', padding: 50 }
    });
  
    // Game State
    let mode = 'setup'; 
    let selectedGuard = null;
    const statusEl = document.getElementById('status');
  
    // Node Click Logic
    cy.on('tap', 'node', function(evt){
      const node = evt.target;
  
      if (mode === 'setup') {
        if (node.hasClass('guard')) {
          node.removeClass('guard');
        } else {
          node.addClass('guard');
        }
      } 
      else if (mode === 'defending') {
        if (node.hasClass('guard') && !selectedGuard) {
          selectedGuard = node;
          node.addClass('selected-guard');
          statusEl.innerText = "Guard Selected. Click target node to move.";
        } 
        else if (selectedGuard) {
          const isAdjacent = cy.edges(`[source = "${selectedGuard.id()}"][target = "${node.id()}"], [source = "${node.id()}"][target = "${selectedGuard.id()}"]`).length > 0;
          
          if (isAdjacent || selectedGuard.id() === node.id()) {
            selectedGuard.removeClass('guard').removeClass('selected-guard');
            node.addClass('guard');
            node.removeClass('attacked');
            
            selectedGuard = null;
            mode = 'setup';
            statusEl.innerText = "Defended! Back to Setup Mode.";
          } else {
            statusEl.innerText = "Invalid move. Must move along edges.";
            selectedGuard.removeClass('selected-guard');
            selectedGuard = null;
          }
        }
      }
    });
  
    // Attack Button Logic
    document.getElementById('btn-attack').addEventListener('click', () => {
      const emptyNodes = cy.nodes().filter(n => !n.hasClass('guard'));
      if (emptyNodes.length === 0) {
        statusEl.innerText = "All nodes are guarded!";
        return;
      }
      const randomNode = emptyNodes[Math.floor(Math.random() * emptyNodes.length)];
      randomNode.addClass('attacked');
      mode = 'defending';
      statusEl.innerText = "ATTACKED! Click a Guard to move it.";
    });
  
    // Reset Board Button
    document.getElementById('btn-reset').addEventListener('click', () => {
      cy.nodes().removeClass('guard').removeClass('attacked').removeClass('selected-guard');
      mode = 'setup';
      selectedGuard = null;
      statusEl.innerText = "Mode: Place Guards";
    });

    // New Random Graph Button (Now checks the dropdown!)
    document.getElementById('btn-new-graph').addEventListener('click', () => {
      const graphType = document.getElementById('graph-type').value;
      
      cy.elements().remove(); // Clear old graph
      
      // Inject the correct math based on the dropdown
      if (graphType === 'strongly-chordal') {
        cy.add(generateStronglyChordal());
      } else if (graphType === 'general') {
        cy.add(generateGeneralGraph());
      }
      
      cy.layout({ name: 'cose', padding: 50 }).run(); // Rerun the physics layout
      
      mode = 'setup';
      selectedGuard = null;
      statusEl.innerText = "New Graph Generated. Place Guards.";
    });
  
  });
