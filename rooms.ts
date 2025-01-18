export interface RoomState {
  players: Record<string, PlayerState>;
  question: QuestionState | null;
}

export interface PlayerState {
  score: number;
  isHost: boolean;
}

export interface QuestionDefinition {
  category: string;
  question: string;
  answer: string[];
  info: string;
}

export interface QuestionState extends QuestionDefinition {
  answeringPlayer: string | null;
  answerIsCorrect: boolean | null;
}
