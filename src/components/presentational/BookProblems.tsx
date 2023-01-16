import { Problem, ProblemSummary } from '@/types';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import { Button, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

type DataType = {
  key: string;
  title: string;
  description?: string;
  accuracy: string;
  view: () => void;
};

const columns: ColumnsType<DataType> = [
  {
    title: '',
    key: 'view',
    width: 48,
    render: (_, record) => (
      <Button
        icon={<ExportOutlined />}
        type="text"
        shape="circle"
        onClick={record.view}
      />
    ),
  },
  {
    title: 'タイトル',
    dataIndex: 'title',
  },
  {
    title: '説明',
    dataIndex: 'description',
  },
  {
    title: '正答率',
    dataIndex: 'accuracy',
    align: 'right',
  },
];

type Props = {
  items: Problem[];
  solveSummary: ProblemSummary[];
  onClickShowProblem: (
    problemId: Problem['problemId'],
    title?: string | undefined,
  ) => void;
};

export default function BookProblems(props: Props) {
  const data: DataType[] = useMemo(() => {
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
        key: item.problemId,
        accuracy,
        view: () => props.onClickShowProblem(item.problemId, item.title),
      };
    });
  }, [props]);

  return (
    <Table
      columns={columns}
      dataSource={data}
      size="small"
      pagination={false}
    />
  );
}
