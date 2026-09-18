export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export type PlayerRole =
  | 'goalkeeper'
  | 'center-back'
  | 'full-back'
  | 'defensive-midfielder'
  | 'central-midfielder'
  | 'attacking-midfielder'
  | 'winger'
  | 'striker';

export type SkillKey =
  | 'intelligence'
  | 'dribbling'
  | 'vision'
  | 'finishing'
  | 'setPieces'
  | 'passing'
  | 'heading'
  | 'pace'
  | 'stamina'
  | 'goalkeeping'
  | 'defending'
  | 'midfieldPlay'
  | 'attackingPlay'
  | 'wingPlay';

export interface PlayerSkills {
  intelligence: number;
  dribbling: number;
  vision: number;
  finishing: number;
  setPieces: number;
  passing: number;
  heading: number;
  pace: number;
  stamina: number;
  goalkeeping: number;
  defending: number;
  midfieldPlay: number;
  attackingPlay: number;
  wingPlay: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  primaryRole: PlayerRole;
  secondaryRoles: PlayerRole[];
  skills: PlayerSkills;
  asi: number;
  value: number;
  isForSale: boolean;
  askingPrice?: number;
}
