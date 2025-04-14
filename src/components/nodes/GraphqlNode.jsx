
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { executeGraphQLRequest } from '../../services/apiService';
import { formatJson } from '../../utils/templating';
import { useFlow } from '../../contexts/FlowContext';

const GraphqlNode = ({ id, data }) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  
  const { updateNodeData, nodes } = useFlow();
  
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    updateNodeData(id, { isCollapsed: newCollapsedState });
  };
  
  const handleInputChange = (field, value) => {
    updateNodeData(id, { [field]: value });
  };
  
  const executeRequest = async () => {
    updateNodeData(id, { isLoading: true, response: null, error: null });
    
    try {
      const response = await executeGraphQLRequest(data, nodes);
      updateNodeData(id, { isLoading: false, response });
    } catch (error) {
      updateNodeData(id, {
        isLoading: false,
        error: {
          message: error.message || 'GraphQL request failed'
        }
      });
    }
  };
  
  // Response status helpers
  const hasResponse = data.response !== null;
  const isError = data.error !== null || (hasResponse && data.response.error);
  const statusCode = hasResponse && data.response.status ? data.response.status : null;
  const isSuccess = statusCode && statusCode >= 200 && statusCode < 300;
  
  return (
    <div className="graphql-node">
      <div className="node-header graphql">
        <div className="flex items-center">
          <span>{data.label}</span>
          {data.isLoading && <span className="ml-2 text-xs">Loading...</span>}
        </div>
        <div className="flex items-center">
          <button
            className="p-1 rounded-full hover:bg-purple-400 transition-colors"
            onClick={executeRequest}
            disabled={data.isLoading}
            title="Run Query"
          >
            <Play size={16} />
          </button>
          <button
            className="p-1 rounded-full hover:bg-purple-400 transition-colors ml-1"
            onClick={handleToggleCollapse}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="node-content">
          <div className="form-group">
            <label className="form-label">Endpoint</label>
            <input
              type="text"
              value={data.endpoint || ''}
              onChange={(e) => handleInputChange('endpoint', e.target.value)}
              placeholder="Enter GraphQL endpoint URL"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Query</label>
            <textarea
              value={data.query || ''}
              onChange={(e) => handleInputChange('query', e.target.value)}
              placeholder="Enter GraphQL query"
              className="form-textarea"
              rows={5}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Variables</label>
            <textarea
              value={typeof data.variables === 'object' ? JSON.stringify(data.variables, null, 2) : data.variables || ''}
              onChange={(e) => handleInputChange('variables', e.target.value)}
              placeholder="Enter variables as JSON"
              className="form-textarea"
              rows={3}
            />
          </div>
          
          {hasResponse && (
            <div className={`response-panel ${isSuccess ? 'success' : 'error'}`}>
              <div className="response-header">
                <span>Response {statusCode && `(${statusCode} ${data.response.statusText || ''})`}</span>
              </div>
              <div className="response-content">
                {isError ? (
                  <div className="text-red-500">
                    {data.error?.message || 'Request failed'}
                  </div>
                ) : (
                  <pre
                    dangerouslySetInnerHTML={{
                      __html: formatJson(data.response.data)
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ left: '-8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ right: '-8px' }}
      />
    </div>
  );
};

export default GraphqlNode;
