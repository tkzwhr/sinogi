import { DateSummary } from '@/types';
import { theme, Typography } from 'antd';
import { isSameDay, subDays } from 'date-fns';
import React from 'react';

const WEEKS = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateRows: 'repeat(7, 48px)',
    gridAutoColumns: '48px',
    gap: '4px',
  },
  week: {
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    paddingRight: '4px',
  },
  statistics: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
  },
};

type Props = {
  items: DateSummary[];
  weeks: number;
  displayMode: 'numberOfAnswers' | 'accuracy';
  quota: number;
};

export default function WeeklyHeatmap(props: Props) {
  const { token } = theme.useToken();
  const blue = token['blue-3'];
  const green = token['green-3'];
  const gold = token['gold-3'];
  const gray = token.colorBgContainerDisabled;

  const today = new Date();
  const numberOfItems = 7 * (props.weeks - 1) + today.getDay() + 1;
  const items: DateSummary[] = Array(numberOfItems)
    .fill(null)
    .map((_, i) => {
      const date = subDays(today, numberOfItems - 1 - i);
      const data = props.items.find((item) => isSameDay(date, item.date));
      return (
        data ?? {
          date,
          numberOfAnswers: 0,
          numberOfCorrectAnswers: 0,
        }
      );
    });

  const backgroundColor = (dateSummary: DateSummary) => {
    if (dateSummary.numberOfAnswers === 0) return gray;

    if (props.displayMode === 'numberOfAnswers') {
      return dateSummary.numberOfAnswers >= props.quota ? green : blue;
    } else {
      if (dateSummary.numberOfAnswers === dateSummary.numberOfCorrectAnswers)
        return gold;
      return dateSummary.numberOfCorrectAnswers / dateSummary.numberOfAnswers >=
        0.6
        ? green
        : blue;
    }
  };
  const displayValue = (dateSummary: DateSummary) => {
    if (dateSummary.numberOfAnswers === 0) return '';

    return props.displayMode === 'numberOfAnswers'
      ? dateSummary.numberOfAnswers
      : `${Math.floor(
          (dateSummary.numberOfCorrectAnswers / dateSummary.numberOfAnswers) *
            100,
        )}%`;
  };

  return (
    <div style={styles.grid}>
      {WEEKS.map((week) => (
        <div key={week} style={styles.week}>
          <Typography.Text strong>{week}</Typography.Text>
        </div>
      ))}
      {items.map((history) => (
        <div
          key={history.date.toString()}
          style={{
            ...styles.statistics,
            backgroundColor: backgroundColor(history),
          }}
        >
          {displayValue(history)}
        </div>
      ))}
    </div>
  );
}
