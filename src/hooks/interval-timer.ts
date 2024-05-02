import { addSeconds } from 'date-fns';
import { useCallback } from 'react';
import { useTimer } from 'react-timer-hook';

type IntervalTimerState = {
  time: Date;
  rate: number;
};

type IntervalTimerFn = {
  restart: () => void;
  pause: () => void;
};

export default function useIntervalTimer(
  intervalInSec: number,
  onExpire?: () => void,
): [IntervalTimerState, IntervalTimerFn] {
  const timer = useTimer({
    expiryTimestamp: new Date(),
    onExpire,
    autoStart: false,
  });

  const time = new Date(1970, 1, 1, timer.hours, timer.minutes, timer.seconds);
  const rate =
    (timer.hours * 3600 + timer.minutes * 60 + timer.seconds) / intervalInSec;

  const restart = useCallback(() => {
    timer.restart(addSeconds(new Date(), intervalInSec));
    return 1;
  }, [intervalInSec]);
  const pause = useCallback(timer.pause, []);

  return [
    {
      time,
      rate,
    },
    {
      restart,
      pause,
    },
  ];
}
