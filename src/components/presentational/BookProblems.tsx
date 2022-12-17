import { BookProblem, ProblemSummary } from '@/types';
import {
  ActionButton,
  Cell,
  Column,
  Row,
  TableBody,
  TableHeader,
  TableView,
} from '@adobe/react-spectrum';
import { useMemo } from 'react';

type Props = {
  items: BookProblem[];
  solveSummary: ProblemSummary[];
  onClickShowProblem: (_0: BookProblem['problemId']) => void;
};

export default function BookProblems(props: Props) {
  const mergedItems = useMemo(() => {
    return props.items.map((item) => {
      const solveSummary = props.solveSummary.find(
        (ss) => ss.problemId === item.problemId,
      );
      const accuracy = solveSummary
        ? `${Math.floor(
            (solveSummary.numberOfCorrectAnswers /
              solveSummary.numberOfAnswers) *
              100,
          )}%`
        : '-%';
      return {
        ...item,
        id: item.problemId,
        accuracy,
      };
    });
  }, [props]);

  return (
    <TableView aria-label="詰碁一覧" width="99%">
      <TableHeader>
        <Column maxWidth={128} align="start">
          &nbsp;
        </Column>
        <Column>タイトル</Column>
        <Column>説明</Column>
        <Column maxWidth={64} align="end">
          正答率
        </Column>
      </TableHeader>
      <TableBody items={mergedItems}>
        {(item) => (
          <Row>
            <Cell>
              <ActionButton
                isQuiet
                onPress={() => props.onClickShowProblem(item.problemId)}
              >
                問題を見る
              </ActionButton>
            </Cell>
            <Cell>{item.title}</Cell>
            <Cell>{item.desc}</Cell>
            <Cell>{item.accuracy}</Cell>
          </Row>
        )}
      </TableBody>
    </TableView>
  );
}
