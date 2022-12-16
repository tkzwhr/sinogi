import { fetchBookProblemSGF } from '@/api';
import useProblem from '@/hooks/problem';
import { ErrorPage } from '@/pages/ErrorPage';
import {
  Flex,
  View,
  ActionGroup,
  Item,
  LabeledValue,
  Text,
} from '@adobe/react-spectrum';
import { BoundedGoban, Vertex } from '@sabaki/shudan';
import Redo from '@spectrum-icons/workflow/Redo';
import Rewind from '@spectrum-icons/workflow/Rewind';
import Undo from '@spectrum-icons/workflow/Undo';
import { Key } from 'react';
import { useParams } from 'react-router-dom';
import { useAsync, useWindowSize } from 'react-use';

export default function ViewerPage() {
  const { width, height } = useWindowSize();
  const { problemId } = useParams();

  const sgfText = useAsync(async () => {
    if (!problemId) return '';
    return await fetchBookProblemSGF(problemId);
  }, [problemId]);
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
        {/* Board, InfoPanel */}
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
          {/* Info, Actions */}
          <Flex
            direction="column"
            width="size-3000"
            height="100%"
            justifyContent="space-between"
          >
            <Flex direction="column" gap="size-200" width="size-3000">
              {problem.gameInfo.gameName && (
                <LabeledValue
                  label="タイトル"
                  value={problem.gameInfo.gameName}
                />
              )}
              {problem.gameInfo.gameComment && (
                <LabeledValue
                  label="概要"
                  value={problem.gameInfo.gameComment}
                />
              )}
              <LabeledValue
                label="コメント"
                value={problem.boardState?.comment ?? ''}
              />
            </Flex>
            <ActionGroup
              density="compact"
              orientation="vertical"
              onAction={action}
            >
              <Item key="rewind" aria-label="最初に戻す">
                <Rewind />
                <Text>最初に戻す</Text>
              </Item>
              <Item key="undo" aria-label="1手戻す">
                <Undo />
                <Text>1手戻す</Text>
              </Item>
              <Item key="redo" aria-label="1手進める">
                <Redo />
                <Text>1手進める</Text>
              </Item>
            </ActionGroup>
          </Flex>
        </View>
      </Flex>
    </View>
  );
}
