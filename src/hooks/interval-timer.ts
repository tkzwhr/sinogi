import { useTimer } from 'react-timer-hook';
import addSeconds from 'date-fns/addSeconds';
import { useCallback } from 'react';

type IntervalTimerHook = {
  time: Date;
  rate: number;
  restart: () => void;
};

export default function useIntervalTimer(
  intervalInSec: number,
  onExpire: () => void,
): IntervalTimerHook {
  const timer = useTimer({
    expiryTimestamp: new Date(),
    onExpire,
    autoStart: false,
  });

  return {
    time: new Date(1970, 1, 1, timer.hours, timer.minutes, timer.seconds),
    rate:
      (timer.hours * 3600 + timer.minutes * 60 + timer.seconds) / intervalInSec,
    restart: useCallback(
      () => timer.restart(addSeconds(new Date(), intervalInSec)),
      [],
    ),
  };
}
