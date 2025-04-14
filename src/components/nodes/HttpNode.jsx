
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { executeHttpRequest } from '../../services/apiService';
import { formatJson } from '../../utils/templating';
import { useFlow } from '../../contexts/FlowContext';

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const HttpNode = ({ id, data }) => {
  const [activeTab, setActiveTab] = useState(data.activeTab || 'headers');
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  
  const { updateNodeData, nodes } = useFlow();
  
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    updateNodeData(id, { isCollapsed: newCollapsedState });
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    updateNodeData(id, { activeTab: tab });
  };
  
  const handleInputChange = (field, value) => {
    updateNodeData(id, { [field]: value });
  };
  
  const handleMethodChange = (e) => {
    updateNodeData(id, { method: e.target.value });
  };
  
  const executeRequest = async () => {
    updateNodeData(id, { isLoading: true, response: null, error: null });
    
    try {
      const response = await executeHttpRequest(data, nodes);
      updateNodeData(id, { isLoading: false, response });
    } catch (error) {
      updateNodeData(id, {
        isLoading: false,
        error: {
          message: error.message || 'Request failed'
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
    <div className="http-node">
      <div className="node-header http">
        <div className="flex items-center">
          <span>{data.label}</span>
          {data.isLoading && <span className="ml-2 text-xs">Loading...</span>}
        </div>
        <div className="flex items-center">
          <button
            className="p-1 rounded-full hover:bg-blue-400 transition-colors"
            onClick={executeRequest}
            disabled={data.isLoading}
            title="Run Request"
          >
            <Play size={16} />
          </button>
          <button
            className="p-1 rounded-full hover:bg-blue-400 transition-colors ml-1"
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
            <div className="flex space-x-2">
              <div className="w-1/3">
                <select
                  value={data.method || 'GET'}
                  onChange={handleMethodChange}
                  className="form-select"
                >
                  {httpMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={data.url || ''}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="Enter URL"
                  className="form-input"
                />
              </div>
            </div>
          </div>
          
          <div className="tabs">
            <div
              className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => handleTabChange('headers')}
            >
              Headers
            </div>
            <div
              className={`tab ${activeTab === 'queryParams' ? 'active' : ''}`}
              onClick={() => handleTabChange('queryParams')}
            >
              Query Params
            </div>
            <div
              className={`tab ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => handleTabChange('body')}
            >
              Body
            </div>
          </div>
          
          {activeTab === 'headers' && (
            <div className="form-group">
              <textarea
                value={typeof data.headers === 'object' ? JSON.stringify(data.headers, null, 2) : data.headers || ''}
                onChange={(e) => handleInputChange('headers', e.target.value)}
                placeholder="Enter headers as JSON"
                className="form-textarea"
                rows={3}
              />
            </div>
          )}
          
          {activeTab === 'queryParams' && (
            <div className="form-group">
              <textarea
                value={typeof data.queryParams === 'object' ? JSON.stringify(data.queryParams, null, 2) : data.queryParams || ''}
                onChange={(e) => handleInputChange('queryParams', e.target.value)}
                placeholder="Enter query parameters as JSON"
                className="form-textarea"
                rows={3}
              />
            </div>
          )}
          
          {activeTab === 'body' && data.method !== 'GET' && (
            <div className="form-group">
              <textarea
                value={typeof data.body === 'object' ? JSON.stringify(data.body, null, 2) : data.body || ''}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="Enter request body as JSON"
                className="form-textarea"
                rows={5}
              />
            </div>
          )}
          
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

export default HttpNode;
