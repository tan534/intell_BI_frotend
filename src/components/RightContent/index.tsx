import { QuestionCircleOutlined } from '@ant-design/icons';
import '@umijs/max';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      UmiSelectLang: any;
    }
  }
}

export type SiderTheme = 'light' | 'dark';
export const SelectLang: React.FC = () => {
  return (
    // @ts-ignore
    <UmiSelectLang
      style={{
        padding: 4,
      }}
    />
  );
};
export const Question: React.FC = () => {
  return (
    <a
      href="https://pro.ant.design/docs/getting-started"
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        padding: '4px',
        fontSize: '18px',
        color: 'inherit',
      }}
    >
      <QuestionCircleOutlined />
    </a>
  );
};
