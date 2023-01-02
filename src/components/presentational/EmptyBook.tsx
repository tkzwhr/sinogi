import { Content, IllustratedMessage } from '@adobe/react-spectrum';
import NotFound from '@spectrum-icons/illustrations/NotFound';

export default function EmptyBook() {
  return (
    <IllustratedMessage>
      <NotFound />
      <Content>ブックが見つかりません</Content>
    </IllustratedMessage>
  );
}
