import PageContainer from '@/components/PageContainer';
import { Text, Flex } from '@adobe/react-spectrum';

type Props = {
  error: string;
};

export function ErrorPage(props: Props) {
  return (
    <PageContainer>
      <Flex direction="column" gap="size-200">
        <Text>エラー</Text>
        <Text>{props.error}</Text>
      </Flex>
    </PageContainer>
  );
}
