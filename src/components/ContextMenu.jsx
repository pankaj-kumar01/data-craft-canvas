
import React from 'react';
import { Trash2, Copy } from 'lucide-react';
import useFlowStore from '../stores/flowStore';

const ContextMenu = () => {
  const contextMenu = useFlowStore((state) => state.contextMenu);
  const hideContextMenu = useFlowStore((state) => state.hideContextMenu);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const deleteEdge = useFlowStore((state) => state.deleteEdge);
  const duplicateNode = useFlowStore((state) => state.duplicateNode);
  
  if (!contextMenu.visible) {
    return null;
  }
  
  const handleDeleteClick = () => {
    if (contextMenu.nodeId) {
      deleteNode(contextMenu.nodeId);
    } else if (contextMenu.edgeId) {
      deleteEdge(contextMenu.edgeId);
    }
    hideContextMenu();
  };
  
  const handleDuplicateClick = () => {
    if (contextMenu.nodeId) {
      duplicateNode(contextMenu.nodeId);
    }
    hideContextMenu();
  };
  
  const style = {
    position: 'fixed',
    top: `${contextMenu.position.y}px`,
    left: `${contextMenu.position.x}px`,
    zIndex: 1001,
  };
  
  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={hideContextMenu}
      />
      <div
        className="bg-white rounded-md shadow-lg overflow-hidden z-50"
        style={style}
      >
        <div className="p-1">
          {contextMenu.nodeId && (
            <button
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors"
              onClick={handleDuplicateClick}
            >
              <Copy size={16} />
              <span>Duplicate</span>
            </button>
          )}
          <button
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors text-red-600"
            onClick={handleDeleteClick}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ContextMenu;
