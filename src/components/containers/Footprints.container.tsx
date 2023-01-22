import WeeklyHeatmap from '@/components/presentational/WeeklyHeatmap';
import { DateSummary } from '@/types';
import { Space, Segmented } from 'antd';
import { useState } from 'react';

const options = [
  {
    value: 'numberOfAnswers',
    label: '回答数',
  },
  {
    value: 'accuracy',
    label: '正答率',
  },
];

type Props = {
  dateSummaries: DateSummary[];
  quota: number;
};

export default function FootprintsContainer(props: Props) {
  const [displayMode, setDisplayMode] = useState<
    'numberOfAnswers' | 'accuracy'
  >('numberOfAnswers');

  return (
    <Space direction="vertical" size="large">
      <Segmented
        size="large"
        options={options}
        onChange={(value: any) => setDisplayMode(value)}
        value={displayMode}
      />
      <WeeklyHeatmap
        items={props.dateSummaries}
        weeks={10}
        displayMode={displayMode}
        quota={props.quota}
      />
    </Space>
  );
}
