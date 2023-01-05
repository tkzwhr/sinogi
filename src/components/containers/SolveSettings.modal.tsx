import { fetchBooks } from '@/services/api';
import { SolveSettings } from '@/types';
import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  Form,
  Item,
  ListView,
  NumberField,
  Radio,
  RadioGroup,
  StatusLight,
} from '@adobe/react-spectrum';
import { Key } from 'react';
import { useAsync, useMap } from 'react-use';

type Props = {
  solveSettings: SolveSettings;
  onUpdate: (value: SolveSettings) => void;
};

export default function SolveSettingsModal(props: Props) {
  const [solveSettings, { set }] = useMap(props.solveSettings);

  const books = useAsync(fetchBooks);

  const updateSelectedBooks = (keys: 'all' | Set<Key>) => {
    if (keys === 'all') {
      set(
        'selectedBooks',
        ([] as any).map((sb: any) => sb.bookId),
      );
      return;
    }
    set('selectedBooks', Array.from(keys as Set<string>));
  };

  const emit = () => props.onUpdate(solveSettings);

  return (
    <Dialog>
      <Content>
        <Form width="size-6000">
          <RadioGroup
            label="出題範囲"
            orientation="horizontal"
            value={solveSettings.scope}
            onChange={(value) => set('scope', value as 'all' | 'selectedBooks')}
          >
            <Radio value="all">全て</Radio>
            <Radio value="selectedBooks">指定したブック</Radio>
          </RadioGroup>
          <>
            {solveSettings.scope === 'selectedBooks' && (
              <ListView
                selectionMode="multiple"
                aria-label="ブック一覧"
                items={books.value?.items ?? []}
                selectedKeys={solveSettings.selectedBooks}
                onSelectionChange={updateSelectedBooks}
                loadingState={books.loading ? 'loading' : 'idle'}
              >
                {(item: any) => <Item key={item.bookId}>{item.name}</Item>}
              </ListView>
            )}
          </>
          <NumberField
            label="1日の目標"
            value={solveSettings.quota}
            onChange={(value) => set('quota', value)}
            minValue={0}
            step={1}
          />
          <>
            {solveSettings.quota === 0 && (
              <StatusLight variant="info">
                0の場合は目標を設定しません
              </StatusLight>
            )}
          </>
          <NumberField
            label="制限時間（秒）"
            value={solveSettings.allottedTime}
            onChange={(value) => set('allottedTime', value)}
            minValue={0}
            maxValue={999}
            step={1}
          />
          <>
            {solveSettings.allottedTime === 0 && (
              <StatusLight variant="info">
                0の場合は制限時間を設定しません
              </StatusLight>
            )}
          </>
        </Form>
      </Content>
      <ButtonGroup>
        <Button variant="primary" onPress={emit}>
          閉じる
        </Button>
      </ButtonGroup>
    </Dialog>
  );
}
