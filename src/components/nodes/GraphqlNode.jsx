
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronUp, Play, BarChart2, FileText } from 'lucide-react';
import { executeGraphQLRequest } from '../../services/apiService';
import { formatJson } from '../../utils/templating';
import { useFlow } from '../../contexts/FlowContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GraphqlNode = ({ id, data }) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [viewMode, setViewMode] = useState('json'); // 'json' or 'graph'
  
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
  
  // Extract data for graph visualization
  const extractGraphData = () => {
    if (!hasResponse || isError || !data.response.data) {
      return [];
    }
    
    // Try to find arrays in the response data to visualize
    const responseData = data.response.data;
    let graphData = [];
    
    // Handle different possible data structures
    if (responseData.data && Array.isArray(responseData.data)) {
      // If data is directly in a 'data' property
      graphData = responseData.data;
    } else {
      // Look for the first array in the response
      for (const key in responseData) {
        if (Array.isArray(responseData[key])) {
          graphData = responseData[key];
          break;
        } else if (responseData[key] && typeof responseData[key] === 'object') {
          // Look one level deeper
          for (const nestedKey in responseData[key]) {
            if (Array.isArray(responseData[key][nestedKey])) {
              graphData = responseData[key][nestedKey];
              break;
            }
          }
        }
      }
    }
    
    // If we found array data, prepare it for the chart
    if (graphData.length > 0) {
      // Find numeric fields to visualize
      const firstItem = graphData[0];
      const numericFields = Object.keys(firstItem).filter(key => 
        typeof firstItem[key] === 'number'
      );
      
      if (numericFields.length > 0) {
        return graphData.slice(0, 10).map((item, index) => {
          const result = { name: item.name || item.title || item.id || `Item ${index + 1}` };
          numericFields.forEach(field => {
            result[field] = item[field];
          });
          return result;
        });
      }
    }
    
    return [];
  };
  
  const graphData = hasResponse ? extractGraphData() : [];
  const hasGraphData = graphData.length > 0;
  
  // Get fields for the chart
  const getGraphFields = () => {
    if (!hasGraphData || graphData.length === 0) return [];
    const firstItem = graphData[0];
    return Object.keys(firstItem).filter(key => key !== 'name' && typeof firstItem[key] === 'number');
  };
  
  const graphFields = getGraphFields();
  const randomColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];
  
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
              <div className="response-header flex justify-between items-center">
                <span>Response {statusCode && `(${statusCode} ${data.response.statusText || ''})`}</span>
                
                {isSuccess && (
                  <div className="flex">
                    <button 
                      className={`p-1 rounded ${viewMode === 'json' ? 'bg-purple-200' : ''}`}
                      onClick={() => setViewMode('json')}
                      title="JSON View"
                    >
                      <FileText size={14} />
                    </button>
                    <button 
                      className={`p-1 rounded ml-1 ${viewMode === 'graph' ? 'bg-purple-200' : ''}`}
                      onClick={() => setViewMode('graph')}
                      title="Graph View"
                      disabled={!hasGraphData}
                    >
                      <BarChart2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="response-content">
                {isError ? (
                  <div className="text-red-500">
                    {data.error?.message || 'Request failed'}
                  </div>
                ) : viewMode === 'json' ? (
                  <pre
                    dangerouslySetInnerHTML={{
                      __html: formatJson(data.response.data)
                    }}
                  />
                ) : hasGraphData ? (
                  <div className="graph-container" style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={graphData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        {graphFields.map((field, index) => (
                          <Bar 
                            key={field} 
                            dataKey={field} 
                            name={field} 
                            fill={randomColors[index % randomColors.length]} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No data available for visualization
                  </div>
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
