declare module 'nspell' {
  export type Spell = {
    correct: (word: string) => boolean;
    suggest: (word: string) => string[];
    add: (word: string) => void;
  };

  export default function nspell(dictionary: { aff: string; dic: string }): Spell;
}

declare module '*.aff?url' {
  const value: string;
  export default value;
}

declare module '*.dic?url' {
  const value: string;
  export default value;
}
