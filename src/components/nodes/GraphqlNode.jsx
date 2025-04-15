import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronUp, Play, BarChart2, FileText } from 'lucide-react';
import { executeGraphQLRequest } from '../../services/apiService';
import { formatJson } from '../../utils/templating';
import { useFlow } from '../../contexts/FlowContext';
import { useFlowData } from '../../hooks/useFlowData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const GraphqlNode = ({ id, data }) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [viewMode, setViewMode] = useState('json');
  const upstreamData = useFlowData(id);
  const { updateNodeData, nodes } = useFlow();

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    updateNodeData(id, { isCollapsed: next });
  };

  const handleInputChange = (field, value) => {
    updateNodeData(id, { [field]: value });
  };

  const executeRequest = async () => {
    updateNodeData(id, { isLoading: true, response: null, error: null });
    try {
      const payload = {
        ...data,
        variables: upstreamData ?? data.variables
      };
      const response = await executeGraphQLRequest(payload, nodes);
      updateNodeData(id, { isLoading: false, response });
    } catch (err) {
      updateNodeData(id, {
        isLoading: false,
        error: { message: err.message || 'GraphQL request failed' }
      });
    }
  };

  const hasResponse = !!data.response;
  const isError = !!data.error || (hasResponse && !!data.response.error);
  const statusCode = data.response?.status;
  const isSuccess = statusCode >= 200 && statusCode < 300;

  const extractGraphData = () => {
    if (!hasResponse || isError || !data.response.data) return [];
    const resp = data.response.data;
    let arr = [];

    if (Array.isArray(resp.data)) {
      arr = resp.data;
    } else {
      for (const key in resp) {
        if (Array.isArray(resp[key])) {
          arr = resp[key];
          break;
        } else if (resp[key] && typeof resp[key] === 'object') {
          for (const nested in resp[key]) {
            if (Array.isArray(resp[key][nested])) {
              arr = resp[key][nested];
              break;
            }
          }
        }
      }
    }

    if (arr.length) {
      const first = arr[0];
      const numericFields = Object.keys(first).filter(k => typeof first[k] === 'number');
      if (numericFields.length) {
        return arr.slice(0, 10).map((item, idx) => {
          const obj = { name: item.name || item.title || item.id || `Item ${idx + 1}` };
          numericFields.forEach(f => (obj[f] = item[f]));
          return obj;
        });
      }
    }
    return [];
  };

  const graphData = hasResponse ? extractGraphData() : [];
  const hasGraphData = graphData.length > 0;
  const graphFields = hasGraphData ? Object.keys(graphData[0]).filter(k => k !== 'name') : [];
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
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="node-content">
          {/* Endpoint */}
          <div className="form-group">
            <label className="form-label">Endpoint</label>
            <input
              type="text"
              value={data.endpoint || ''}
              onChange={e => handleInputChange('endpoint', e.target.value)}
              placeholder="Enter GraphQL endpoint URL"
              className="form-input"
            />
          </div>

          {/* Query */}
          <div className="form-group">
            <label className="form-label">Query</label>
            <textarea
              value={data.query || ''}
              onChange={e => handleInputChange('query', e.target.value)}
              placeholder="Enter GraphQL query"
              className="form-textarea"
              rows={5}
            />
          </div>

          {/* Variables */}
          <div className="form-group">
            <label className="form-label">Variables</label>
            <textarea
              value={typeof data.variables === 'object' ? JSON.stringify(data.variables, null, 2) : data.variables || ''}
              onChange={e => handleInputChange('variables', e.target.value)}
              placeholder="Enter variables as JSON"
              className="form-textarea"
              rows={3}
            />
          </div>

          {/* Response */}
          {hasResponse && (
            <div className={`response-panel ${isSuccess ? 'success' : 'error'}`}>
              <div className="response-header flex justify-between items-center">
                <span>
                  Response {statusCode && `(${statusCode} ${data.response.statusText || ''})`}
                </span>
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
                  <div className="text-red-500">{data.error?.message || 'Request failed'}</div>
                ) : viewMode === 'json' ? (
                  <pre dangerouslySetInnerHTML={{ __html: formatJson(data.response.data) }} />
                ) : hasGraphData ? (
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={graphData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        {graphFields.map((field, idx) => (
                          <Bar key={field} dataKey={field} fill={randomColors[idx % randomColors.length]} />
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

      <Handle type="target" position={Position.Left} id="in" style={{ left: -8 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ right: -8 }} />
    </div>
  );
};

export default GraphqlNode;
