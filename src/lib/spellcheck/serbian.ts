import nspell from 'nspell';
import affUrl from '../../../node_modules/dictionary-sr-latn/index.aff?url';
import dicUrl from '../../../node_modules/dictionary-sr-latn/index.dic?url';
import type { Spell } from 'nspell';
import { normalizeSerbianQuotationMarks } from './quotes';

export type SpellcheckIssue = {
  word: string;
  start: number;
  end: number;
  suggestions: string[];
};

type SpellResources = {
  spell: Spell;
};

let spellPromise: Promise<SpellResources> | undefined;
const wordPattern = /[\p{L}]+(?:['’][\p{L}]+)?/gu;
const ignoredPattern = /^(?:https?|www|com|rs|org|net|html|css|js|ts)$/i;
export const strictCorrections = new Map<string, readonly string[]>([
  ['mogo', ['mogao']],
  ["mog'o", ['mogao']],
  ['trebo', ['trebao']],
  ["treb'o", ['trebao']],
  ['reko', ['rekao']],
  ["rek'o", ['rekao']],
  ['prico', ['pričao']],
  ['pričo', ['pričao']],
  ["prič'o", ['pričao']],
  ['piso', ['pisao']],
  ["pis'o", ['pisao']],
  ['čito', ['čitao']],
  ["čit'o", ['čitao']],
  ['igro', ['igrao']],
  ["igr'o", ['igrao']],
  ['gledo', ['gledao']],
  ["gled'o", ['gledao']],
  ['slušo', ['slušao']],
  ["sluš'o", ['slušao']],
  ['pito', ['pitao']],
  ["pit'o", ['pitao']],
  ['došo', ['došao']],
  ['dosao', ['došao']],
  ["doš'o", ['došao']],
  ['otišo', ['otišao']],
  ['otisao', ['otišao']],
  ["otiš'o", ['otišao']],
  ['išo', ['išao']],
  ['isao', ['išao']],
  ["iš'o", ['išao']],
  ['ušo', ['ušao']],
  ['usao', ['ušao']],
  ["uš'o", ['ušao']],
  ['izašo', ['izašao']],
  ['izasao', ['izašao']],
  ["izaš'o", ['izašao']],
  ['našo', ['našao']],
  ['nasao', ['našao']],
  ["naš'o", ['našao']],
  ['prošo', ['prošao']],
  ['prosao', ['prošao']],
  ["proš'o", ['prošao']],
  ['prešo', ['prešao']],
  ['presao', ['prešao']],
  ["preš'o", ['prešao']],
  ['prišo', ['prišao']],
  ['prisao', ['prišao']],
  ["priš'o", ['prišao']],
  ['stigo', ['stigao']],
  ["stig'o", ['stigao']],
  ['digo', ['digao']],
  ["dig'o", ['digao']],
  ['podigo', ['podigao']],
  ["podig'o", ['podigao']],
  ['lego', ['legao']],
  ["leg'o", ['legao']],
  ['pobego', ['pobegao']],
  ["pobeg'o", ['pobegao']],
  ['neznam', ['ne znam']],
  ['neznaš', ['ne znaš']],
  ['nezna', ['ne zna']],
  ['neznamo', ['ne znamo']],
  ['neznate', ['ne znate']],
  ['neznaju', ['ne znaju']],
  ['nemogu', ['ne mogu']],
  ['nemože', ['ne može']],
  ['nemožemo', ['ne možemo']],
  ['nemožete', ['ne možete']],
  ['nemoraju', ['ne moraju']],
  ['netreba', ['ne treba']],
  ['neželim', ['ne želim']],
  ['nezelim', ['ne želim']],
  ['nevidim', ['ne vidim']],
  ['neverujem', ['ne verujem']],
  ['nebih', ['ne bih']],
  ['nebi', ['ne bi']],
  ['doćiću', ['doći ću']],
  ['dociću', ['doći ću']],
  ['rećiću', ['reći ću']],
  ['reciću', ['reći ću']],
  ['moćiću', ['moći ću']],
  ['mociću', ['moći ću']],
  ['poćiću', ['poći ću']],
  ['pociću', ['poći ću']],
  ['ućiću', ['ući ću']],
  ['uciću', ['ući ću']],
  ['izaćiću', ['izaći ću']],
  ['izaciću', ['izaći ću']],
  ['samnom', ['sa mnom']],
  ['zamnom', ['za mnom']],
  ['predamnom', ['preda mnom']],
  ['stobom', ['s tobom', 'sa tobom']],
  ['dal', ['da li']],
  ['jel', ['je li', 'da li']],
  ['el', ['je li', 'da li']],
  ['sta', ['šta']],
  ['cu', ['ću']],
  ['ces', ['ćeš']],
  ['ce', ['će']],
  ['cemo', ['ćemo']],
  ['cete', ['ćete']],
  ['ajd', ['hajde']],
  ['ajde', ['hajde']],
  ["k'o", ['kao']],
  ['kolko', ['koliko']],
  ["kol'ko", ['koliko']],
  ['tolko', ['toliko']],
  ["tol'ko", ['toliko']],
  ['ovolko', ['ovoliko']],
  ["ovol'ko", ['ovoliko']],
  ['onolko', ['onoliko']],
  ["onol'ko", ['onoliko']],
  ['odma', ['odmah']],
]);
const customWords = buildCustomWords(['Instagram', 'Facebook', 'YouTube', 'TikTok', 'X']);
const serbianDiacriticsPattern = /[čćšžđČĆŠŽĐ]/;

function normalizeCorrectionKey(word: string) {
  return word.toLocaleLowerCase('sr-Latn').replaceAll('’', "'");
}

function buildCustomWords(words: readonly string[]) {
  const variants = new Set<string>();

  for (const word of words) {
    variants.add(word);

    const lowerCased = word.toLocaleLowerCase('sr-Latn');
    if (lowerCased !== word) {
      variants.add(lowerCased);
    }

    const titleCased = lowerCased.charAt(0).toLocaleUpperCase('sr-Latn') + lowerCased.slice(1);
    if (titleCased !== word) {
      variants.add(titleCased);
    }
  }

  return [...variants];
}

async function getSpell() {
  spellPromise ??= Promise.all([fetch(affUrl), fetch(dicUrl)])
    .then(async ([affResponse, dicResponse]) => ({
      aff: await affResponse.text(),
      dic: await dicResponse.text(),
    }))
    .then((dictionary) => {
      const spell = nspell(dictionary);
      customWords.forEach((word) => {
        spell.add(word);
      });
      return { spell };
    });

  return spellPromise;
}

function stripSerbianDiacritics(value: string) {
  return value
    .toLocaleLowerCase('sr-Latn')
    .replace(/dž/g, 'dz')
    .replace(/đ/g, 'dj')
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z');
}

function getBoundedLevenshteinDistance(left: string, right: string, maxDistance: number) {
  const leftLength = left.length;
  const rightLength = right.length;
  if (Math.abs(leftLength - rightLength) > maxDistance) {
    return maxDistance + 1;
  }

  let previous = Array.from({ length: rightLength + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = current[0];

    for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const value = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
      current[rightIndex] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > maxDistance) {
      return maxDistance + 1;
    }

    previous = current;
  }

  return previous[rightLength];
}

function rankSuggestions(word: string, suggestions: readonly string[]) {
  const normalizedWord = word.toLocaleLowerCase('sr-Latn');

  return [...new Set(suggestions)]
    .sort((left, right) => {
      const leftScore =
        (stripSerbianDiacritics(left) === stripSerbianDiacritics(word) ? 0 : 10) +
        getBoundedLevenshteinDistance(normalizedWord, left.toLocaleLowerCase('sr-Latn'), 4);
      const rightScore =
        (stripSerbianDiacritics(right) === stripSerbianDiacritics(word) ? 0 : 10) +
        getBoundedLevenshteinDistance(normalizedWord, right.toLocaleLowerCase('sr-Latn'), 4);

      return leftScore - rightScore || left.localeCompare(right, 'sr-Latn');
    })
    .slice(0, 4);
}

function isAllUppercaseWord(word: string) {
  return word === word.toLocaleUpperCase('sr-Latn');
}

function isTitleCaseWord(word: string) {
  const [first = '', ...rest] = [...word];
  return (
    !!first &&
    first === first.toLocaleUpperCase('sr-Latn') &&
    rest.join('') === rest.join('').toLocaleLowerCase('sr-Latn')
  );
}

function applyWordCase(source: string, target: string) {
  if (isAllUppercaseWord(source)) {
    return target.toLocaleUpperCase('sr-Latn');
  }

  if (isTitleCaseWord(source)) {
    return target.charAt(0).toLocaleUpperCase('sr-Latn') + target.slice(1);
  }

  return target;
}

function collectStrippedLatinVariants(word: string) {
  const normalizedWord = word.toLocaleLowerCase('sr-Latn');
  const results = new Set<string>();

  function visit(index: number, built: string, changed: boolean) {
    if (results.size >= 16) {
      return;
    }

    if (index >= normalizedWord.length) {
      if (changed) {
        results.add(applyWordCase(word, built));
      }
      return;
    }

    const remaining = normalizedWord.slice(index);
    if (remaining.startsWith('dj')) {
      visit(index + 2, `${built}dj`, changed);
      visit(index + 2, `${built}đ`, true);
      return;
    }

    if (remaining.startsWith('dz')) {
      visit(index + 2, `${built}dz`, changed);
      visit(index + 2, `${built}dž`, true);
      return;
    }

    const character = normalizedWord[index] ?? '';
    if (character === 'c') {
      visit(index + 1, `${built}c`, changed);
      visit(index + 1, `${built}č`, true);
      visit(index + 1, `${built}ć`, true);
      return;
    }

    if (character === 's') {
      visit(index + 1, `${built}s`, changed);
      visit(index + 1, `${built}š`, true);
      return;
    }

    if (character === 'z') {
      visit(index + 1, `${built}z`, changed);
      visit(index + 1, `${built}ž`, true);
      return;
    }

    visit(index + 1, `${built}${character}`, changed);
  }

  visit(0, '', false);
  return [...results];
}

function getStrippedLatinSuggestions(spell: Spell, word: string) {
  if (
    word.length < 4 ||
    serbianDiacriticsPattern.test(word) ||
    isTitleCaseWord(word) ||
    isAllUppercaseWord(word)
  ) {
    return [];
  }

  return rankSuggestions(
    word,
    collectStrippedLatinVariants(word).filter(
      (candidate) =>
        candidate !== word && serbianDiacriticsPattern.test(candidate) && spell.correct(candidate)
    )
  );
}

function createIssue(word: string, start: number, suggestions: string[]): SpellcheckIssue {
  return {
    word,
    start,
    end: start + word.length,
    suggestions,
  };
}

function shouldSkipWord(word: string, previous?: string) {
  return (
    word.length < 2 ||
    ignoredPattern.test(word) ||
    previous === '#' ||
    previous === '@' ||
    /\d/.test(word)
  );
}

export async function checkSerbianLatinText(value: string) {
  const { spell } = await getSpell();
  const issues: SpellcheckIssue[] = [];
  const normalizedValue = normalizeSerbianQuotationMarks(value);

  for (const match of normalizedValue.matchAll(wordPattern)) {
    const word = match[0];
    const start = match.index ?? 0;
    const previous = normalizedValue[start - 1];
    const normalizedWord = normalizeCorrectionKey(word);
    if (shouldSkipWord(word, previous)) {
      continue;
    }

    const strictSuggestions = strictCorrections.get(normalizedWord);
    if (strictSuggestions) {
      issues.push(createIssue(word, start, [...strictSuggestions]));
      continue;
    }

    const strippedLatinSuggestions = getStrippedLatinSuggestions(spell, word);
    if (strippedLatinSuggestions.length > 0 && strippedLatinSuggestions.length <= 3) {
      issues.push(createIssue(word, start, strippedLatinSuggestions));
      continue;
    }

    if (!spell.correct(word)) {
      const suggestions = rankSuggestions(word, spell.suggest(word));
      issues.push(createIssue(word, start, suggestions));
    }
  }

  return issues;
}
