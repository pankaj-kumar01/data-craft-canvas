export function kahnTopoSort(nodes, edges) {
    const inDegree = {};
    const adj = {};
  
    // Initialize
    nodes.forEach((n) => {
      inDegree[n.id] = 0;
      adj[n.id] = [];
    });
  
    // Build graph
    edges.forEach((e) => {
      adj[e.source].push(e.target);
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    });
  
    // Queue of nodes with no incoming edges
    const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    const sorted = [];
  
    while (queue.length > 0) {
      const id = queue.shift();
      sorted.push(id);
  
      (adj[id] || []).forEach((neighbor) => {
        inDegree[neighbor] -= 1;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }
  
    if (sorted.length !== nodes.length) {
      throw new Error('Cycle detected in flow');
    }
  
    return sorted;
  }