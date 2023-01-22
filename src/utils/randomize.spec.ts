import { randomize } from '@/utils/randomize';

describe('randomize', () => {
  it('適当に選択される', () => {
    const item = randomize([1, 2, 3]);
    expect([1, 2, 3].includes(item)).toBeTruthy();
  });

  it('引数か空配列の場合はエラー', () => {
    expect(() => randomize([])).toThrowError('No items given.');
  });
});
