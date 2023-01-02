import WeeklyHeatmap from '@/components/presentational/WeeklyHeatmap';
import { DateSummary } from '@/types';
import { Flex, Radio, RadioGroup, View } from '@adobe/react-spectrum';
import { useState } from 'react';

type Props = {
  dateSummaries: DateSummary[];
  quota: number;
};

export default function FootprintsContainer(props: Props) {
  const [displayMode, setDisplayMode] = useState<
    'numberOfAnswers' | 'accuracy'
  >('numberOfAnswers');

  const updateDisplayMode = (key: string) => {
    if (key === 'numberOfAnswers') {
      setDisplayMode('numberOfAnswers');
    } else {
      setDisplayMode('accuracy');
    }
  };

  return (
    <Flex direction="column" gap="size-200">
      <RadioGroup
        label="表示項目"
        orientation="horizontal"
        value={displayMode}
        onChange={updateDisplayMode}
      >
        <Radio value="numberOfAnswers">回答数</Radio>
        <Radio value="accuracy">正答率</Radio>
      </RadioGroup>
      <View maxWidth="100vw" overflow="scroll">
        <WeeklyHeatmap
          items={props.dateSummaries}
          weeks={10}
          displayMode={displayMode}
          quota={props.quota}
        />
      </View>
    </Flex>
  );
}
