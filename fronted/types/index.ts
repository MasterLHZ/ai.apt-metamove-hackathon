// src/types/index.ts
export type Status = 'ACTIVE' | 'EXPIRED';

export interface Prediction {
  id: string;
  title: string;
  status: Status;
  datetime: string;
  yesOption: {
    text: string;
    odds: string;
  };
  noOption: {
    text: string;
    odds: string;
  };
}
