
import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowEditor from './FlowEditor';

const FlowEditorWrapper = () => {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
};

export default FlowEditorWrapper;
