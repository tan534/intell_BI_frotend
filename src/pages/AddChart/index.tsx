import { genChartUsingPost } from '@/services/intell_Bi/chartController';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Select, Space, Spin, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { UploadFile } from 'antd/es/upload/interface';

// 图表类型映射（和后端保持一致，value对应ECharts type）
const CHART_TYPE_OPTIONS = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'stack', label: '堆叠图' },
  { value: 'pie', label: '饼图' },
  { value: 'radar', label: '雷达图' },
];

// 文件格式校验
const isCsvFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
};

const AddChart: React.FC = () => {
  const [form] = Form.useForm();
  const [chartResult, setChartResult] = useState<{
    genResult: string;
    chartId?: number;
  }>();
  const [echartsOption, setEchartsOption] = useState<any>(null); // 初始null，避免空对象渲染
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [chartError, setChartError] = useState<string>('');

  // 修复：图表容器自适应高度
  const [chartHeight, setChartHeight] = useState<number>(400);
  useEffect(() => {
    const updateHeight = () => {
      const card = document.getElementById('chart-card');
      if (card) {
        setChartHeight(card.clientHeight - 60); // 减去标题栏高度
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  /**
   * 提交分析请求
   */
  const onFinish = async (values: any) => {
    // 1. 重置状态
    setSubmitting(true);
    setChartResult(undefined);
    setEchartsOption(null);
    setChartError('');

    // 2. 校验文件
    if (fileList.length === 0) {
      message.error('请先上传CSV/Excel文件');
      setSubmitting(false);
      return;
    }
    const file = fileList[0].originFileObj;
    if (!file || !isCsvFile(file)) {
      message.error('仅支持上传CSV/XLSX/XLS文件');
      setSubmitting(false);
      return;
    }

    try {
      // 3. 构建FormData
      const formData = new FormData();
      formData.append('goal', values.goal);
      formData.append('chartName', values.name);
      formData.append('chartType', values.chartType);
      formData.append('file', file);

      // 4. 调用后端接口
      const res: API.BaseResponseGenChart_ = await genChartUsingPost(formData);

      // 5. 校验接口响应
      if (res.code !== 0) {
        const errorMsg = res.message || '分析失败，请检查数据后重试';
        message.error(errorMsg);
        setChartError(errorMsg);
        setSubmitting(false);
        return;
      }

      if (!res.data) {
        const errorMsg = '未获取到分析结果，请重新上传数据';
        message.error(errorMsg);
        setChartError(errorMsg);
        setSubmitting(false);
        return;
      }

      // 6. 解析ECharts配置（修复：处理AI返回的JS格式/转义问题）
      let chartOption: any = null;
      try {
        let genChartStr = res.data.genChartStr || '';
        // 修复：处理AI返回的option = {}格式
        if (genChartStr.startsWith('option = ')) {
          genChartStr = genChartStr.replace('option = ', '').replace(';', '');
        }
        // 修复：单引号转双引号，处理JSON格式
        genChartStr = genChartStr.replace(/'/g, '"');
        chartOption = JSON.parse(genChartStr);

        if (!chartOption || Object.keys(chartOption).length === 0) {
          throw new Error('图表配置为空，无法渲染');
        }
      } catch (parseError) {
        console.error('图表配置解析失败:', parseError);
        const errorMsg = '图表配置解析失败，请检查数据格式后重新上传';
        message.error(errorMsg);
        setChartError(errorMsg);
        setSubmitting(false);
        return;
      }

      // 7. 处理分析结论（修复：数组转字符串，去除多余引号）
      let genResultStr = '分析成功';
      if (res.data.genResult) {
        if (Array.isArray(res.data.genResult)) {
          genResultStr = res.data.genResult.join('\n\n');
        } else if (typeof res.data.genResult === 'string') {
          // 修复：去除AI返回的多余引号/转义
          genResultStr = res.data.genResult.replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '"');
        }
      }

      // 8. 设置成功状态
      setEchartsOption(chartOption);
      setChartResult({
        genResult: genResultStr,
        chartId: res.data.chartId,
      });
      message.success(res.message || '分析成功');

    } catch (e: any) {
      const errorMsg = '分析失败：' + (e.message || '网络异常');
      message.error(errorMsg);
      setChartError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 重置表单和状态
   */
  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setChartResult(undefined);
    setEchartsOption(null);
    setChartError('');
  };

  return (
    <div style={{ 
      padding: '24px', 
      minHeight: '100vh', 
      boxSizing: 'border-box',
      backgroundColor: '#f5f7fa',
    }}>
      {/* 主布局：左侧分析配置，右侧结果展示（响应式） */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 2fr',
        gap: 24,
        height: '100%',
        maxWidth: 1600,
        margin: '0 auto',
      }}>
        {/* 左侧：分析配置 */}
        <Card 
          title="分析配置" 
          style={{ 
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
              style={{ marginBottom: 24 }}
            >
              <TextArea
                placeholder="例如：分析网站用户近7天的增长趋势，找出增长最快的时间段"
                rows={4}
                style={{ 
                  resize: 'none',
                  borderRadius: 4,
                }}
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="图表名称"
              rules={[{ required: true, message: '请输入图表名称' }]}
              style={{ marginBottom: 24 }}
            >
              <Input 
                placeholder="例如：网站用户增长趋势图"
                style={{ borderRadius: 4 }}
              />
            </Form.Item>

            <Form.Item
              name="chartType"
              label="图表类型"
              rules={[{ required: true, message: '请选择图表类型' }]}
              style={{ marginBottom: 24 }}
            >
              <Select 
                options={CHART_TYPE_OPTIONS} 
                placeholder="请选择图表类型"
                style={{ width: '100%', borderRadius: 4 }}
              />
            </Form.Item>

            <Form.Item 
              name="file" 
              label="数据文件"
              style={{ marginBottom: 32 }}
            >
              <Upload
                fileList={fileList}
                onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                beforeUpload={(file) => {
                  if (!isCsvFile(file)) {
                    message.error('仅支持CSV/XLSX/XLS格式！');
                    return false;
                  }
                  return true;
                }}
                disabled={submitting}
                maxCount={1}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  disabled={submitting}
                >
                  选择文件
                </Button>
              </Upload>
              <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                支持格式：.csv / .xlsx / .xls | 建议文件大小不超过 10MB
              </div>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 6 }}>
              <Space size="middle">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  style={{
                    padding: '0 32px',
                    fontSize: 16,
                    borderRadius: 4,
                  }}
                >
                  生成图表
                </Button>
                <Button
                  htmlType="reset"
                  onClick={handleReset}
                  disabled={submitting}
                  size="large"
                  style={{
                    padding: '0 32px',
                    fontSize: 16,
                    borderRadius: 4,
                  }}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 右侧：结果展示 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 上方：AI分析结论 */}
          <Card 
            title="AI分析结论" 
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              minHeight: 200,
            }}
          >
            <Spin spinning={submitting} tip="AI分析中...">
              {chartError ? (
                <div style={{ 
                  color: '#ff4d4f', 
                  lineHeight: 1.6, 
                  padding: 16,
                  fontSize: 14,
                }}>
                  ❌ {chartError}
                </div>
              ) : chartResult ? (
                <div style={{ 
                  lineHeight: 1.8, 
                  whiteSpace: 'pre-wrap',
                  padding: 16,
                  backgroundColor: '#f6ffed',
                  borderRadius: 6,
                  border: '1px solid #b7eb8f',
                  fontSize: 14,
                }}>
                  {chartResult.genResult}
                </div>
              ) : (
                <div style={{ 
                  color: '#999',
                  padding: 16,
                  textAlign: 'center',
                  fontSize: 14,
                }}>
                  请上传数据并点击「生成图表」获取分析结论
                </div>
              )}
            </Spin>
          </Card>

          {/* 下方：图表展示 */}
          <Card 
            title="可视化图表" 
            id="chart-card"
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              flex: 1,
              minHeight: 450,
            }}
            bodyStyle={{ 
              height: 'calc(100% - 57px)', // 减去标题栏高度
              padding: 16,
            }}
          >
            <Spin spinning={submitting} tip="图表生成中...">
              {chartError ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff4d4f',
                    flexDirection: 'column',
                  }}
                >
                  <p style={{ fontSize: 16, marginBottom: 8 }}>❌ 图表生成失败</p>
                  <p style={{ fontSize: 14 }}>{chartError}</p>
                </div>
              ) : echartsOption ? (
                <div style={{ height: '100%', width: '100%' }}>
                  <ReactECharts
                    option={echartsOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ 
                      renderer: 'canvas',
                      
                    }}
                    notMerge={true} // 修复：避免配置叠加
                    onError={(err) => {
                      console.error('ECharts渲染失败:', err);
                      setChartError('图表渲染异常，请检查数据格式');
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    backgroundColor: '#fafafa',
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                >
                  暂无图表数据，请先生成
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