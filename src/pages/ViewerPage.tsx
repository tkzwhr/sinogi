import {
  Flex,
  View,
  ActionGroup,
  Item,
  LabeledValue,
} from '@adobe/react-spectrum';
import Redo from '@spectrum-icons/workflow/Redo';
import Rewind from '@spectrum-icons/workflow/Rewind';
import Undo from '@spectrum-icons/workflow/Undo';
import { useParams } from 'react-router-dom';
import { BoundedGoban, Vertex } from '@sabaki/shudan';
import { useAsync, useWindowSize } from 'react-use';
import { Key } from 'react';
import { fetchBookProblemSGF } from '@/api';
import { ErrorPage } from '@/pages/ErrorPage';
import useProblem from '@/hooks/problem';

export default function ViewerPage() {
  const { width, height } = useWindowSize();
  const { problemId } = useParams();

  const sgfText = useAsync(async () => await fetchBookProblemSGF(problemId!));
  const [problem, problemFn] = useProblem(sgfText.value);

  if (sgfText.loading) return <></>;
  if (sgfText.error) return <ErrorPage error={sgfText.error.message} />;

  const action = (key: Key) => {
    switch (key) {
      case 'rewind':
        problemFn.rewind();
        break;
      case 'undo':
        problemFn.undo();
        break;
      case 'redo':
        problemFn.redo();
        break;
      default:
        break;
    }
  };

  return (
    <View padding="size-200">
      <Flex gap="size-200">
        <View>
          <BoundedGoban
            maxWidth={width - 304}
            maxHeight={height - 32}
            signMap={problem.boardState.board.signMap}
            markerMap={problem.boardState.markerMap}
            ghostStoneMap={problem.boardState.ghostStoneMap}
            onVertexClick={(_: any, vertex: Vertex) => problemFn.play(vertex)}
          />
        </View>
        <View backgroundColor="gray-200" padding="size-100">
          <Flex direction="column" gap="size-200" width="size-3000">
            <ActionGroup density="compact" onAction={action}>
              <Item key="rewind" aria-label="最初に戻る">
                <Rewind />
              </Item>
              <Item key="undo" aria-label="1手戻る">
                <Undo />
              </Item>
              <Item key="redo" aria-label="1手進む">
                <Redo />
              </Item>
            </ActionGroup>
            {problem.gameInfo.gameName && (
              <LabeledValue
                label="タイトル"
                value={problem.gameInfo.gameName}
              />
            )}
            {problem.gameInfo.gameComment && (
              <LabeledValue label="概要" value={problem.gameInfo.gameComment} />
            )}
            <LabeledValue
              label="コメント"
              value={problem.boardState?.comment ?? ''}
            />
          </Flex>
        </View>
      </Flex>
    </View>
  );
}
