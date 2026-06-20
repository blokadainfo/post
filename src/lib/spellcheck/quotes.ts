const quoteRe = /["“”„‟«»]/g;
const spaceRe = /\s/u;
const wordRe = /[\p{L}\p{N}]/u;
const openRe = /[([{<„“"«»]/u;
const closeRe = /[)\]}>.,!?;:%…”"«»]/u;
const sentenceRe = /[.!?…]/u;

function charAt(value: string, index: number) {
  return index >= 0 && index < value.length ? (value[index] ?? '') : '';
}

function prevTextChar(value: string, from: number) {
  for (let i = from - 1; i >= 0; i -= 1) {
    const char = value[i];
    if (char && !spaceRe.test(char)) {
      return char;
    }
  }

  return '';
}

function nextTextChar(value: string, from: number) {
  for (let i = from + 1; i < value.length; i += 1) {
    const char = value[i];
    if (char && !spaceRe.test(char)) {
      return char;
    }
  }

  return '';
}

function quoteSide(prev: string, next: string, prevText: string, nextText: string) {
  const open =
    !prevText ||
    (spaceRe.test(prev) && wordRe.test(nextText)) ||
    (openRe.test(prevText) && !!nextText && !closeRe.test(nextText)) ||
    (sentenceRe.test(prevText) && wordRe.test(nextText));
  const close =
    (!nextText && !!prevText) ||
    ((wordRe.test(prevText) || closeRe.test(prevText)) &&
      (!next || spaceRe.test(next) || closeRe.test(nextText)));

  if (open && !close) {
    return 'open';
  }

  if (close && !open) {
    return 'close';
  }

  return 'ambiguous';
}

export function normalizeSerbianQuotationMarks(value: string) {
  let open = false;

  return value.replace(quoteRe, (match, offset: number) => {
    const prev = charAt(value, offset - 1);
    const next = charAt(value, offset + 1);
    const prevText = prevTextChar(value, offset);
    const nextText = nextTextChar(value, offset);
    const side = quoteSide(prev, next, prevText, nextText);
    const isOpen =
      side === 'open'
        ? true
        : side === 'close'
          ? false
          : match === '„'
            ? true
            : match === '”'
              ? false
              : !open;

    open = isOpen;
    if (!isOpen) {
      open = false;
    }

    return isOpen ? '„' : '”';
  });
}
