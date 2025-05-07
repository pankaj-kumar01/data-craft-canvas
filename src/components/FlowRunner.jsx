import React, { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { kahnTopoSort } from "../utils/kahnTopoSort";
import { PlayIcon } from "lucide-react";
import { useFlow } from "../contexts/FlowContext";

const FlowRunner = ({ runNode, togglePopUp }) => {
  const instance = useReactFlow();
  const { updateNodeData,updateLocalStorage} = useFlow();

  const runAll = async () => {
    const { nodes, edges } = instance.toObject();
    const order = kahnTopoSort(nodes, edges);
    const results = {};

    for (const nodeId of order) {
      const node = nodes.find((n) => n.id === nodeId);
      // Gather upstream outputs
      const incomers = edges.filter((e) => e.target === nodeId);
      try {
        const output = await runNode(node, results, incomers, updateNodeData);

        results[nodeId] = output;

        if (!!output) {
          if (nodeId === "start-node") {
            updateNodeData(nodeId, {
              data: { fields: output },
            });
          } else {

            updateNodeData(nodeId, {
              isLoading: false,
              response: { data: {...output} },
            });
          }
        }
      } catch (err) {
        updateNodeData(nodeId, {
          isLoading: false,
          error: { message: err.message },
        });
        console.error(`Error running node ${nodeId}:`, err);
        break;
      }
    }

  };

  return (
    <>
      {" "}
      <button
        onClick={runAll}
        // onClick={togglePopUp}
        className="btn-toolbar flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      >
        <PlayIcon size={18} />
      </button>
    </>
  );
};

export default FlowRunner;
