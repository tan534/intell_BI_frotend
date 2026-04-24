import { Footer } from '@/components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  message,
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Popconfirm,
  Skeleton,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Pagination,
} from 'antd';
import { Helmet, history } from '@umijs/max';
import { createStyles } from 'antd-style';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import Settings from '../../../config/defaultSettings';
import {
  listMyChartByPageUsingPost,
  deleteChartUsingPost,
  updateChartUsingPost,
} from '@/services/intell_Bi/chartController';

const { Paragraph, Text } = Typography;

// 图表类型映射
const CHART_TYPE_MAP: Record<string, { text: string; color: string }> = {
  line: { text: '折线图', color: 'blue' },
  bar: { text: '柱状图', color: 'green' },
  pie: { text: '饼图', color: 'orange' },
  scatter: { text: '散点图', color: 'purple' },
  radar: { text: '雷达图', color: 'cyan' },
  stack: { text: '堆叠图', color: 'geekblue' },
};

// 状态映射
const STATUS_MAP: Record<string, { text: string; color: string }> = {
  wait: { text: '等待生成', color: 'default' },
  processing: { text: '生成中', color: 'processing' },
  succeed: { text: '生成成功', color: 'success' },
  failed: { text: '生成失败', color: 'error' },
};

const CHART_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'stack', label: '堆叠图' },
  { value: 'pie', label: '饼图' },
  { value: 'radar', label: '雷达图' },
];

const useStyles = createStyles(({ token }) => ({
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: '20px 24px',
    background: token.colorBgContainer,
    borderRadius: token.borderRadiusLG,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: token.colorTextHeading,
    margin: 0,
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  chartGrid: {
    marginBottom: 24,
  },
  chartCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartName: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  tagGroup: {
    display: 'flex',
    gap: 6,
  },
  chartMeta: {
    marginBottom: 16,
    padding: 12,
    background: '#fafafa',
    borderRadius: 8,
  },
  metaItem: {
    marginBottom: 8,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  metaLabel: {
    fontSize: 13,
    color: token.colorTextSecondary,
  },
  analysisResult: {
    marginBottom: 16,
    padding: 12,
    background: '#f6ffed',
    borderRadius: 8,
    border: '1px solid #b7eb8f',
    maxHeight: 120,
    overflowY: 'auto',
  },
  chartContainer: {
    flex: 1,
    minHeight: 280,
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '30px 0',
  },
  emptyContainer: {
    minHeight: 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const Home: React.FC = () => {
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [chartList, setChartList] = useState<API.Chart[]>([]);
  const [total, setTotal] = useState(0);
  // 固定每页 2 条
  const pageSize = 2;
  const [current, setCurrent] = useState(1);

  const [searchName, setSearchName] = useState('');
  const [filterType, setFilterType] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditChart, setCurrentEditChart] = useState<API.Chart | null>(null);
  const [editForm] = Form.useForm();

  // 生成中自动刷新
  useEffect(() => {
    const hasProcessing = chartList.some(item => item.status === 'processing');
    if (hasProcessing) {
      const timer = setTimeout(() => {
        loadData(current);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [chartList, current]);

  // 加载数据
  const loadData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params: API.ChartQueryRequest = {
        current: page,
        pageSize: pageSize,
      };
      if (searchName) params.chartName = searchName;
      if (filterType) params.chartType = filterType;

      const res = await listMyChartByPageUsingPost(params);
      if (res.code === 0 && res.data) {
        setChartList(res.data.records || []);
        setTotal(res.data.total || 0);
        setCurrent(page);
      } else {
        message.error('加载失败');
      }
    } catch {
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  }, [searchName, filterType]);

  // 首次加载
  useEffect(() => {
    loadData(1);
  }, []);

  // 搜索
  const handleSearch = () => {
    setCurrent(1);
    loadData(1);
  };

  // 重置
  const handleReset = () => {
    setSearchName('');
    setFilterType('');
    setCurrent(1);
    loadData(1);
  };

  // 分页切换
  const onPageChange = (page: number) => {
    loadData(page);
  };

  // 删除
  const handleDelete = async (id: number) => {
    const res = await deleteChartUsingPost({ id });
    if (res.code === 0) {
      message.success('删除成功');
      loadData(current);
    } else {
      message.error('删除失败');
    }
  };

  // 解析图表
  const parseChart = (str?: string) => {
    if (!str) return null;
    try {
      return JSON.parse(str.replace(/option = /, '').replace(/;/g, ''));
    } catch {
      return null;
    }
  };

  // 渲染卡片
  const renderChartCard = (chart: API.Chart) => {
    const typeInfo = CHART_TYPE_MAP[chart.chartType || ''] || { text: '未知', color: 'default' };
    const statusInfo = STATUS_MAP[chart.status || 'succeed'];
    const option = parseChart(chart.genChart);

    return (
      <Col key={chart.id} xs={24} md={12}>
        <Card className={styles.chartCard} bodyStyle={{ padding: 20 }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.chartName}>{chart.chartName}</h3>
            <div className={styles.tagGroup}>
              <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
              <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            </div>
          </div>

          <div className={styles.chartMeta}>
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>分析目标：</Text>
              <Text>{chart.goal}</Text>
            </div>
          </div>

          {/* 失败提示 */}
          {chart.status === 'failed' && (
            <div style={{ color: '#f5222d', marginBottom: 12 }}>
              失败原因：{chart.genResult || '未知'}
            </div>
          )}

          {/* 等待/生成中 */}
          {(chart.status === 'wait' || chart.status === 'processing') && (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>
                <Skeleton active />
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  {chart.status === 'wait' ? '等待生成' : '生成中...'}
                </div>
              </div>
            </div>
          )}

          {/* 成功图表 */}
          {chart.status === 'succeed' && option && (
            <div className={styles.chartContainer}>
              <ReactECharts option={option} style={{ height: '280px' }} />
            </div>
          )}

          <div className={styles.cardFooter}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {chart.createTime ? new Date(chart.createTime).toLocaleString() : ''}
            </Text>
            <Space size="small">
              <Button size="small" onClick={() => handleEdit(chart)}>编辑</Button>
              <Popconfirm onConfirm={() => handleDelete(chart.id!)} title="确认删除？">
                <Button size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          </div>
        </Card>
      </Col>
    );
  };

  const handleEdit = (chart: API.Chart) => {
    setCurrentEditChart(chart);
    editForm.setFieldsValue(chart);
    setEditModalVisible(true);
  };

  const submitEdit = async (values: any) => {
    if (!currentEditChart) return;
    const res = await updateChartUsingPost({ ...values, id: currentEditChart.id });
    if (res.code === 0) {
      message.success('修改成功');
      setEditModalVisible(false);
      loadData(current);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet title="我的图表" />
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>我的图表</h1>
          <div className={styles.filterSection}>
            <Input
              placeholder="图表名称"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              allowClear
              style={{ width: 180 }}
            />
            <Select
              options={CHART_TYPE_OPTIONS}
              value={filterType}
              onChange={setFilterType}
              allowClear
              style={{ width: 140 }}
            />
            <Button onClick={handleSearch} icon={<SearchOutlined />} type="primary">
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </div>
        </div>
        <Button onClick={() => history.push('/add')} type="primary" icon={<PlusOutlined />}>
          新建图表
        </Button>
      </div>

      {loading ? (
        <Row gutter={[24, 24]}>
          <Col md={12}><Card><Skeleton active /></Card></Col>
          <Col md={12}><Card><Skeleton active /></Card></Col>
        </Row>
      ) : chartList.length > 0 ? (
        <>
          <Row gutter={[24, 24]} className={styles.chartGrid}>
            {chartList.map(item => renderChartCard(item))}
          </Row>
          {/* 分页 每页2条 */}
          <div className={styles.paginationContainer}>
            <Pagination
              current={current}
              total={total}
              pageSize={pageSize}
              onChange={onPageChange}
              showTotal={(t) => `共 ${t} 条`}
              showQuickJumper
            />
          </div>
        </>
      ) : (
        <div className={styles.emptyContainer}>
          <Empty description="暂无图表" />
        </div>
      )}

      {/* 编辑弹窗 */}
      <Modal
        title="编辑图表"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => editForm.submit()}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="chartName" label="图表名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="goal" label="分析目标" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="chartType" label="图表类型">
            <Select options={CHART_TYPE_OPTIONS.filter(i => i.value)} />
          </Form.Item>
        </Form>
      </Modal>

      <Footer />
    </div>
  );
};

export default Home;