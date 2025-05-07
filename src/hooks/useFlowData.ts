
import { useMemo } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';

interface NodeData {
  response?: {
    data?: any;
  };
  [key: string]: any; // Add index signature to satisfy type constraint
}

export function useFlowData(nodeId: string): any | null {
  const { getNodes, getEdges } = useReactFlow();

  return useMemo(() => {
    try {
      const nodes: Node<NodeData>[] = getNodes();
      const edges: Edge[] = getEdges();

      if (nodeId === 'start-node'){
        const sourceNode = nodes.find(n => n.id ==='start-node');
        return sourceNode?.data?.fields
      }
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

