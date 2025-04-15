// src/components/CustomEdge.jsx
import React from 'react';
import { getBezierPath } from '@xyflow/react';
import { X } from 'lucide-react';
import { useFlow } from '../contexts/FlowContext';

export default function CustomEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  curvature = 0.5
}) {
  const [path] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature
  });
  const { deleteEdge } = useFlow();
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;

  return (
    <>
      <path id={id} className="react-flow__edge-path" d={path} />
      <foreignObject
        width={20} height={20}
        x={mx - 10} y={my - 10}
        style={{ overflow: 'visible', pointerEvents: 'all' }}
      >
        <button
          onClick={() => deleteEdge(id)}
          style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: 2,
            cursor: 'pointer'
          }}
        >
          <X size={12} color="#e00" />
        </button>
      </foreignObject>
    </>
  );
}
