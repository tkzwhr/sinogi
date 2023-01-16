import useProblem from '@/hooks/problem';
import FastBackwardOutlined from '@ant-design/icons/FastBackwardOutlined';
import LeftOutlined from '@ant-design/icons/LeftOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import { BoundedGoban, Vertex } from '@sabaki/shudan';
import { Button, Col, Row, Space, Typography } from 'antd';
import { useWindowSize } from 'react-use';

type Props = {
  sgfText: string;
};

export default function ViewerContainer(props: Props) {
  const { width, height } = useWindowSize();

  const [problem, problemFn] = useProblem(props.sgfText);

  return (
    <Row gutter={[16, 16]}>
      <Col>
        <BoundedGoban
          maxWidth={width - 48}
          maxHeight={height - 48}
          signMap={problem.boardState.board.signMap}
          markerMap={problem.boardState.markerMap}
          ghostStoneMap={problem.boardState.ghostStoneMap}
          onVertexClick={(_: any, vertex: Vertex) => problemFn.play(vertex)}
        />
      </Col>
      <Col style={{ maxWidth: '360px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '64px',
            height: '100%',
          }}
        >
          <Space direction="vertical">
            {problem.gameInfo.gameName && (
              <>
                <Typography.Text strong>タイトル</Typography.Text>
                <Typography.Text type="secondary">
                  {problem.gameInfo.gameName}
                </Typography.Text>
              </>
            )}
            {problem.gameInfo.gameComment && (
              <>
                <Typography.Text strong>概要</Typography.Text>
                <Typography.Text type="secondary">
                  {problem.gameInfo.gameComment}
                </Typography.Text>
              </>
            )}
            <Typography.Text strong>コメント</Typography.Text>
            <Typography.Text type="secondary">
              {problem.boardState?.comment ?? ''}
            </Typography.Text>
          </Space>
          <Space.Compact block>
            <Button
              icon={<FastBackwardOutlined />}
              onClick={problemFn.rewind}
            />
            <Button icon={<LeftOutlined />} onClick={problemFn.undo} />
            <Button icon={<RightOutlined />} onClick={problemFn.redo} />
          </Space.Compact>
        </div>
      </Col>
    </Row>
  );
}
