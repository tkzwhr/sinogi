import { Meter } from '@adobe/react-spectrum';

type Props = {
  solveCount: number;
  quota: number;
};

export default function SolveCountIndicator(props: Props) {
  const availableQuota = props.quota > 0;
  const valueLabel = `${props.solveCount} / ${props.quota}`;

  return (
    <>
      {availableQuota && (
        <Meter
          width="100%"
          label="今日の回答数"
          maxValue={props.quota}
          value={props.solveCount}
          valueLabel={valueLabel}
          variant={props.solveCount < props.quota ? 'warning' : 'positive'}
        />
      )}
    </>
  );
}
