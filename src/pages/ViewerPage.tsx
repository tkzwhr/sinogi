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
import { BoundedGoban } from '@sabaki/shudan';
import { useWindowSize } from 'react-use';
import { Key, useState } from 'react';

export default function ViewerPage() {
  const signMap = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const { problemId } = useParams();
  const { width, height } = useWindowSize();
  const [title] = useState('タイトル1');
  const [desc] = useState('概要概要概要概要概要');
  const [comment] = useState('補足説明A');

  const action = (key: Key) => {
    switch (key) {
      case 'rewind':
        console.log('rewind');
        break;
      case 'undo':
        console.log('undo');
        break;
      case 'redo':
        console.log('redo');
        break;
      default:
        break;
    }
  };

  if (!problemId) return <></>;

  return (
    <View padding="size-200">
      <Flex gap="size-200">
        <View>
          <BoundedGoban
            maxWidth={width - 304}
            maxHeight={height - 32}
            signMap={signMap}
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
            <LabeledValue label="タイトル" value={title} />
            <LabeledValue label="概要" value={desc} />
            <LabeledValue label="コメント" value={comment} />
          </Flex>
        </View>
      </Flex>
    </View>
  );
}
