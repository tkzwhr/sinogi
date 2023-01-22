import { Progress, Space, theme, Typography } from 'antd';
import { format } from 'date-fns';

type Props = {
  allottedTime: number;
  value: number;
  time: Date;
};

export default function TimeIndicator(props: Props) {
  const {
    token: { blue, yellow, red },
  } = theme.useToken();

  const variant = props.value >= 0.5 ? blue : props.value >= 0.2 ? yellow : red;
  const valueLabel = format(props.time, 'm:ss');

  return (
    <Space direction="vertical">
      <Typography.Text strong>残り時間</Typography.Text>
      <Progress
        format={() => valueLabel}
        type="circle"
        percent={props.value * 100}
        strokeColor={variant}
      />
    </Space>
  );
}
