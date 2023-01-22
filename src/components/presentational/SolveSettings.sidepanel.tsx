import { fetchBooks } from '@/services/api';
import { SolveSettings } from '@/types';
import { Drawer, Form, InputNumber, Radio, Select } from 'antd';
import { useEffect, useMemo } from 'react';
import { useAsync } from 'react-use';

type Props = {
  open: boolean;
  solveSettings: SolveSettings;
  onUpdate: (value: SolveSettings) => void;
};

export default function SolveSettingsSidePanel(props: Props) {
  const [form] = Form.useForm();

  const books = useAsync(fetchBooks);
  const bookOptions = useMemo(
    () =>
      books.value?.items.map((b) => ({
        value: b.bookId,
        label: b.name,
      })),
    [books.value],
  );

  useEffect(() => {
    if (!props.open) return;
    form.setFieldValue('scope', props.solveSettings.scope);
    form.setFieldValue('selectedBooks', props.solveSettings.selectedBooks);
    form.setFieldValue('quota', props.solveSettings.quota);
    form.setFieldValue('allottedTime', props.solveSettings.allottedTime);
  }, [props.open]);

  const update = () => {
    const scope = form.getFieldValue('scope');
    const selectedBooks =
      scope === 'selectedBooks' ? form.getFieldValue('selectedBooks') : [];
    const quota = form.getFieldValue('quota');
    const allottedTime = form.getFieldValue('allottedTime');
    props.onUpdate({
      scope:
        scope === 'selectedBooks' && selectedBooks.length === 0 ? 'all' : scope,
      selectedBooks,
      quota: quota ?? 0,
      allottedTime: allottedTime ?? 0,
    });
  };

  return (
    <Drawer
      title="詰碁設定"
      placement="right"
      open={props.open}
      onClose={update}
    >
      <Form layout="vertical" form={form}>
        <Form.Item label="出題範囲" name="scope">
          <Radio.Group>
            <Radio.Button value="all">全て</Radio.Button>
            <Radio.Button value="selectedBooks">指定したブック</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(pv, cv) => pv.scope !== cv.scope}>
          {({ getFieldValue }) =>
            getFieldValue('scope') === 'selectedBooks' ? (
              <Form.Item label="ブック一覧" name="selectedBooks">
                <Select mode="multiple" allowClear options={bookOptions} />
              </Form.Item>
            ) : null
          }
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(pv, cv) => pv.quota !== cv.quota}>
          {({ getFieldValue }) => (
            <Form.Item
              label="1日の目標"
              name="quota"
              help={!getFieldValue('quota') && '目標を設定しません'}
            >
              <InputNumber min={0} step={1} />
            </Form.Item>
          )}
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(pv, cv) => pv.allottedTime !== cv.allottedTime}
        >
          {({ getFieldValue }) => (
            <Form.Item
              label="制限時間（秒）"
              name="allottedTime"
              help={!getFieldValue('allottedTime') && '制限時間を設定しません'}
            >
              <InputNumber min={0} step={1} />
            </Form.Item>
          )}
        </Form.Item>
      </Form>
    </Drawer>
  );
}
