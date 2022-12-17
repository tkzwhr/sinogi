import { fetchBookProblemSGF } from '@/api';
import ViewerContainer from '@/components/containers/Viewer.container';
import { ErrorPage } from '@/pages/Error.page';
import { ProgressCircle, View } from '@adobe/react-spectrum';
import { useParams } from 'react-router-dom';
import { useAsync } from 'react-use';

export default function ViewerPage() {
  const { problemId } = useParams();

  const sgfText = useAsync(() => fetchBookProblemSGF(problemId!), [problemId]);

  if (sgfText.error)
    return <ErrorPage type={404} message={sgfText.error.message} />;

  return (
    <View padding="size-200">
      {sgfText.loading ? (
        <ProgressCircle aria-label="読み込み中..." size="L" isIndeterminate />
      ) : (
        <ViewerContainer sgfText={sgfText.value!} />
      )}
    </View>
  );
}
