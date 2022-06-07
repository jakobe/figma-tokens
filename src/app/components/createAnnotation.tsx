import { AsyncMessageChannel } from '@/AsyncMessageChannel';
import { Direction } from '@/constants/Direction';
import { SelectionValue } from '@/types';
import { AsyncMessageTypes } from '@/types/AsyncMessages';
import { track } from '@/utils/analytics';

const createAnnotation = (selectionValue: SelectionValue, direction: Direction = Direction.LEFT) => {
  track('Created annotation', { direction });

  AsyncMessageChannel.message({
    type: AsyncMessageTypes.CREATE_ANNOTATION,
    tokens: selectionValue,
    direction,
  });
};

export default createAnnotation;
