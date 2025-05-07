import axios from 'axios';
import get from 'lodash/get';

export async function runNode(node, results, incomers) {
  const incomingIds = incomers.map(i => i.source);


  function resolveParams(queryParams) {
    const out = {};
    const PREFIX = /^upstream(?:\.data)?\./;
    Object.entries(queryParams || {}).forEach(([key, val]) => {
      if (typeof val === 'string' && val.startsWith('upstream.')) {
        const path = val.replace(PREFIX, '');
        // find the last upstream that wrote this key

        for (let i = incomingIds.length - 1; i >= 0; i--) {
          const upstreamData = results[incomingIds[i]] || {};

          const v = get(upstreamData, path);
          if (v !== undefined) {
            out[key] = v;
            return;
          }
        }
        out[key] = undefined;
      } else {
        out[key] = val;
      }
    });
    return out;
  }

  switch (node.type) {
    case 'httpNode': {
      const { method, url, queryParams, headers, body } = node.data;
      const response = await axios({
        method,
        url: url.trim(),
        params: resolveParams(queryParams),
        headers,
        data: body,
      });
      // return the full response so we have both .status and .data
      return response;
    }

    case 'startNode':
    case 'start-node': {
      // simply return its user-entered fields as the "response"
      return {
        status: 200,
        data: node.data.fields || {},
      };
    }

    // you can add more node types here...
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
