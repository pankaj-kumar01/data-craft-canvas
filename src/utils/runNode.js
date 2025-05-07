import axios from "axios";
import get from 'lodash/get';

export async function runNode(node, results, incomers,updateNodeData) {

  const incomingNodeIdArray = incomers?.length>0 && incomers?.map((incoming) => incoming?.source);

  function getParams(queryParams) {
    var prevApiResponse = {}
    const resolvedParams = {};

    incomingNodeIdArray?.length > 0 && incomingNodeIdArray.forEach((incomingData) => {
      prevApiResponse = results[`${incomingData}`];

      Object.entries(queryParams).forEach(([paramKey, paramVal]) => {
        if (typeof paramVal === "string" && paramVal.startsWith("upstream.")) {
          // strip off "upstream." and grab the real value via lodash.get
          const path = paramVal.replace(/^upstream\./, "");
          resolvedParams[paramKey] = get(prevApiResponse, path);
        } else {
          resolvedParams[paramKey] = paramVal;
        }
      });
    })
    return incomingNodeIdArray?.length > 0? resolvedParams : queryParams;
  }

  switch (node.type) {

    case 'httpNode':
      {
        // Node data should, include method, url, params, headers, body, etc.
        updateNodeData(node, {
          isLoading: true,
          response: null,
          error: null,
        });
        const { method, url, queryParams, headers, body } = node.data;
        const endpoint = url.trim()
        const params = getParams(queryParams)
     
        const response = await axios({ method, url:endpoint, params: { ...params }, headers:{...headers}, data: {...body} });
        return response;
      }
    case 'graphNode': {
      return response.data;
    }
    case 'startNode':
    case 'start-node':
      return node?.data?.fields || {}
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}