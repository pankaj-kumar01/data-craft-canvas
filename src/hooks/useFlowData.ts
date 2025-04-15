
import { useMemo } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';

interface NodeData {
  response?: {
    data?: any;
  };
  [key: string]: any; // Add index signature to satisfy type constraint
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

      const incoming = edges.find(e => e.target === nodeId);
      if (!incoming) return null;

      const sourceNode = nodes.find(n => n.id === incoming.source);
      if (!sourceNode?.data?.response?.data) return null;

      return sourceNode.data.response.data;
    } catch (error) {
      console.error(`Error in useFlowData for node ${nodeId}:`, error);
      return null;
    }
  }, [getNodes, getEdges, nodeId, getNodes().find(n => n.id === nodeId)?.data?.triggerUpdate]);
}

