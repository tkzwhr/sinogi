import PageFoundationContainer from '@/components/containers/PageFoundation.container';
import {
  Content,
  Heading,
  IllustratedMessage,
  Text,
} from '@adobe/react-spectrum';
import NotFound from '@spectrum-icons/illustrations/NotFound';

type Props = {
  type?: 404;
  message: string;
};

export function ErrorPage(props: Props) {
  switch (props.type) {
    case 404:
      return (
        <PageFoundationContainer>
          <IllustratedMessage>
            <NotFound />
            <Heading>NOT FOUND</Heading>
            <Content>{props.message}</Content>
          </IllustratedMessage>
        </PageFoundationContainer>
      );
    default:
      break;
  }

  return (
    <PageFoundationContainer>
      <Text>{props.message}</Text>
    </PageFoundationContainer>
  );
}
