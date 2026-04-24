import { genChartUsingPostAsync } from '@/services/intell_Bi/chartController';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Select, Space, Spin, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'stack', label: '堆叠图' },
  { value: 'pie', label: '饼图' },
  { value: 'radar', label: '雷达图' },
];

const isCsvFile = (file: File) => {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
};

const AddChartAsync: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 提交 → 异步接口
  const onFinish = async (values: any) => {
    setSubmitting(true);

    try {
      if (fileList.length === 0) {
        message.error('请上传文件');
        setSubmitting(false);
        return;
      }

      const file = fileList[0]?.originFileObj;
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

      // 调用 异步接口
      const res = await genChartUsingPostAsync(formData);

      if (res.code !== 0) {
        message.error(res.message || '提交失败');
        setSubmitting(false);
        return;
      }

      // ✅ 你要的提示
      message.success('图表生成中，可在图表页面查看生成状态');

      form.resetFields();
      setFileList([]);

    } catch (e) {
      message.error('提交失败：' + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card title="异步智能分析（后台生成）" style={{ maxWidth: 600, margin: '0 auto' }}>
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
            rules={[{ required: true }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="name"
            label="图表名称"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="chartType"
            label="图表类型"
            rules={[{ required: true }]}
          >
            <Select options={CHART_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="file" label="上传文件">
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 6 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交生成
              </Button>
              <Button onClick={() => { form.resetFields(); setFileList([]); }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddChartAsync;