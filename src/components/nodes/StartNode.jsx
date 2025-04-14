
import React from 'react';
import { Handle, Position } from '@xyflow/react';

const StartNode = ({ data }) => {
  return (
    <div className="react-flow__node-start">
      <div className="node-header start">
        <div>{data.label}</div>
      </div>
      <div className="node-content">
        <p className="text-sm text-gray-500">{data.description}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ right: '-8px' }}
      />
    </div>
  );
};

export default StartNode;
