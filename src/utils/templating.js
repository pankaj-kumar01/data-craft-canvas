
/**
 * Resolves template variables in format {{nodeId.response.path.to.value}}
 * @param {string} template - String containing template variables
 * @param {Object} nodes - All nodes from the flow
 * @returns {string} - Resolved string with variables replaced with actual values
 */
export const resolveTemplateVariables = (template, nodes) => {
  if (!template || typeof template !== 'string') {
    return template;
  }
  
  // Find all {{...}} patterns
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return template;
  
  let result = template;
  
  for (const match of matches) {
    // Extract the path inside {{...}}
    const path = match.slice(2, -2).trim();
    const pathParts = path.split('.');
    
    // First part should be a node ID
    const nodeId = pathParts[0];
    const node = nodes.find(n => n.id === nodeId);
    
    if (!node) continue;
    
    // Navigate the path to find the value
    let value = node;
    for (let i = 1; i < pathParts.length; i++) {
      if (value === undefined || value === null) break;
      value = value[pathParts[i]];
    }
    
    // Replace the match with the found value
    if (value !== undefined && value !== null) {
      // Convert objects and arrays to JSON strings
      const replacement = typeof value === 'object' 
        ? JSON.stringify(value)
        : String(value);
      
      result = result.replace(match, replacement);
    }
  }
  
  return result;
};

/**
 * Resolves template variables in all properties of an object
 * @param {Object} obj - Object containing properties with template variables
 * @param {Object} nodes - All nodes from the flow
 * @returns {Object} - New object with all template variables resolved
 */
export const resolveTemplateObject = (obj, nodes) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = resolveTemplateVariables(value, nodes);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = resolveTemplateObject(value, nodes);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

/**
 * Parses a JSON string safely
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value to return if parsing fails
 * @returns {any} - Parsed JSON or default value
 */
export const safeJsonParse = (jsonString, defaultValue = {}) => {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return defaultValue;
  }
};

/**
 * Format a JSON object for display with syntax highlighting classes
 * @param {Object} json - JSON object to format
 * @returns {string} - HTML string with syntax highlighting classes
 */
export const formatJson = (json) => {
  if (!json) return '';
  
  try {
    const jsonString = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
    
    return jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return String(json);
  }
};
