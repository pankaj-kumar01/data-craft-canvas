// src/components/nodes/HttpNode.jsx
import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import { executeHttpRequest } from '../../services/apiService';
import { formatJson } from '../../utils/templating';
import { useFlow } from '../../contexts/FlowContext';

// Ensure incoming data is always an array of { key, value }
const normalizeList = (maybeList) => {
  if (Array.isArray(maybeList)) return maybeList;
  if (maybeList && typeof maybeList === 'object') {
    return Object.entries(maybeList).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }
  return [{ key: '', value: '' }];
};

const HttpNode = ({ id, data }) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [activeTab, setActiveTab] = useState(data.activeTab || 'headers');
  const { updateNodeData, nodes } = useFlow();

  // Normalize initial lists
  const [headers, setHeaders] = useState(() => normalizeList(data.headers));
  const [queryParams, setQueryParams] = useState(() => normalizeList(data.queryParams));
  const [bodyFields, setBodyFields] = useState(() => normalizeList(data.body));

  // Sync lists back to node data
  useEffect(() => {
    updateNodeData(id, {
      headers,
      queryParams,
      body: bodyFields
    });
  }, [headers, queryParams, bodyFields, id, updateNodeData]);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    updateNodeData(id, { isCollapsed: next });
  };

  const handleMethodChange = (e) => {
    updateNodeData(id, { method: e.target.value });
    if (e.target.value === 'GET') {
      // Reset bodyFields when switching to GET
      setBodyFields([{ key: '', value: '' }]);
    }
  };

  const updateList = (list, setList) => (idx, field, val) => {
    setList(list.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const addToList = (setList) => () => {
    setList(prev => [...prev, { key: '', value: '' }]);
  };

  const removeFromList = (list, setList) => (idx) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const executeRequest = async () => {
    updateNodeData(id, { isLoading: true, response: null, error: null });

    const headersObj = headers.reduce((acc, { key, value }) => key ? { ...acc, [key]: value } : acc, {});
    const paramsObj = queryParams.reduce((acc, { key, value }) => key ? { ...acc, [key]: value } : acc, {});
    const bodyObj = bodyFields.reduce((acc, { key, value }) => key ? { ...acc, [key]: value } : acc, {});

    try {
      const payload = {
        ...data,
        headers: headersObj,
        queryParams: paramsObj,
        body: data.method === 'POST' ? bodyObj : undefined
      };
      const response = await executeHttpRequest(payload, nodes);
      updateNodeData(id, { isLoading: false, response });
    } catch (err) {
      updateNodeData(id, {
        isLoading: false,
        error: { message: err.message || 'Request failed' }
      });
    }
  };

  const hasResponse = !!data.response;
  const isError = !!data.error || (hasResponse && !!data.response.error);
  const statusCode = data.response?.status;
  const isSuccess = statusCode >= 200 && statusCode < 300;

  return (
    <div className="http-node">
      <div className="node-header http">
        <div className="flex items-center">
          <span>{data.label}</span>
          {data.isLoading && <span className="ml-2 text-xs">Loading...</span>}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={data.method}
            onChange={handleMethodChange}
            className="form-select"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
          <button
            className="p-1 rounded-full hover:bg-blue-400 transition-colors"
            onClick={executeRequest}
            disabled={data.isLoading}
            title="Run Request"
          >
            <Play size={16} />
          </button>
          <button
            className="p-1 rounded-full hover:bg-blue-400 transition-colors"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="node-content">
          {/* Tabs */}
          <div className="tabs mb-2">
            <div
              className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Headers
            </div>
            <div
              className={`tab ${activeTab === 'queryParams' ? 'active' : ''}`}
              onClick={() => setActiveTab('queryParams')}
            >
              Query Params
            </div>
            {data.method === 'POST' && (
              <div
                className={`tab ${activeTab === 'body' ? 'active' : ''}`}
                onClick={() => setActiveTab('body')}
              >
                Body
              </div>
            )}
          </div>

          {/* Headers */}
          {activeTab === 'headers' && (
            <div>
              {headers.map((h, i) => (
                <div key={i} className="flex space-x-2 mb-1">
                  <input
                    className="form-input flex-1"
                    placeholder="Key"
                    value={h.key}
                    onChange={e => updateList(headers, setHeaders)(i, 'key', e.target.value)}
                  />
                  <input
                    className="form-input flex-1"
                    placeholder="Value"
                    value={h.value}
                    onChange={e => updateList(headers, setHeaders)(i, 'value', e.target.value)}
                  />
                  <button onClick={() => removeFromList(headers, setHeaders)(i)}>✕</button>
                </div>
              ))}
              <button onClick={addToList(setHeaders)} className="text-sm text-blue-600">
                + Add Header
              </button>
            </div>
          )}

          {/* Query Params */}
          {activeTab === 'queryParams' && (
            <div>
              {queryParams.map((q, i) => (
                <div key={i} className="flex space-x-2 mb-1">
                  <input
                    className="form-input flex-1"
                    placeholder="Key"
                    value={q.key}
                    onChange={e => updateList(queryParams, setQueryParams)(i, 'key', e.target.value)}
                  />
                  <input
                    className="form-input flex-1"
                    placeholder="Value"
                    value={q.value}
                    onChange={e => updateList(queryParams, setQueryParams)(i, 'value', e.target.value)}
                  />
                  <button onClick={() => removeFromList(queryParams, setQueryParams)(i)}>✕</button>
                </div>
              ))}
              <button onClick={addToList(setQueryParams)} className="text-sm text-blue-600">
                + Add Param
              </button>
            </div>
          )}

          {/* Body (POST only) */}
          {activeTab === 'body' && data.method === 'POST' && (
            <div>
              {bodyFields.map((b, i) => (
                <div key={i} className="flex space-x-2 mb-1">
                  <input
                    className="form-input flex-1"
                    placeholder="Key"
                    value={b.key}
                    onChange={e => updateList(bodyFields, setBodyFields)(i, 'key', e.target.value)}
                  />
                  <input
                    className="form-input flex-1"
                    placeholder="Value"
                    value={b.value}
                    onChange={e => updateList(bodyFields, setBodyFields)(i, 'value', e.target.value)}
                  />
                  <button onClick={() => removeFromList(bodyFields, setBodyFields)(i)}>✕</button>
                </div>
              ))}
              <button onClick={addToList(setBodyFields)} className="text-sm text-blue-600">
                + Add Body Field
              </button>
            </div>
          )}

          {/* Response */}
          {hasResponse && (
            <div className={`response-panel ${isSuccess ? 'success' : 'error'} mt-2`}>
              <div className="response-header">{`Response (${statusCode})`}</div>
              <div className="response-content">
                {isError
                  ? <div className="text-red-500">{data.error?.message}</div>
                  : <pre dangerouslySetInnerHTML={{ __html: formatJson(data.response.data) }} />
                }
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

export default HttpNode;
