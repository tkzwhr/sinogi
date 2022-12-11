import PageContainer from '@/components/PageContainer';
import { View, Flex, RadioGroup, Radio } from '@adobe/react-spectrum';
import { useState } from 'react';
import { useAsync } from 'react-use';
import { fetchDateSummaries } from '@/api';
import WeeklyHeatmap from '@/components/weekly-heatmap/WeeklyHeatmap';
import { ErrorPage } from '@/pages/ErrorPage';

export default function FootprintsPage() {
  const [displayMode, setDisplayMode] = useState<
    'numberOfAnswers' | 'accuracy'
  >('numberOfAnswers');
  const quota = 3;

  const dateSummaries = useAsync(fetchDateSummaries);

  const updateDisplayMode = (key: string) => {
    if (key === 'numberOfAnswers') {
      setDisplayMode('numberOfAnswers');
    } else {
      setDisplayMode('accuracy');
    }
  };

  if (dateSummaries.loading) return <></>;
  if (dateSummaries.error)
    return <ErrorPage error={dateSummaries.error.message} />;

  return (
    <PageContainer>
      <h2>あしあと</h2>
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
            items={dateSummaries.value!.items}
            weeks={10}
            displayMode={displayMode}
            quota={quota}
          />
        </View>
      </Flex>
    </PageContainer>
  );
}
