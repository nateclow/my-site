document.addEventListener('DOMContentLoaded', function() {
    
    // Function to generate a random connected Interval Graph (guaranteed Strongly Chordal)
    function generateStronglyChordal() {
      let intervals = [];
      let maxEnd = 0;
      
      // Generate 10 overlapping intervals
      for (let i = 0; i < 10; i++) {
        let start = i === 0 ? 0 : Math.random() * maxEnd; // Force overlap to ensure the graph is connected
        let end = start + 20 + Math.random() * 30;
        intervals.push({ id: i.toString(), start: start, end: end });
        if (end > maxEnd) maxEnd = end;
      }
      
      let elements = [];
      // Create Nodes
      for (let i = 0; i < 10; i++) { 
        elements.push({ data: { id: intervals[i].id } }); 
      }
      
      // Create Edges where intervals overlap
      for (let i = 0; i < 10; i++) {
        for (let j = i + 1; j < 10; j++) {
          if (intervals[i].start < intervals[j].end && intervals[j].start < intervals[i].end) {
            elements.push({ data: { source: intervals[i].id, target: intervals[j].id } });
          }
        }
      }
      return elements;
    }
  
    // Initialize the Graph
    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: generateStronglyChordal(), // Call the random generator here
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#94a3b8',
            'label': 'data(id)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 40,
            'height': 40
          }
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

    // New Random Graph Button
    document.getElementById('btn-new-graph').addEventListener('click', () => {
      cy.elements().remove(); // Clear old graph
      cy.add(generateStronglyChordal()); // Generate and add new one
      cy.layout({ name: 'cose', padding: 50 }).run(); // Rerun the physics layout
      
      mode = 'setup';
      selectedGuard = null;
      statusEl.innerText = "New Graph Generated. Place Guards.";
    });
  
  });
