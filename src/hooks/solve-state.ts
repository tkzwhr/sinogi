import { PlayResult as PlayResultType } from '@/types';
import { Dispatch, useReducer } from 'react';

const ActionType = {
  START: 'START',
  PLAY: 'PLAY',
  OPPONENT_PLAY: 'OPPONENT_PLAY',
  RUN_OUT_OF_TIME: 'RUN_OUT_OF_TIME',
} as const;

type ActionPayload = {
  [ActionType.START]: {};
  [ActionType.PLAY]: {
    vertex: [x: number, y: number];
    playResult: PlayResultType | null;
  };
  [ActionType.OPPONENT_PLAY]: PlayResultType;
  [ActionType.RUN_OUT_OF_TIME]: {};
};

type Action = {
  [P in keyof ActionPayload]: {
    type: P;
  } & ActionPayload[P];
};

type Actions = Action[keyof ActionPayload];

type Status =
  | 'INITIALIZED'
  | 'WAIT_FOR_PLAYER_PLAY'
  | 'WAIT_FOR_OPPONENT_PLAY'
  | 'FINISHED';
type PlayResult = 'CORRECT' | 'INCORRECT' | 'TIMED_OUT';

type State = {
  status: Status;
  solveCount: number;
  playResult: PlayResult | null;
  lastIncorrectPlayVertex: [x: number, y: number] | null;
};

const initialState: State = {
  status: 'INITIALIZED',
  solveCount: 0,
  playResult: null,
  lastIncorrectPlayVertex: null,
};

function reducer(state: State, action: Actions): State {
  switch (action.type) {
    case ActionType.START:
      return {
        ...state,
        status: 'WAIT_FOR_PLAYER_PLAY',
        playResult: null,
        lastIncorrectPlayVertex: null,
      };
    case ActionType.PLAY: {
      if (!action.playResult) {
        return state;
      }

      if (action.playResult.reachesToLastMove) {
        return {
          status: 'FINISHED',
          solveCount: state.solveCount + 1,
          playResult: action.playResult.advancesCorrectRoute
            ? 'CORRECT'
            : 'INCORRECT',
          lastIncorrectPlayVertex: action.playResult.advancesCorrectRoute
            ? null
            : action.vertex,
        };
      }

      return {
        ...state,
        status: 'WAIT_FOR_OPPONENT_PLAY',
      };
    }
    case ActionType.OPPONENT_PLAY: {
      if (action.reachesToLastMove) {
        return {
          status: 'FINISHED',
          solveCount: state.solveCount + 1,
          playResult: action.advancesCorrectRoute ? 'CORRECT' : 'INCORRECT',
          lastIncorrectPlayVertex: null,
        };
      }

      return {
        ...state,
        status: 'WAIT_FOR_PLAYER_PLAY',
      };
    }
    case ActionType.RUN_OUT_OF_TIME:
      return {
        ...state,
        status: 'FINISHED',
        playResult: 'TIMED_OUT',
      };
  }
}

export default function useSolveState(): [State, Dispatch<Actions>] {
  return useReducer(reducer, initialState);
}
