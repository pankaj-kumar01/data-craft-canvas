// src/components/FlowRunner.jsx
import React from 'react';
import { useFlow }      from '../contexts/FlowContext';
import { kahnTopoSort } from '../utils/kahnTopoSort';
import { runNode }      from '../utils/runNode';
import { PlayIcon }     from 'lucide-react';

export default function FlowRunner({togglePopUp}) {
  const { nodes, edges, updateNodeData } = useFlow();

  const runAll = async () => {
    const order   = kahnTopoSort(nodes, edges);
    const results = {};

    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);

      // 1) spinner on
      updateNodeData(nodeId, { isLoading: true, response: null, error: null });

      // 2) If this is the Start node, just echo its fields
      if (node.type === 'startNode' || node.type === 'start-node') {
        const fields = node.data.fields || {};
        results[nodeId] = fields;

        updateNodeData(nodeId, {
          isLoading: false,
          response: { status: 200, data: fields },
          error: null
        });

        continue;
      }

      // 3) Otherwise run your normal node logic
      const incomers = edges.filter(e => e.target === nodeId);
      let resp;
      try {
        resp = await runNode(node, results, incomers);
      } catch (err) {
        updateNodeData(nodeId, {
          isLoading: false,
          error: { message: err.message }
        });
        break;
      }

      // 4) stash for downstream
      results[nodeId] = resp.data;

      // 5) write back exactly like per-node Run
      updateNodeData(nodeId, {
        isLoading: false,
        response: { status: resp.status, data: resp.data },
        error: null
      });
    }
  };

  return (
    <button
      onClick={runAll}
      // onClick={togglePopUp}
      className="btn-toolbar flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
    >
      <PlayIcon size={18} />
    </button>
  );
}
