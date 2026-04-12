import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, theme } from 'antd';
import { BarChartOutlined, CloudOutlined, ApiOutlined } from '@ant-design/icons';
import React from 'react';

/**
 * 功能卡片
 */
const FeatureCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  desc: string;
}> = ({ title, icon, desc }) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        background: token.colorBgContainer,
        boxShadow: token.boxShadow,
        borderRadius: '12px',
        padding: '24px',
        flex: 1,
        minWidth: '260px',
        transition: 'all 0.3s',
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          background: token.colorPrimaryBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '24px', color: token.colorPrimary }}>{icon}</div>
      </div>
      <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
        {title}
      </div>
      <div style={{ fontSize: '14px', color: token.colorTextSecondary, lineHeight: '22px' }}>
        {desc}
      </div>
    </div>
  );
};

const Welcome: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');

  return (
    <PageContainer header={{ title: null }}>
      <Card
        style={{
          borderRadius: 12,
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '32px 40px' }}
      >
        <div
          style={{
            backgroundPosition: '100% 50%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '380px auto',
            backgroundImage:
              "url('https://gw.alipayobjects.com/zos/antfincdn/Ps96KdVgF/bi-welcome.svg')",
          }}
        >
          {/* 主标题 */}
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: token.colorTextHeading,
              marginBottom: '12px',
            }}
          >
            欢迎使用 智能 BI 数据分析平台
          </div>

          {/* 副标题 */}
          <p
            style={{
              fontSize: '15px',
              color: token.colorTextSecondary,
              lineHeight: '26px',
              marginBottom: '32px',
              maxWidth: '60%',
            }}
          >
            这是一个无需复杂编程,一键上传数据文件,AI帮你自动分析并生成专业可视化图表的工具。
            旨在为你快速总结数据规律，辅助智能决策，让数据分析变得简单又高效。
          </p>

          {/* 功能卡片 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            <FeatureCard
              icon={<BarChartOutlined />}
              title="AI 自动分析"
              desc="基于人工智能自动解析数据，快速生成分析结论，无需手动编写复杂逻辑。"
            />
            <FeatureCard
              icon={<CloudOutlined />}
              title="一键生成图表"
              desc="支持折线图、柱状图、饼图、雷达图等多种图表，自动适配最优展示方式。"
            />
            <FeatureCard
              icon={<ApiOutlined />}
              title="数据可视化管理"
              desc="统一管理所有图表，支持编辑、更新、删除，随时随地查看分析结果。"
            />
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Welcome;