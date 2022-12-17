import { DateSummary } from '@/types';
import { Flex, Grid, repeat, View } from '@adobe/react-spectrum';
import { isSameDay, subDays } from 'date-fns';

type Props = {
  items: DateSummary[];
  weeks: number;
  displayMode: 'numberOfAnswers' | 'accuracy';
  quota: number;
};

const WEEKS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyHeatmap(props: Props) {
  const numberOfItems = 7 * (props.weeks - 1) + new Date().getDay();
  const items: DateSummary[] = Array(numberOfItems)
    .fill(null)
    .map((_, i) => {
      const date = subDays(new Date(), numberOfItems - i);
      const data = props.items.find((item) => isSameDay(date, item.date));
      return (
        data ?? {
          date,
          numberOfAnswers: 0,
          numberOfCorrectAnswers: 0,
        }
      );
    });
  const backgroundColor = (dateSummary: DateSummary): any => {
    if (dateSummary.numberOfAnswers === 0) return 'gray-200';

    if (props.displayMode === 'numberOfAnswers') {
      return dateSummary.numberOfAnswers >= props.quota
        ? 'positive'
        : 'informative';
    } else {
      if (dateSummary.numberOfAnswers === dateSummary.numberOfCorrectAnswers)
        return 'notice';
      return dateSummary.numberOfCorrectAnswers / dateSummary.numberOfAnswers >=
        0.6
        ? 'positive'
        : 'informative';
    }
  };

  return (
    <Grid
      autoFlow="column"
      rows={repeat(7, 'size-675')}
      autoColumns="size-675"
      gap="size-65"
    >
      {WEEKS.map((week) => (
        <View key={week} paddingEnd="4px">
          <Flex height="100%" justifyContent="end" alignItems="center">
            {week}
          </Flex>
        </View>
      ))}

      {items.map((history) => (
        <View
          key={history.date.toString()}
          backgroundColor={backgroundColor(history)}
          borderRadius="small"
        >
          <Flex height="100%" justifyContent="center" alignItems="center">
            {history.numberOfAnswers > 0 && (
              <>
                {props.displayMode === 'numberOfAnswers'
                  ? history.numberOfAnswers
                  : `${Math.floor(
                      (history.numberOfCorrectAnswers /
                        history.numberOfAnswers) *
                        100,
                    )}%`}
              </>
            )}
          </Flex>
        </View>
      ))}
    </Grid>
  );
}
