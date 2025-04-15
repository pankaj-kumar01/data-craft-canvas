import { useMemo } from 'react';
import { useReactFlow, getIncomers, Node, Edge } from '@xyflow/react';

/**
 * Returns the `.data.response.data` from the first upstream node, if any.
 */
export function useFlowData(nodeId: string): any | null {
  const { getNodes, getEdges } = useReactFlow();

  return useMemo(() => {
    const nodes: Node[] = getNodes();
    const edges: Edge[] = getEdges();

    // Pass an object with `id` rather than the string directly
    const incomers = getIncomers({ id: nodeId }, nodes, edges);
    if (incomers.length === 0) {
      return null;
    }

    const sourceNode = incomers[0];
    return (sourceNode.data as any)?.response?.data ?? null;
  }, [nodeId, getNodes, getEdges]);
}
