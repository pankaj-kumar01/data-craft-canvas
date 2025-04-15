// src/hooks/useFlowData.ts
import { useMemo } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';

/**
 * Returns the `.data.response.data` from the first upstream node, if any.
 */
export function useFlowData(nodeId: string): any | null {
  const { getNodes, getEdges } = useReactFlow();

  return useMemo(() => {
    const nodes: Node[] = getNodes();
    const edges: Edge[] = getEdges();

    // Find an edge whose target matches this node
    const incoming = edges.find(e => e.target === nodeId);
    if (!incoming) return null;

    // Find the source node by ID
    const src = nodes.find(n => n.id === incoming.source);
    console.log(src)
    return src?.data?.response?.data ?? null;
  }, [nodeId, getNodes, getEdges]);
}


