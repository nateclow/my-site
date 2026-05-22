document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize the Graph (A 10-vertex strongly chordal graph)
    const cy = cytoscape({
      container: document.getElementById('cy'),
      
      elements: [
        // 10 Vertices
        { data: { id: '0' } }, { data: { id: '1' } }, { data: { id: '2' } },
        { data: { id: '3' } }, { data: { id: '4' } }, { data: { id: '5' } },
        { data: { id: '6' } }, { data: { id: '7' } }, { data: { id: '8' } },
        { data: { id: '9' } },
        // Edges creating a strongly chordal structure
        { data: { source: '0', target: '1' } }, { data: { source: '0', target: '2' } },
        { data: { source: '0', target: '3' } }, { data: { source: '1', target: '2' } },
        { data: { source: '1', target: '4' } }, { data: { source: '2', target: '5' } },
        { data: { source: '3', target: '6' } }, { data: { source: '4', target: '7' } },
        { data: { source: '5', target: '8' } }, { data: { source: '6', target: '9' } }
      ],
  
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
          style: {
            'width': 3,
            'line-color': '#cbd5e1'
          }
        },
        {
          selector: '.guard',
          style: {
            'background-color': '#0ea5e9', // Blue for guards
            'border-width': 4,
            'border-color': '#0284c7'
          }
        },
        {
          selector: '.attacked',
          style: {
            'background-color': '#ef4444', // Red for attack
            'border-width': 4,
            'border-color': '#b91c1c'
          }
        },
        {
          selector: '.selected-guard',
          style: {
            'background-color': '#f59e0b', // Orange when moving
          }
        }
      ],
      layout: {
        name: 'cose', // Physics-based layout to make it look nice
        padding: 50
      }
    });
  
    // Game State
    let mode = 'setup'; // setup, defending
    let selectedGuard = null;
  
    const statusEl = document.getElementById('status');
  
    // Node Click Logic
    cy.on('tap', 'node', function(evt){
      const node = evt.target;
  
      if (mode === 'setup') {
        // Toggle guard placement
        if (node.hasClass('guard')) {
          node.removeClass('guard');
        } else {
          node.addClass('guard');
        }
      } 
      
      else if (mode === 'defending') {
        // Step 1: Select a guard to move
        if (node.hasClass('guard') && !selectedGuard) {
          selectedGuard = node;
          node.addClass('selected-guard');
          statusEl.innerText = "Guard Selected. Click target node to move.";
        } 
        // Step 2: Move the selected guard
        else if (selectedGuard) {
          // Check if target is adjacent or the same node
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
      // Find all nodes without guards
      const emptyNodes = cy.nodes().filter(n => !n.hasClass('guard'));
      if (emptyNodes.length === 0) {
        statusEl.innerText = "All nodes are guarded!";
        return;
      }
      
      // Pick a random empty node
      const randomNode = emptyNodes[Math.floor(Math.random() * emptyNodes.length)];
      randomNode.addClass('attacked');
      
      mode = 'defending';
      statusEl.innerText = "ATTACKED! Click a Guard to move it.";
    });
  
    // Reset Button Logic
    document.getElementById('btn-reset').addEventListener('click', () => {
      cy.nodes().removeClass('guard').removeClass('attacked').removeClass('selected-guard');
      mode = 'setup';
      selectedGuard = null;
      statusEl.innerText = "Mode: Place Guards";
    });
  
  });
