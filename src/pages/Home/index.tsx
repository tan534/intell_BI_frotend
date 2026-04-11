import { Footer } from '@/components';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { 
  Button, 
  Empty, 
  message, 
  Spin, 
  Card, 
  Row, 
  Col, 
  Space, 
  Tag, 
  Typography,
  Popconfirm,
  Pagination,
  Skeleton
} from 'antd';
import { Helmet, history, useModel } from '@umijs/max';
import { createStyles } from 'antd-style';
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import Settings from '../../../config/defaultSettings';
import {
  listMyChartByPageUsingPost,
  deleteChartUsingPost,
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

const useStyles = createStyles(({ token }) => {
  return {
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
    title: {
      fontSize: 24,
      fontWeight: 600,
      color: token.colorTextHeading,
      margin: 0,
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
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        transform: 'translateY(-2px)',
      },
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    chartName: {
      fontSize: 18,
      fontWeight: 600,
      color: token.colorTextHeading,
      margin: 0,
      flex: 1,
    },
    chartType: {
      marginLeft: 8,
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
      marginRight: 8,
    },
    metaValue: {
      fontSize: 14,
      color: token.colorText,
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
      width: '100%',
      marginTop: 'auto',
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },
    createTime: {
      fontSize: 13,
      color: token.colorTextSecondary,
    },
    actions: {
      display: 'flex',
      gap: 8,
    },
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 32,
      marginBottom: 24,
    },
    emptyContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
      background: token.colorBgContainer,
      borderRadius: 12,
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 400,
    },
  };
});

const Home: React.FC = () => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const [loading, setLoading] = useState<boolean>(false);
  const [chartList, setChartList] = useState<API.Chart[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(6); // 每页6条，一行2条就是3行

  // 获取图表列表
  const fetchChartList = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await listMyChartByPageUsingPost({
        current: page,
        pageSize: pageSize,
      });
      if (res.code === 0 && res.data) {
        setChartList(res.data.records || []);
        setTotal(res.data.total || 0);
        setCurrentPage(page);
      } else {
        message.error(res.message || '获取图表列表失败');
      }
    } catch (error) {
      console.error('获取图表列表异常：', error);
      message.error('获取图表列表失败，服务器异常');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载图表列表
  useEffect(() => {
    fetchChartList(1);
  }, []);

  // 删除图表
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteChartUsingPost({ id });
      if (res.code === 0) {
        message.success('删除图表成功');
        // 如果当前页只有一条数据且不是第一页，则回到上一页
        if (chartList.length === 1 && currentPage > 1) {
          fetchChartList(currentPage - 1);
        } else {
          fetchChartList(currentPage);
        }
      } else {
        message.error(res.message || '删除图表失败');
      }
    } catch (error) {
      console.error('删除图表异常：', error);
      message.error('删除图表失败，服务器异常');
    }
  };

  // 编辑图表
  const handleEdit = (id: number) => {
    history.push(`/add?id=${id}`);
  };

  // 新建图表
  const handleAdd = () => {
    history.push('/add');
  };

  // 解析并规范化图表配置
  const parseChartOption = (chartData: string) => {
    try {
      if (!chartData) return null;
      let optionStr = chartData;
      if (optionStr.startsWith('option = ')) {
        optionStr = optionStr.replace('option = ', '').replace(';', '');
      }
      optionStr = optionStr.replace(/'/g, '"');
      return JSON.parse(optionStr);
    } catch (error) {
      console.error('解析图表配置失败:', error);
      return null;
    }
  };

  // 渲染图表卡片
  const renderChartCard = (chart: API.Chart) => {
    const chartOption = parseChartOption(chart.genChart || '');
    const chartTypeInfo = CHART_TYPE_MAP[chart.chartType || ''] || { text: chart.chartType, color: 'default' };

    return (
      <Col xs={24} sm={24} md={12} lg={12} xl={12} key={chart.id}>
        <Card className={styles.chartCard} bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* 卡片头部 */}
          <div className={styles.cardHeader}>
            <h3 className={styles.chartName}>{chart.chartName || '未命名图表'}</h3>
            <Tag color={chartTypeInfo.color} className={styles.chartType}>
              {chartTypeInfo.text}
            </Tag>
          </div>

          {/* 图表元信息 */}
          <div className={styles.chartMeta}>
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>分析目标：</Text>
              <Text className={styles.metaValue}>{chart.goal || '暂无'}</Text>
            </div>
          </div>

          {/* 分析结论 */}
          {chart.genResult && (
            <div className={styles.analysisResult}>
              <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>
                分析结论：
              </Text>
              <Paragraph 
                ellipsis={{ rows: 3, expandable: false }}
                style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}
              >
                {chart.genResult}
              </Paragraph>
            </div>
          )}

          {/* 图表展示 */}
          {chartOption ? (
            <div className={styles.chartContainer}>
              <ReactECharts
                option={chartOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                notMerge={true}
              />
            </div>
          ) : (
            <div style={{ 
              height: 280, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              borderRadius: 8,
              color: '#999',
            }}>
              暂无图表数据
            </div>
          )}

          {/* 卡片底部 */}
          <div className={styles.cardFooter}>
            <Text className={styles.createTime}>
              创建时间：{chart.createTime ? new Date(chart.createTime).toLocaleString() : '未知'}
            </Text>
            <div className={styles.actions}>

              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(chart.id!)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确认删除"
                description="确定要删除这个图表吗？此操作不可恢复。"
                onConfirm={() => handleDelete(chart.id!)}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  // 渲染骨架屏
  const renderSkeleton = () => {
    return (
      <Row gutter={[24, 24]} className={styles.chartGrid}>
        {[1, 2, 3, 4].map((item) => (
          <Col xs={24} sm={24} md={12} lg={12} xl={12} key={item}>
            <Card style={{ height: 500 }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {'我的图表'}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      
      {/* 页面头部 */}
      <div className={styles.header}>
        <h1 className={styles.title}>我的图表</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          新建图表
        </Button>
      </div>

      {/* 图表列表 */}
      {loading ? (
        renderSkeleton()
      ) : chartList.length > 0 ? (
        <>
          <Row gutter={[24, 24]} className={styles.chartGrid}>
            {chartList.map(chart => renderChartCard(chart))}
          </Row>
          
        </>
      ) : (
        <div className={styles.emptyContainer}>
          <Empty
            description={
              <span style={{ fontSize: 16, color: '#999' }}>
                还没有创建任何图表，快来创建你的第一个图表吧！
              </span>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size="large"
              style={{ marginTop: 16 }}
            >
              立即创建
            </Button>
          </Empty>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Home;