import FootprintsContainer from '@/components/containers/Footprints.container';
import PageFoundationContainer from '@/components/containers/PageFoundation.container';
import { ErrorPage } from '@/pages/Error.page';
import { fetchDateSummaries, fetchSolveSettings } from '@/services/api';
import { ProgressCircle } from '@adobe/react-spectrum';
import { useAsync } from 'react-use';

export default function FootprintsPage() {
  const solveSettings = useAsync(fetchSolveSettings);

  const dateSummaries = useAsync(fetchDateSummaries);

  if (solveSettings.error)
    return <ErrorPage message={solveSettings.error.message} />;

  if (dateSummaries.error)
    return <ErrorPage message={dateSummaries.error.message} />;

  const loading = solveSettings.loading || dateSummaries.loading;

  return (
    <PageFoundationContainer>
      <h2>あしあと</h2>
      {loading ? (
        <ProgressCircle aria-label="読み込み中..." size="L" isIndeterminate />
      ) : (
        <FootprintsContainer
          dateSummaries={dateSummaries.value!.items}
          quota={solveSettings.value!.quota}
        />
      )}
    </PageFoundationContainer>
  );
}
