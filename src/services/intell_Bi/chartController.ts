import { request } from "@umijs/max";

/** 删除图表 POST /api/chart/delete */
export async function deleteChartUsingPost(
  body: API.DeleteRequest,
) {
  return request<API.BaseResponseBoolean_>("/api/chart/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
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
) {
  return request('/api/chart/get', {
    method: 'GET',
    params,
  });
}

/** listMyChartByPage POST /api/chart/my/list/page */
export async function listMyChartByPageUsingPost(
  body: API.ChartQueryRequest, 
) {
  return request<API.BaseResponsePageChart_>('/api/chart/my/list/page', {
    method: 'POST',
    data: body, 
  });
}


/** 生成图表(同步) POST /api/chart/gen */
export async function genChartUsingPost(
  body: FormData,
) {
  return request<API.BaseResponseGenChart_>("/api/chart/gen", {
    method: "POST",
    data: body,
  });
}

/** 生成图表(异步) POST /api/chart/gen/async */
export async function genChartUsingPostAsync(body: FormData) {
  return request<API.BaseResponseInt_>('/api/chart/gen/async', {
    method: 'POST',
    data: body,
  });
}
