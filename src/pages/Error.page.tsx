import { Result, Typography } from 'antd';

type Props = {
  type?: 404;
  message: string;
};

export function ErrorPage(props: Props) {
  switch (props.type) {
    case 404:
      return (
        <Result
          status="404"
          title="ページが見つかりません"
          subTitle={props.message}
        />
      );
    default:
      break;
  }

  return <Typography.Text>{props.message}</Typography.Text>;
}
