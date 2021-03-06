import { Subtitle } from '../subtitle.schema'

export interface AssSubtitle extends Subtitle {
  format: string;
  original: string;
  data: AssData;
};

export interface AssData {
  scriptInfo: AssScriptInfo[];
  dialogues: AssDialogue[];
  lastDialogueId: number;
  styles: AssStyle[];
  lastStyleId: number;
}

export interface AssScriptInfo {
  prop: string;
  value: string | number | boolean;
}

export interface AssStyle {
  id: number;
  name: string;
  fontname: string;
  fontsize: number;
  primaryColour: string;
  secondaryColour: string;
  outlineColour: string;
  backColour: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeOut: boolean;
  scaleX: number;
  scaleY: number;
  spacing: number;
  angle: number;
  borderStyle: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginL: number;
  marginR: number;
  marginV: number;
  encoding: number;
}

export interface AssDialogue {
  id: number;
  layer: number;
  start: number;
  end: number;
  style: string;
  name: string;
  marginL: number;
  marginR: number;
  marginV: number;
  effect: string;
  text: string;
}
