import { Footer } from '@/components';
import { PlusOutlined, ArrowLeftOutlined, UploadOutlined,  } from '@ant-design/icons'; // ✅ 补充 Button 导入
import { ProForm, ProFormText, ProFormTextArea, ProFormSelect} from '@ant-design/pro-components'; // ✅ 替换 ProFormUploadButton 为 ProFormUpload
import { Helmet, history, Link } from '@umijs/max';
import { Button, Card, Space, message } from 'antd'; // ✅ 移除无用的 Alert/App 导入
import { createStyles } from 'antd-style';
import React, { useState, useRef } from 'react';
import { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import Settings from '../../../config/defaultSettings';
// 导入生成图表的接口（替换原有add接口，因为上传文件需要调用/gen）
import { genChartUsingPost } from '@/services/intell_Bi/chartController';

// 样式配置（和登录页风格统一）
const useStyles = createStyles(({ token }) => {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    cardContainer: {
      flex: 1,
      padding: '32px 0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    formCard: {
      minWidth: 400,
      maxWidth: 600,
      width: '100%',
      padding: '24px',
      borderRadius: token.borderRadiusLG,
      boxShadow: token.boxShadow,
    },
    formHeader: {
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    formTitle: {
      fontSize: token.fontSizeHeading3,
      fontWeight: 600,
      color: token.colorTextHeading,
    },
    uploadTip: {
      marginTop: 8,
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      paddingLeft: 12, // ✅ 新增：和表单标签对齐
      lineHeight: 1.4, // ✅ 新增：提升可读性
    },
  };
});

// 图表类型选项（和AI模板/后端一致）
const CHART_TYPE_OPTIONS = [
  { label: '折线图', value: 'line' },
  { label: '柱状图', value: 'bar' },
  { label: '饼图', value: 'pie' },
  { label: '散点图', value: 'scatter' },
  { label: '直方图', value: 'histogram' },
];

// 文件格式校验（仅支持Excel）
const beforeUpload = (file: RcFile) => {
  // ✅ 仅校验Excel格式，删除CSV相关
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    || file.type === 'application/vnd.ms-excel';
  if (!isExcel) {
    message.error('仅支持上传 .xlsx / .xls 格式的Excel文件！');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('文件大小不能超过 2MB！'); // ✅ 修正标点符号
    return false;
  }
  return true;
};

const AddChart: React.FC = () => {
  const { styles } = useStyles();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const fileRef = useRef<UploadFile[]>([]); // 存储上传的文件

  // 文件上传回调（暂存文件，不上传至服务器）
  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    // 只保留已上传/待上传的文件
    fileRef.current = newFileList.filter(file => file.status !== 'removed');
  };

  // 提交表单+文件上传逻辑
  const handleSubmit = async (values: API.ChartGenRequest) => {
    try {
      // 1. 校验文件是否上传
      if (fileRef.current.length === 0) {
        message.error('请先上传Excel数据文件！'); // ✅ 提示更精准
        return;
      }

      setSubmitting(true);
      
      // 2. 构建FormData（文件+表单参数）
      const formData = new FormData();
      // 添加文件（类型断言确保安全）
      const originFile = fileRef.current[0].originFileObj;
      if (!originFile) {
        message.error('文件解析失败，请重新上传！');
        setSubmitting(false);
        return;
      }
      formData.append('file', originFile as RcFile);
      // 添加表单参数
      formData.append('chartName', values.chartName);
      formData.append('goal', values.goal);
      formData.append('chartType', values.chartType);

      // 3. 调用生成图表接口（含文件上传）
      const res = await genChartUsingPost(formData);
      
      if (res.code === 0) {
        // ✅ 兼容data为对象或数字的情况
        const chartId = typeof res.data === 'object' ? res.data.id : res.data;
        message.success(`图表生成成功！图表ID：${chartId}`);
        // 跳转至图表详情/列表页
        history.push(`/chart/detail/${chartId}`);
        return;
      } else {
        message.error(res.message || '生成图表失败，请重试');
      }
    } catch (error) {
      console.error('生成图表异常：', error);
      message.error('生成图表失败，服务器异常，请重试！');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {'新建智能图表'}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>

      {/* 表单卡片区域 */}
      <div className={styles.cardContainer}>
        <Card className={styles.formCard} bordered={true}>
          {/* 表单头部 */}
          <div className={styles.formHeader}>
            <span className={styles.formTitle}>新建智能图表</span>
            <Link to="/home">
              <ArrowLeftOutlined /> 返回列表
            </Link>
          </div>

          {/* ProForm表单（含文件上传） */}
          <ProForm
            layout="vertical"
            onFinish={handleSubmit}
            submitter={{
              searchConfig: {
                submitText: '生成图表',
                resetText: '重置',
                // ✅ 禁用状态同步
                submitButtonProps: { loading: submitting },
              },
              render: (props, dom) => {
                return (
                  <Space style={{ marginTop: 24 }}>
                    <div style={{ flex: 1 }}></div>
                    {dom.resetButton}
                    {dom.submitButton}
                  </Space>
                );
              },
            }}
            initialValues={{}}
          >
            {/* 图表名称 */}
            <ProFormText
              name="chartName"
              label="图表名称"
              placeholder="请输入图表名称（如：用户增长趋势图）"
              fieldProps={{
                size: 'middle',
                maxLength: 50,
              }}
              rules={[
                { required: true, message: '图表名称不能为空！' },
                { min: 2, max: 50, message: '图表名称长度需在2-50个字符之间' },
              ]}
            />

            {/* 分析目标 */}
            <ProFormTextArea
              name="goal"
              label="分析目标"
              placeholder="请输入分析目标（如：分析用户数逐日增长趋势，计算增长倍数和峰值）"
              fieldProps={{
                rows: 4,
                maxLength: 200,
              }}
              rules={[
                { required: true, message: '分析目标不能为空！' },
                { min: 5, max: 200, message: '分析目标长度需在5-200个字符之间' },
              ]}
            />

            {/* 图表类型 */}
            <ProFormSelect
              name="chartType"
              label="图表类型"
              placeholder="请选择图表类型"
              fieldProps={{
                size: 'middle',
              }}
              options={CHART_TYPE_OPTIONS}
              rules={[{ required: true, message: '请选择图表类型！' }]}
            />

            {/* 文件上传（核心补充：仅支持Excel） */}
            <ProFormUpload
              name="file"
              label="数据文件"
              valuePropName="fileList"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={beforeUpload}
              fieldProps={{
                accept: '.xlsx,.xls', // ✅ 仅保留Excel格式
                maxCount: 1, // 仅允许上传1个文件
                showUploadList: true, // 显示文件上传列表
                customRequest: () => {}, // 禁用自动上传（手动在提交时上传）
              }}
              rules={[{ 
                required: true, 
                message: '请上传Excel数据文件，仅支持 .xlsx / .xls 格式' 
              }]}
            >
              <Button icon={<UploadOutlined />} size="middle" type="default">
                点击上传Excel数据文件
              </Button>
            </ProFormUpload>
            <div className={styles.uploadTip}>
              支持格式：.xlsx / .xls | 最大文件大小: 2MB
            </div>
          </ProForm>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AddChart;