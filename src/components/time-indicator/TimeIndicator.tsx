import { Meter } from '@adobe/react-spectrum';
import { format } from 'date-fns';

type Props = {
  allottedTime: number;
  value: number;
  time: Date;
};

export default function TimeIndicator(props: Props) {
  const availableTimer = props.allottedTime > 0;
  const variant =
    props.value >= 0.5
      ? 'positive'
      : props.value >= 0.2
      ? 'warning'
      : 'critical';
  const valueLabel = format(props.time, 'm:ss');

  return (
    <>
      {availableTimer && (
        <Meter
          width="100%"
          label="残り時間"
          maxValue={1}
          value={props.value}
          valueLabel={valueLabel}
          variant={variant}
        />
      )}
    </>
  );
}
