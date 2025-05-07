// src/components/FlowEditor.jsx
import React, { useCallback, useRef, useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlow } from "../contexts/FlowContext";
import Toolbar from "./Toolbar";
import ContextMenu from "./ContextMenu";

import StartNode from "./nodes/StartNode";
import HttpNode from "./nodes/HttpNode";
import GraphNode from "./nodes/GraphNode";

const nodeTypes = {
  startNode: StartNode,
  httpNode: HttpNode,
  graphNode: GraphNode,
};

const FlowEditor = () => {
  const wrapperRef = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [isPlaygroundOpen, setisPlaygroundOpen] = useState(false);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    showContextMenu,
    hideContextMenu,
  } = useFlow();

  // Capture the ReactFlow instance
  const onInit = useCallback((instance) => {
    console.log("Captured ReactFlow instance:", instance);
    setRfInstance(instance);
  }, []);

  // Add node at center using screenToFlowPosition
  const onAddNode = useCallback(
    (type) => {
      if (!wrapperRef.current || !rfInstance) {
        console.error("Add Node: wrapper or rfInstance missing");
        return;
      }

      // Use screenToFlowPosition instead of project
      const bounds = wrapperRef.current.getBoundingClientRect();
      const flowPosition = rfInstance.screenToFlowPosition({
        x: bounds.width / 2,
        y: bounds.height / 2,
      });

      // Offset so node appears centered
      const position = {
        x: flowPosition.x - 140,
        y: flowPosition.y - 100,
      };

      addNode(type, position);
    },
    [rfInstance, addNode]
  );

  const onNodeContextMenu = useCallback(
    (e, node) => {
      e.preventDefault();
      const pane = wrapperRef.current.querySelector(".react-flow__pane");
      const { top, left } = pane.getBoundingClientRect();
      showContextMenu({ x: e.clientX - left, y: e.clientY - top }, node.id);
    },
    [showContextMenu]
  );

  const onEdgeContextMenu = useCallback(
    (e, edge) => {
      e.preventDefault();
      const pane = wrapperRef.current.querySelector(".react-flow__pane");
      const { top, left } = pane.getBoundingClientRect();
      showContextMenu(
        { x: e.clientX - left, y: e.clientY - top },
        null,
        edge.id
      );
    },
    [showContextMenu]
  );

  const onPaneClick = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);

  const togglePopUp = () => {
    setisPlaygroundOpen(!isPlaygroundOpen);
  };
  return (
    <div className="flow-editor w-full h-screen" ref={wrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={onInit}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{ animated: false, style: { strokeWidth: 2 } }}
      >
        <Background color="#aaa" gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === "startNode") return "#FF8A65";
            if (n.type === "httpNode") return "#42A5F5";
            if (n.type === "graphNode") return "#AB47BC";
            return "#eee";
          }}
          nodeColor={(n) => {
            if (n.type === "startNode") return "#FFCCBC";
            if (n.type === "httpNode") return "#BBDEFB";
            if (n.type === "graphNode") return "#E1BEE7";
            return "#fff";
          }}
          nodeBorderRadius={3}
        />
        <Panel position="top-center">
          <Toolbar onAddNode={onAddNode} togglePopUp={togglePopUp} />
        </Panel>
      </ReactFlow>
      
      {isPlaygroundOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
          onClick={togglePopUp} // Close when clicking outside the modal
        >
          <div
            className="fixed inset-0 bg-gray-500/75 transition-opacity"
            aria-hidden="true"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          ></div>

          <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              {/* Close (X) Button in top-right */}
              <button
                type="button"
                onClick={togglePopUp}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="border-b-[1px] border-gray-500 ">
                  <div className="mt-3 text-left sm:text-left">
                    <h3
                      className="text-base font-semibold text-gray-900"
                      id="modal-title"
                    >
                      User UI/UX
                    </h3>
                  </div>
                  <div className="mt-2">
                    {/* Zipcode Input Field */}
                    <input
                      type="text"
                      placeholder="Enter Zipcode"
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-blue-400  px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  //onClick={handleSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ContextMenu />
    </div>
  );
};

export default FlowEditor;
