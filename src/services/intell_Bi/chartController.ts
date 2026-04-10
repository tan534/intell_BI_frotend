// @ts-ignore
/* eslint-disable */
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

/** editChart POST /api/chart/edit */
export async function editChartUsingPost(
  body: API.ChartEditRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/chart/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据 ID 获取图表 GET /api/chart/get/${param0} */
export async function getChartByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getChartByIdUsingGETParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseChart_>(`/api/chart/get/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
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

/** 更新图表 POST /api/chart/update */
export async function updateChartUsingPost(
  body: API.ChartUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>("/api/chart/update", {
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
