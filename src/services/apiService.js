
import axios from 'axios';
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
    
    // Prepare request body
    let data = null;
    if (nodeData.body && nodeData.method !== 'GET') {
      try {
        // If body is a string, try to parse it as JSON
        if (typeof nodeData.body === 'string') {
          // First resolve any template variables in the string
          const resolvedBody = resolveTemplateVariables(nodeData.body, nodes);
          try {
            // Try to parse as JSON
            data = JSON.parse(resolvedBody);
          } catch (error) {
            // If not valid JSON, use as is
            data = resolvedBody;
          }
        } else if (typeof nodeData.body === 'object') {
          // If already an object, use as is
          data = resolveTemplateObject(nodeData.body, nodes);
        }
      } catch (error) {
        console.error('Error processing request body:', error);
      }
    }
    
    // Handle form data if provided (for POST requests)
    if (nodeData.formData && Object.keys(nodeData.formData).length > 0 && nodeData.method !== 'GET') {
      const formData = new FormData();
      Object.entries(resolveTemplateObject(nodeData.formData, nodes)).forEach(([key, value]) => {
        formData.append(key, value);
      });
      data = formData;
    }
    
    // Execute the request
    const response = await axios({
      method: nodeData.method || 'GET',
      url,
      headers,
      params,
      data,
      timeout: 30000, // 30 second timeout
    });
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        error: true,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
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
    const response = await axios({
      method: 'POST',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        query,
        variables,
      },
      timeout: 30000, // 30 second timeout
    });
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    if (error.response) {
      return {
        error: true,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else if (error.request) {
      throw new Error('No response received from server');
    } else {
      throw new Error(`GraphQL request failed: ${error.message}`);
    }
  }
};
