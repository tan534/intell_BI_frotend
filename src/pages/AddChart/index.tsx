import { genChartUsingPost, updateChartUsingPost, getChartByIdUsingGET } from '@/services/intell_Bi/chartController';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Select, Space, Spin, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { UploadFile } from 'antd/es/upload/interface';
import { useParams } from 'react-router-dom';

// 图表类型映射
const CHART_TYPE_OPTIONS = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'stack', label: '堆叠图' },
  { value: 'pie', label: '饼图' },
  { value: 'radar', label: '雷达图' },
];
const CHART_TYPE_LABELS: Record<string, string> = {
  line: '折线图',
  bar: '柱状图',
  stack: '堆叠图',
  pie: '饼图',
  radar: '雷达图',
};

// 文件格式校验
const isCsvFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
};

const normalizeEchartsOption = (option: any, chartName?: string) => {
  if (!option || typeof option !== 'object') {
    return option;
  }
  const normalized = { ...option };
  normalized.textStyle = {
    fontFamily: 'Arial, "PingFang SC", sans-serif',
    ...(option.textStyle || {}),
  };
  if (!normalized.tooltip) {
    normalized.tooltip = {
      trigger: option.series?.[0]?.type === 'pie' ? 'item' : 'axis',
      axisPointer: { type: 'shadow' },
      textStyle: { fontSize: 12 },
    };
  }
  if (!normalized.grid && ['line', 'bar', 'stack'].includes(option.series?.[0]?.type)) {
    normalized.grid = { left: '12%', right: '8%', top: '20%', bottom: '12%', containLabel: true };
  }
  if (!normalized.legend && Array.isArray(option.series) && option.series.length > 1) {
    normalized.legend = { top: 42, left: 'center', textStyle: { fontSize: 12 } };
  }
  if (!normalized.title && chartName) {
    normalized.title = {
      text: chartName,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 18, fontWeight: 600 },
    };
  }
  if (!normalized.toolbox) {
    normalized.toolbox = {
      feature: { saveAsImage: { title: '保存为图片' } },
      right: 10,
    };
  }
  if (normalized.series && Array.isArray(normalized.series)) {
    normalized.series = normalized.series.map((seriesItem: any) => ({
      ...seriesItem,
      label: seriesItem.label || { show: false },
    }));
  }
  return normalized;
};

const AddChart: React.FC = () => {
  const [form] = Form.useForm();
  const { id } = useParams(); // 从路由获取图表ID
  const isEdit = !!id; // 是否是编辑模式

  const [chartResult, setChartResult] = useState<{
    genResult: string;
    chartId?: number;
  }>();
  const [echartsOption, setEchartsOption] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [chartError, setChartError] = useState<string>('');
  const [chartMeta, setChartMeta] = useState<{ name?: string; type?: string }>();

  // ==============================================
  // 🔥 核心：编辑模式 → 自动回填旧数据
  // ==============================================
  useEffect(() => {
    if (!isEdit) return;

    const loadOldChart = async () => {
      try {
        const res = await getChartByIdUsingGET({ id: Number(id) });
        if (res.code !== 0 || !res.data) {
          message.error('加载图表失败');
          return;
        }
        const chart = res.data;

        // 回填表单
        form.setFieldsValue({
          name: chart.chartName,
          goal: chart.goal,
          chartType: chart.chartType,
        });

        // 回填图表
        if (chart.genChart) {
          try {
            const opt = JSON.parse(chart.genChart);
            setEchartsOption(normalizeEchartsOption(opt, chart.chartName));
          } catch (e) { }
        }

        // 回填结论
        setChartResult({
          genResult: chart.genResult || '',
          chartId: chart.id,
        });

        setChartMeta({
          name: chart.chartName,
          type: chart.chartType,
        });

      } catch (err) {
        message.error('加载数据失败');
      }
    };

    loadOldChart();
  }, [id, form]);

  // ==============================================
  // 提交：区分 新增 / 编辑
  // ==============================================
  const onFinish = async (values: any) => {
    setSubmitting(true);
    setChartResult(undefined);
    setEchartsOption(null);
    setChartError('');

    try {
      // ------------------------------
      // 编辑模式：更新（不用传文件）
      // ------------------------------
      if (isEdit) {
        const res = await updateChartUsingPost({
          id: Number(id),
          goal: values.goal,
          chartName: values.name,
          chartType: values.chartType,
        });

        if (res.code !== 0 || !res.data) {
          message.error(res.message || '更新失败');
          setSubmitting(false);
          return;
        }

        const newChart = res.data;
        let newOption = null;
        try {
          newOption = JSON.parse(newChart.genChart || '');
        } catch (e) { }

        setEchartsOption(normalizeEchartsOption(newOption, values.name));
        setChartResult({
          genResult: newChart.genResult || '',
          chartId: newChart.id,
        });
        setChartMeta({ name: values.name, type: values.chartType });
        message.success('更新成功！');
        return;
      }

      // ------------------------------
      // 新增模式（原来的逻辑）
      // ------------------------------
      if (fileList.length === 0) {
        message.error('请先上传文件');
        setSubmitting(false);
        return;
      }
      const file = fileList[0].originFileObj;
      if (!file || !isCsvFile(file)) {
        message.error('文件格式错误');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('goal', values.goal);
      formData.append('chartName', values.name);
      formData.append('chartType', values.chartType);
      formData.append('file', file);

      const res: API.BaseResponseGenChart_ = await genChartUsingPost(formData);

      if (res.code !== 0 || !res.data) {
        message.error(res.message || '生成失败');
        setSubmitting(false);
        return;
      }

      let chartOption = null;
      try {
        let genChartStr = res.data.genChartStr || '';
        genChartStr = genChartStr.replace(/option = /, '').replace(/;/g, '').replace(/'/g, '"');
        chartOption = JSON.parse(genChartStr);
      } catch (e) {
        message.error('图表解析失败');
        setSubmitting(false);
        return;
      }

      let genResultStr = '分析成功';
      if (res.data.genResult) {
        if (Array.isArray(res.data.genResult)) {
          genResultStr = res.data.genResult.join('\n\n');
        } else {
          genResultStr = String(res.data.genResult).replace(/^"|"$/g, '');
        }
      }

      setEchartsOption(normalizeEchartsOption(chartOption, values.name));
      setChartResult({
        genResult: genResultStr,
        chartId: res.data.chartId,
      });
      setChartMeta({ name: values.name, type: values.chartType });
      message.success('生成成功！');

    } catch (e: any) {
      message.error('操作失败：' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setChartResult(undefined);
    setEchartsOption(null);
    setChartError('');
    setChartMeta(undefined);
  };

  return (
    <div style={{
      padding: '24px',
      minHeight: '100vh',
      boxSizing: 'border-box',
      backgroundColor: '#f5f7fa',
    }}>
      <div style={{
        display: 'flex',
        gap: 24,
        alignItems: 'stretch',
        maxWidth: 1800,
        margin: '0 auto',
      }}>
        {/* 左侧配置 */}
        <Card
          title="分析配置"
          style={{
            width: 380,
            flexShrink: 0,
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            height: 'fit-content',
            position: 'sticky',
            top: 24,
          }}
        >
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
            initialValues={{ chartType: 'line' }}
          >
            <Form.Item
              name="goal"
              label="分析目标"
              rules={[{ required: true, message: '请输入分析目标' }]}
            >
              <TextArea rows={4} placeholder="例如：分析用户增长趋势" style={{ borderRadius: 4 }} />
            </Form.Item>

            <Form.Item
              name="name"
              label="图表名称"
              rules={[{ required: true, message: '请输入图表名称' }]}
            >
              <Input placeholder="例如：用户增长图" style={{ borderRadius: 4 }} />
            </Form.Item>

            <Form.Item
              name="chartType"
              label="图表类型"
              rules={[{ required: true, message: '请选择图表类型' }]}
            >
              <Select options={CHART_TYPE_OPTIONS} style={{ borderRadius: 4 }} />
            </Form.Item>

            {/* 编辑模式隐藏上传文件 */}
            {!isEdit && (
              <Form.Item name="file" label="数据文件">
                <Upload
                  fileList={fileList}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  beforeUpload={(file) => {
                    if (!isCsvFile(file)) {
                      message.error('仅支持CSV/Excel');
                      return false;
                    }
                    return true;
                  }}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>选择文件</Button>
                </Upload>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  支持 .csv / .xlsx / .xls
                </div>
              </Form.Item>
            )}

            <Form.Item wrapperCol={{ offset: 6 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting} size="large">
                  {isEdit ? '重新生成' : '生成图表'}
                </Button>
                <Button onClick={handleReset} disabled={submitting} size="large">
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 右侧展示 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card title="AI分析结论" style={{ borderRadius: 8 }} bodyStyle={{ padding: 16 }}>
            <Spin spinning={submitting} tip="AI分析中...">
              {chartError ? (
                <div style={{ color: '#ff4d4f' }}>❌ {chartError}</div>
              ) : chartResult ? (
                <div style={{
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  padding: 16,
                  backgroundColor: '#f6ffed',
                  borderRadius: 6,
                  border: '1px solid #b7eb8f',
                }}>
                  {chartResult.genResult}
                </div>
              ) : (
                <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>
                  请上传数据并生成图表
                </div>
              )}
            </Spin>
          </Card>

          <Card
            title="可视化图表"
            style={{ flex: 1, minHeight: 500, borderRadius: 8 }}
            bodyStyle={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Spin spinning={submitting} tip="图表生成中..." style={{ flex: 1 }}>
              {chartMeta && (
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <span>图表名称：{chartMeta.name}</span>
                  <span>图表类型：{CHART_TYPE_LABELS[chartMeta.type || '']}</span>
                </div>
              )}

              {chartError ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4f' }}>
                  ❌ 图表生成失败
                </div>
              ) : echartsOption ? (
                <div style={{ flex: 1, minHeight: 400 }}>
                  <ReactECharts
                    key={isEdit ? id : undefined}
                    option={echartsOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  暂无图表数据
                </div>
              )}
            </Spin>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddChart;