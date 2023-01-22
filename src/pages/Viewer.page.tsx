import ViewerContainer from '@/components/containers/Viewer.container';
import { ErrorPage } from '@/pages/Error.page';
import { fetchProblemSGF } from '@/services/api';
import { Empty, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import { useAsync } from 'react-use';

export default function ViewerPage() {
  const { problemId } = useParams();

  const sgfText = useAsync(() => fetchProblemSGF(problemId!), [problemId]);

  if (sgfText.error)
    return <ErrorPage type={404} message={sgfText.error.message} />;

  if (sgfText.loading)
    return (
      <Spin size="large">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Spin>
    );

  return <ViewerContainer sgfText={sgfText.value!.sgfText} />;
}
