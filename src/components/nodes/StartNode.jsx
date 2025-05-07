import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useFlow } from '../../contexts/FlowContext';  // to update node data

// Utility to normalize fields data into an array of {key, value} objects
const normalizeFields = (fieldsData) => {
  if (Array.isArray(fieldsData)) return fieldsData;
  if (fieldsData && typeof fieldsData === 'object') {
    return Object.entries(fieldsData).map(([key, value]) => ({
      key: key,
      value: String(value)
    }));
  }
  // If no fields provided, start with one empty pair (optional)
  return [{ key: '', value: '' }];
};

const StartNode = ({ id, data = {} }) => {
  const { updateNodeData } = useFlow();

  // Initialize fields state from node data (convert object to array of pairs)
  const [fields, setFields] = useState(() => normalizeFields(data.fields));

  // Handler to update a key or value in the fields list
  const updateField = (index, field, newValue) => {
    setFields(prevFields => {
      const updated = prevFields.map((item, i) =>
        i === index ? { ...item, [field]: newValue } : item
      );
      // Sync updated fields to node data as an object (key: value)
      updateNodeData(id, { fields: Object.fromEntries(updated.map(({ key, value }) => [key, value])) });
      return updated;
    });
  };

  // Add a new empty key–value pair
  const addField = () => {
    setFields(prevFields => {
      const updated = [...prevFields, { key: '', value: '' }];
      updateNodeData(id, { fields: Object.fromEntries(updated.map(({ key, value }) => [key, value])) });
      return updated;
    });
  };

  // Remove a key–value pair by index
  const removeField = (index) => {
    setFields(prevFields => {
      const updated = prevFields.filter((_, i) => i !== index);
      updateNodeData(id, { fields: Object.fromEntries(updated.map(({ key, value }) => [key, value])) });
      return updated;
    });
  };

  return (
    <div className="start-node border rounded-md shadow-md bg-white w-[100%]">
      {/* Header with fixed "Start" label */}
      <div className="node-header start flex items-center justify-between p-2 bg-orange-100">
        <span className="text-sm font-semibold">Start</span>
      </div>

      {/* Node content: list of key–value input pairs */}
      <div className="node-content p-2">
        {fields.map((field, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            {/* Key input */}
            <input
              type="text"
              className="nodrag form-input flex-1"
              placeholder="Key"
              value={field.key}
              onChange={(e) => updateField(idx, 'key', e.target.value)}
            />
            {/* Value input */}
            <input
              type="text"
              className="nodrag form-input flex-1"
              placeholder="Value"
              value={field.value}
              onChange={(e) => updateField(idx, 'value', e.target.value)}
            />
            {/* Remove button for this pair */}
            <button type="button" onClick={() => removeField(idx)} title="Remove Field">
              ✕
            </button>
          </div>
        ))}

        {/* Button to add a new field pair */}
        <button 
          type="button" 
          onClick={addField} 
          className="text-sm text-blue-600 mt-1"
        >
          + Add Field
        </button>
      </div>

      {/* Output handle for connecting to downstream nodes */}
      <Handle type="source" position={Position.Right} id="out" style={{ right: '-8px' }} />
    </div>
  );
};

export default StartNode;
