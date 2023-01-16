import { Progress, Space, theme, Typography } from 'antd';

type Props = {
  solveCount: number;
  quota: number;
};

export default function SolveCountIndicator(props: Props) {
  const {
    token: { blue, green },
  } = theme.useToken();

  const availableQuota = props.quota > 0;
  const value = (props.solveCount / props.quota) * 100;
  const valueLabel = `${props.solveCount} / ${props.quota}`;

  return (
    <>
      {availableQuota && (
        <Space direction="vertical">
          <Typography.Text strong>今日の回答数</Typography.Text>
          <Progress
            format={() => valueLabel}
            percent={value}
            strokeColor={props.solveCount < props.quota ? blue : green}
          />
        </Space>
      )}
    </>
  );
}
