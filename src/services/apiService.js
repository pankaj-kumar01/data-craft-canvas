
import { resolveTemplateVariables, resolveTemplateObject, safeJsonParse } from '../utils/templating';

/**
 * Execute an HTTP request based on node configuration
 * @param {Object} nodeData - Node data with request configuration
 * @param {Array} nodes - All nodes in the flow for variable resolution
 * @returns {Promise} - Promise resolving to response object
 */
export const executeHttpRequest = async (nodeData, nodes) => {
  try {
    // Resolve template variables in URL
    const url = resolveTemplateVariables(nodeData.url, nodes);
    if (!url) {
      throw new Error('URL is required');
    }
    
    // Prepare headers
    let headers = {};
    if (nodeData.headers && typeof nodeData.headers === 'string') {
      try {
        headers = safeJsonParse(nodeData.headers, {});
      } catch (error) {
        console.error('Invalid headers JSON:', error);
      }
    } else if (nodeData.headers && typeof nodeData.headers === 'object') {
      headers = nodeData.headers;
    }
    
    // Resolve template variables in headers
    headers = resolveTemplateObject(headers, nodes);
    
    // Prepare query parameters
    let params = {};
    if (nodeData.queryParams && typeof nodeData.queryParams === 'string') {
      try {
        params = safeJsonParse(nodeData.queryParams, {});
      } catch (error) {
        console.error('Invalid query params JSON:', error);
      }
    } else if (nodeData.queryParams && typeof nodeData.queryParams === 'object') {
      params = nodeData.queryParams;
    }
    
    // Resolve template variables in query params
    params = resolveTemplateObject(params, nodes);
    
    // Build URL with query parameters
    const urlWithParams = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      urlWithParams.searchParams.append(key, value);
    });
    
    // Prepare request body
    let body = null;
    if (nodeData.body && nodeData.method !== 'GET') {
      try {
        // If body is a string, try to parse it as JSON
        if (typeof nodeData.body === 'string') {
          // First resolve any template variables in the string
          const resolvedBody = resolveTemplateVariables(nodeData.body, nodes);
          try {
            // Try to parse as JSON
            body = JSON.parse(resolvedBody);
          } catch (error) {
            // If not valid JSON, use as is
            body = resolvedBody;
          }
        } else if (typeof nodeData.body === 'object') {
          // If already an object, use as is
          body = resolveTemplateObject(nodeData.body, nodes);
        }
      } catch (error) {
        console.error('Error processing request body:', error);
      }
    }
    
    // Handle form data if provided (for POST requests)
    let formData;
    if (nodeData.formData && Object.keys(nodeData.formData).length > 0 && nodeData.method !== 'GET') {
      formData = new FormData();
      Object.entries(resolveTemplateObject(nodeData.formData, nodes)).forEach(([key, value]) => {
        formData.append(key, value);
      });
      body = formData;
    }
    
    // Execute the request
    const options = {
      method: nodeData.method || 'GET',
      headers: formData ? {} : { ...headers, 'Content-Type': 'application/json' },
      body: formData || (body && nodeData.method !== 'GET' ? JSON.stringify(body) : undefined)
    };
    
    // Don't add content-type for FormData (browser will set it with boundary)
    if (formData && options.headers['Content-Type']) {
      delete options.headers['Content-Type'];
    }
    
    const response = await fetch(urlWithParams.toString(), options);
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries([...response.headers.entries()]),
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request was aborted');
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error or CORS issue');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

/**
 * Execute a GraphQL request based on node configuration
 * @param {Object} nodeData - Node data with request configuration
 * @param {Array} nodes - All nodes in the flow for variable resolution
 * @returns {Promise} - Promise resolving to response object
 */
export const executeGraphQLRequest = async (nodeData, nodes) => {
  try {
    // Resolve template variables in endpoint
    const endpoint = resolveTemplateVariables(nodeData.endpoint, nodes);
    if (!endpoint) {
      throw new Error('GraphQL endpoint is required');
    }
    
    // Resolve template variables in query
    const query = resolveTemplateVariables(nodeData.query, nodes);
    if (!query) {
      throw new Error('GraphQL query is required');
    }
    
    // Prepare variables
    let variables = {};
    if (nodeData.variables) {
      try {
        if (typeof nodeData.variables === 'string') {
          const resolvedVariables = resolveTemplateVariables(nodeData.variables, nodes);
          variables = JSON.parse(resolvedVariables);
        } else if (typeof nodeData.variables === 'object') {
          variables = resolveTemplateObject(nodeData.variables, nodes);
        }
      } catch (error) {
        console.error('Invalid GraphQL variables:', error);
      }
    }
    
    // Execute the GraphQL request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries([...response.headers.entries()]),
    };
  } catch (error) {
    throw new Error(`GraphQL request failed: ${error.message}`);
  }
};
