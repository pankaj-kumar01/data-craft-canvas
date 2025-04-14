
import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowEditor from './FlowEditor';
import { FlowProvider } from '../contexts/FlowContext';

const FlowEditorWrapper = () => {
  return (
    <FlowProvider>
      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    </FlowProvider>
  );
};

export default FlowEditorWrapper;
