
import { useMemo } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';

interface NodeData {
  response?: {
    data?: any;
  };
}

/**
 * Returns the `.data.response.data` from the first upstream node, if any.
 */
export function useFlowData(nodeId: string): any | null {
  const { getNodes, getEdges } = useReactFlow();

  return useMemo(() => {
    try {
      const nodes: Node<NodeData>[] = getNodes();
      const edges: Edge[] = getEdges();

      // Find an edge whose target matches this node
      const incoming = edges.find(e => e.target === nodeId);
      if (!incoming) {
        console.log(`No incoming edges found for node ${nodeId}`);
        return null;
      }

      // Find the source node by ID
      const src = nodes.find(n => n.id === incoming.source);
      if (!src) {
        console.log(`Source node ${incoming.source} not found for node ${nodeId}`);
        return null;
      }

      // Verify the data structure before returning
      if (!src.data?.response?.data) {
        console.log(`No response data available in source node ${incoming.source}`);
        return null;
      }

      return src.data.response.data;
    } catch (error) {
      console.error(`Error in useFlowData for node ${nodeId}:`, error);
      return null;
    }
  }, [nodeId, getNodes, getEdges]);
}

