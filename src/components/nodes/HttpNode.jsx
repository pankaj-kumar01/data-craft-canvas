// src/components/nodes/HttpNode.jsx
import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronUp, Play, Trash2 } from 'lucide-react';
import { executeHttpRequest } from '../../services/apiService';
import { formatJson } from '../../utils/templating';
import { useFlow } from '../../contexts/FlowContext';
import { useFlowData } from '../../hooks/useFlowData';

const normalizeList = (maybeList) => {
  if (Array.isArray(maybeList)) return maybeList;
  if (maybeList && typeof maybeList === 'object') {
    return Object.entries(maybeList).map(([key, value]) => ({ key, value: String(value) }));
  }
  return [{ key: '', value: '' }];
};

const isGeocodeUrl = (url) => {
  try {
    return new URL(url).href.includes('api.opencagedata.com/geocode/v1/json');
  } catch {
    return false;
  }
};

const HttpNode = ({ id, data = {} }) => {
  const { updateNodeData, nodes, deleteNode } = useFlow();
  const upstream = useFlowData(id);

  const upstreamFields = upstream
    ? Object.entries(upstream).map(([key, value]) => ({ key, value: String(value) }))
    : [];

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(data.label || 'HTTP Request');
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [activeTab, setActiveTab] = useState(data.activeTab || 'headers');
  const [url, setUrl] = useState(data.url || '');
  const [headers, setHeaders] = useState(() => normalizeList(data.headers));
  const [queryParams, setQueryParams] = useState(() => normalizeList(data.queryParams));
  const [bodyFields, setBodyFields] = useState(() => normalizeList(data.body));

  useEffect(() => {
    if (!isEditingLabel) updateNodeData(id, { label: labelText });
  }, [isEditingLabel, labelText, id, updateNodeData]);

  useEffect(() => {
    updateNodeData(id, {
      url,
      headers: Object.fromEntries(headers.map(h => [h.key, h.value])),
      queryParams: Object.fromEntries(queryParams.map(p => [p.key, p.value])),
      body: Object.fromEntries(bodyFields.map(b => [b.key, b.value]))
    });
  }, [url, headers, queryParams, bodyFields, id, updateNodeData]);

  useEffect(() => {
    if (upstream && typeof upstream === 'object') {
      updateNodeData(id, { upstreamSnapshot: upstream });
    }
  }, [upstream, id, updateNodeData]);

  const executeRequest = async () => {
    updateNodeData(id, { isLoading: true, response: null, error: null });
    const payload = {
      ...data,
      url,
      headers: Object.fromEntries(headers.map(h => [h.key, h.value])),
      queryParams: Object.fromEntries(queryParams.map(p => [p.key, p.value])),
      body: data.method === 'POST'
        ? Object.fromEntries(bodyFields.map(b => [b.key, b.value]))
        : undefined
    };

    try {
      const response = await executeHttpRequest(payload, nodes);
      let responseData = response.data;
      if (isGeocodeUrl(url) && Array.isArray(responseData.results)) {
        responseData = {
          lat: responseData.results[0].geometry.lat,
          lng: responseData.results[0].geometry.lng,
          timezone: responseData.results[0].annotations.timezone.name
        };
      }
      updateNodeData(id, { isLoading: false, response: { ...response, data: responseData } });
    } catch (err) {
      updateNodeData(id, { isLoading: false, error: { message: err.message } });
    }
  };

  const updateList = (list, setList, type) => (idx, field, val) => {
    const next = list.map((item, i) => (i === idx ? { ...item, [field]: val } : item));
    setList(next);
    updateNodeData(id, { [type]: Object.fromEntries(next.map(i => [i.key, i.value])) });
  };

  const addToList = (setList, type) => () => {
    const base = type === 'headers' ? headers : type === 'queryParams' ? queryParams : bodyFields;
    const next = [...base, { key: '', value: '' }];
    setList(next);
    updateNodeData(id, { [type]: Object.fromEntries(next.map(i => [i.key, i.value])) });
  };

  const removeFromList = (list, setList, type) => (idx) => {
    const next = list.filter((_, i) => i !== idx);
    setList(next);
    updateNodeData(id, { [type]: Object.fromEntries(next.map(i => [i.key, i.value])) });
  };

  const handleCardClick = (key, value) => {
    const newItem = { key, value };
    if (data.method === 'GET') {
      if (!queryParams.find(p => p.key === key)) {
        const next = [...queryParams, newItem];
        setQueryParams(next);
        updateNodeData(id, {
          queryParams: Object.fromEntries(next.map(p => [p.key, p.value]))
        });
      }
    } else {
      if (!bodyFields.find(b => b.key === key)) {
        const next = [...bodyFields, newItem];
        setBodyFields(next);
        updateNodeData(id, {
          body: Object.fromEntries(next.map(b => [b.key, b.value]))
        });
      }
    }
  };

  const hasResponse = !!data.response;
  const isError = !!data.error;
  const statusCode = data.response?.status;
  const isSuccess = statusCode >= 200 && statusCode < 300;

  return (
    <div className="http-node border rounded-md shadow-md bg-white">
      <div className="node-header http flex items-center justify-between p-2 bg-blue-100">
        <div className="flex items-center gap-2">
          {isEditingLabel ? (
            <input
              className="form-input text-sm font-semibold"
              value={labelText}
              onChange={e => setLabelText(e.target.value)}
              onBlur={() => setIsEditingLabel(false)}
              autoFocus
            />
          ) : (
            <span className="cursor-text text-sm font-semibold" onDoubleClick={() => setIsEditingLabel(true)}>
              {labelText}
            </span>
          )}
          {data.isLoading && <span className="ml-2 text-xs">Loading...</span>}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={data.method}
            onChange={e => updateNodeData(id, { method: e.target.value })}
            className="form-select"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
          <button
            onClick={executeRequest}
            disabled={data.isLoading}
            className="p-1 rounded-full hover:bg-blue-200"
            title="Run"
          >
            <Play size={16} />
          </button>
          <button
            onClick={() => {
              setIsCollapsed(c => !c);
              updateNodeData(id, { isCollapsed: !isCollapsed });
            }}
            className="p-1 rounded-full hover:bg-blue-200"
            title="Toggle"
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={() => deleteNode(id)}
            className="p-1 rounded-full hover:bg-red-200"
            title="Delete"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="node-content p-2">
          {upstreamFields.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {upstreamFields.map(({ key, value }) => (
                <button
                  key={key}
                  className="px-2 py-1 bg-gray-200 rounded-full text-sm hover:bg-gray-300"
                  onClick={() => handleCardClick(key, value)}
                >
                  {key}: {value}
                </button>
              ))}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label block text-sm font-medium mb-1">Request URL</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://api..."
              className="form-input w-full"
            />
          </div>

          <div className="tabs mb-2 flex gap-2">
            <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>
              Headers
            </div>
            <div className={`tab ${activeTab === 'queryParams' ? 'active' : ''}`} onClick={() => setActiveTab('queryParams')}>
              Query Params
            </div>
            {data.method === 'POST' && (
              <div className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>
                Body
              </div>
            )}
          </div>

          {activeTab === 'headers' && headers.map((h, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <input
                className="form-input flex-1"
                placeholder="Key"
                value={h.key}
                onChange={e => updateList(headers, setHeaders, 'headers')(i, 'key', e.target.value)}
              />
              <input
                className="form-input flex-1"
                placeholder="Value"
                value={h.value}
                onChange={e => updateList(headers, setHeaders, 'headers')(i, 'value', e.target.value)}
              />
              <button onClick={() => removeFromList(headers, setHeaders, 'headers')(i)}>✕</button>
            </div>
          ))}
          {activeTab === 'headers' && (
            <button onClick={addToList(setHeaders, 'headers')} className="text-sm text-blue-600">+ Add Header</button>
          )}

          {activeTab === 'queryParams' && queryParams.map((p, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <input
                className="form-input flex-1"
                placeholder="Key"
                value={p.key}
                onChange={e => updateList(queryParams, setQueryParams, 'queryParams')(i, 'key', e.target.value)}
              />
              <input
                className="form-input flex-1"
                placeholder="Value"
                value={p.value}
                onChange={e => updateList(queryParams, setQueryParams, 'queryParams')(i, 'value', e.target.value)}
              />
              <button onClick={() => removeFromList(queryParams, setQueryParams, 'queryParams')(i)}>✕</button>
            </div>
          ))}
          {activeTab === 'queryParams' && (
            <button onClick={addToList(setQueryParams, 'queryParams')} className="text-sm text-blue-600">+ Add Param</button>
          )}

          {activeTab === 'body' && bodyFields.map((b, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <input
                className="form-input flex-1"
                placeholder="Key"
                value={b.key}
                onChange={e => updateList(bodyFields, setBodyFields, 'body')(i, 'key', e.target.value)}
              />
              <input
                className="form-input flex-1"
                placeholder="Value"
                value={b.value}
                onChange={e => updateList(bodyFields, setBodyFields, 'body')(i, 'value', e.target.value)}
              />
              <button onClick={() => removeFromList(bodyFields, setBodyFields, 'body')(i)}>✕</button>
            </div>
          ))}
          {activeTab === 'body' && (
            <button onClick={addToList(setBodyFields, 'body')} className="text-sm text-blue-600">+ Add Body Field</button>
          )}

          {hasResponse && (
            <div className={`response-panel ${isSuccess ? 'success' : 'error'} mt-2`}>
              <div className="response-header">Response {statusCode && `(${statusCode})`}</div>
              <div className="response-content">
                {isError ? (
                  <div className="text-red-500">{data.error?.message}</div>
                ) : (
                  <pre dangerouslySetInnerHTML={{ __html: formatJson(data.response.data) }} />
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

export default HttpNode;
