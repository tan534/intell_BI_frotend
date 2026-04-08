import { Footer } from '@/components';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { ProTable, ProCard } from '@ant-design/pro-components';
import { Button, Empty, message, Spin } from 'antd';
import { Helmet, history, useAccess, useModel } from '@umijs/max';
import { createStyles } from 'antd-style';
import React, { useState, useEffect } from 'react';
import Settings from '../../../config/defaultSettings';
import {
  listChartByPageUsingPost,
  deleteChartUsingPost,
} from '@/services/intell_Bi/chartController';

const useStyles = createStyles(({ token }) => {
  return {
    container: {
      minHeight: '100vh',
      background: token.colorBgContainer,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      padding: '16px 24px',
      background: token.colorBgLayout,
      borderRadius: token.borderRadiusLG,
      boxShadow: token.boxShadow,
    },
    title: {
      fontSize: token.fontSizeHeading2,
      fontWeight: 600,
      color: token.colorTextHeading,
    },
  };
});

const Home: React.FC = () => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const [loading, setLoading] = useState<boolean>(false);
  const [chartList, setChartList] = useState<API.Chart[]>([]);
  const [total, setTotal] = useState<number>(0);

  // 获取图表列表
  const fetchChartList = async (params: API.ChartQueryRequest) => {
    try {
      setLoading(true);
      const res = await listChartByPageUsingPost({
        current: params.current || 1,
        pageSize: params.pageSize || 10,
        ...params,
      });
      if (res.code === 0 && res.data) {
        setChartList(res.data.records || []);
        setTotal(res.data.total || 0);
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
    fetchChartList({});
  }, []);

  // 删除图表
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteChartUsingPost({ id });
      if (res.code === 0) {
        message.success('删除图表成功');
        // 重新获取图表列表
        fetchChartList({});
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

  // 查看图表详情
  const handleView = (id: number) => {
    history.push(`/chart/detail/${id}`);
  };

  // 新建图表
  const handleAdd = () => {
    history.push('/add');
  };

  // 表格列配置
  const columns = [
    {
      title: '图表名称',
      dataIndex: 'goal',
      key: 'goal',
      ellipsis: true,
    },
    {
      title: '图表类型',
      dataIndex: 'chartType',
      key: 'chartType',
      valueEnum: {
        line: { text: '折线图' },
        bar: { text: '柱状图' },
        pie: { text: '饼图' },
        scatter: { text: '散点图' },
        histogram: { text: '直方图' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      valueType: 'date',
    },
    {
      title: '操作',
      key: 'action',
      valueType: 'option',
      render: (_: any, record: API.Chart) => [
        <Button
          key="view"
          icon={<EyeOutlined />}
          onClick={() => handleView(record.id!)}
        >
          查看
        </Button>,
        <Button
          key="edit"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record.id!)}
        >
          编辑
        </Button>,
        <Button
          key="delete"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id!)}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {'图表列表'}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      
      {/* 页面头部 */}
      <div className={styles.header}>
        <h1 className={styles.title}>图表列表</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建图表
        </Button>
      </div>

      {/* 图表列表 */}
      <ProCard>
        <ProTable
          columns={columns}
          dataSource={chartList}
          rowKey="id"
          loading={loading}
          pagination={{
            total,
            pageSize: 10,
            onChange: (current, pageSize) => {
              fetchChartList({ current, pageSize });
            },
          }}
          locale={{
            emptyText: <Empty description="暂无图表数据" />,
          }}
        />
      </ProCard>

      <Footer />
    </div>
  );
};

export default Home;
