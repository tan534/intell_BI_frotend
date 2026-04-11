import { request } from "@umijs/max";

/** 删除图表 POST /api/chart/delete */
export async function deleteChartUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/chart/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/**
 * 更新图表
 */
export async function updateChartUsingPost(body: API.ChartUpdateRequest) {
  return request('/api/chart/update', {
    method: 'POST',
    data: body,
  });
}

export async function getChartByIdUsingGET(
  params: API.ChartGetRequest,
  options?: { [key: string]: any }
) {
  return request('/api/chart/get', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getChartByIdUsingGet(
  params: API.ChartGetRequest,
  options?: { [key: string]: any }
) {
  return getChartByIdUsingGET(params, options);
}

/** listChartByPage POST /api/chart/list/page */
export async function listChartByPageUsingPost(
  body: API.ChartQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageChart_>("/api/chart/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** listMyChartByPage POST /api/chart/my/list/page */
export async function listMyChartByPageUsingPost(
  body: API.ChartQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageChart_>("/api/chart/my/list/page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}


/** 生成图表 POST /api/chart/gen */
export async function genChartUsingPost(
  body: FormData,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseGenChart_>("/api/chart/gen", {
    method: "POST",
    data: body,
    ...(options || {}),
  });
}
