import { re, spam as m } from '@bablr/boot';
import * as productions from '@bablr/helpers/productions';
import {
  o,
  eat,
  eatMatch,
  match,
  fail,
  defineAttribute,
  startSpan,
  endSpan,
} from '@bablr/helpers/grammar';
import { buildString } from '@bablr/helpers/builders';
import Space from '@bablr/language-en-blank-space';
import { get, printSource } from '@bablr/agast-helpers/tree';

export const dependencies = { Space };

export const canonicalURL = 'https://bablr.org/languages/core/en/json';

export const defaultMatcher = m`<_Expression />`;

const escapables = new Map(
  Object.entries({
    b: '\b', // these two escapes are antiquated
    f: '\f', // but giving their meaning away could be confusing
    n: '\n',
    r: '\r',
    t: '\t',
    0: '\0',
  }),
);

export function* eatMatchTrivia() {
  let trivia = null;
  while (yield match(re`/[ \t\r\n]/`)) {
    trivia = yield eat(m`#: :Space: <_Blank />`);
  }
  return trivia;
}

export const grammar = class JSONGrammar {
  constructor() {
    this.emptyables = new Set(['StringContent', 'List']);
    this.literals = new Set(['Keyword']);
  }

  *[Symbol.for('@bablr/fragment')]({ props: { rootMatcher } }) {
    yield* eatMatchTrivia();
    yield eat(rootMatcher);
    yield* eatMatchTrivia();
  }

  *Expression() {
    if (yield eatMatch(m`<Array '[' />`)) {
    } else if (yield eatMatch(m`<Object '{' />`)) {
    } else if (yield eatMatch(m`<String /['"]/ />`)) {
    } else if (yield eatMatch(m`<Number /\d|-[\d\g]/ />`)) {
    } else if (yield eatMatch(m`<Null 'null' />`)) {
    } else {
      yield eatMatch(m`<Boolean /true|false/ />`);
    }
  }

  *Array() {
    yield eat(m`openToken*: <* '[' />`);
    yield* eatMatchTrivia();
    let sep = true;

    while (sep && (yield match(re`/[^\]]/s`))) {
      yield eat(m`elements[]$: <_Expression />`);
      yield* eatMatchTrivia();
      sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
      if (sep) {
        yield* eatMatchTrivia();
      }
    }
    yield eat(m`closeToken*: <* ']' />`);
  }

  *Object() {
    yield eat(m`openToken*: <* '{' />`);
    yield* eatMatchTrivia();
    let sep = true;

    while (sep && (yield match(re`/[^}]/s`))) {
      let suppressGap = !!(yield match(m`<__All />`, [m`key$: <//>`, m`sigilToken*: <* ':' />`]));
      yield eat(m`properties[]$: <Property />`, null, o({ suppressGap }));
      yield* eatMatchTrivia();
      sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
      if (sep) {
        yield* eatMatchTrivia();
      }
    }
    yield eat(m`closeToken*: <* '}' />`);
  }

  *Property() {
    yield eat(m`key$: <String />`);
    yield* eatMatchTrivia();
    yield eat(m`sigilToken*: <* ':' />`);
    yield* eatMatchTrivia();
    yield eat(m`value+$: <_Expression />`);
  }

  *String() {
    yield eat(m`openToken*: <* '"' />`);
    yield startSpan('String:Double', '"');
    yield eat(m`content$: <*StringContent />`);
    yield endSpan();
    yield eat(m`closeToken*: <* '"' />`);
  }

  *StringContent() {
    let esc, lit;
    do {
      lit = yield eatMatch(re`/[^\r\n\\\g]+/`);
      esc = yield eatMatch(m`@: <EscapeSequence '\\' />`);
    } while (esc || lit);
  }

  *EscapeSequence() {
    yield startSpan('Escape');
    yield eat(m`sigilToken*: <* '\\' />`);

    let match_;
    let cooked;

    if ((match_ = yield match(re`/[\\/bfnrt0"]/`))) {
      const matchText = printSource(match_);
      yield eat(m`code*: <*Keyword ${buildString(matchText)} />`);

      cooked = escapables.get(matchText) || matchText;
    } else if (yield match('u')) {
      let codeNode = yield eat(m`code*: <EscapeCode />`);

      const type = printSource(get('typeToken', codeNode.node));

      if (type) {
        const value = printSource(get('value', codeNode.node));

        if (type === 'u') {
          cooked = String.fromCharCode(parseInt(value, 16));
        } else {
          throw new Error();
        }
      } else {
        let value = printSource(codeNode.node);
        cooked = escapables.get(value) || value;
      }
    } else {
      yield fail();
    }

    // TODO error if we don't see the span ended
    yield endSpan();

    yield defineAttribute('cooked', cooked);
  }

  *EscapeCode() {
    if (yield eatMatch(m`typeToken*: <*Keyword 'u' />`)) {
      if (yield eatMatch(m`openToken*: <* '{' />`, null, o({ bind: true }))) {
        yield* eatMatchTrivia();
        yield eat(m`value$: <*UnsignedHexInteger />`);
        yield* eatMatchTrivia();
        yield eat(m`closeToken*: <* '}' />`);
      } else {
        yield eat(m`value$: <*UnsignedHexInteger /[\da-fA-F]{4}/ />`);
        yield eat(m`closeToken*: null`);
      }
    }
  }

  *Number() {
    yield eat(m`wholePart$: <Integer />`, o({ noDoubleZero: true, matchSign: '-' }));

    let fs = yield eatMatch(m`fractionalSeparatorToken*: <* '.' />`, null, o({ bind: true }));

    if (fs) {
      yield eat(m`fractionalPart$: <*UnsignedInteger />`);
    } else {
      yield eat(m`fractionalPart$: null`);
    }

    let es = yield eatMatch(m`exponentSeparatorToken*: <* /[eE]/ />`, null, o({ bind: true }));

    if (es) {
      yield eat(m`exponentPart$: <Integer />`, { matchSign: /[+-]/ });
    } else {
      yield eat(m`exponentPart$: null`);
    }
  }

  *Integer({ props: { matchSign = null, noDoubleZero = false } }) {
    if (matchSign) {
      yield eatMatch(m`signToken*: <* ${buildString(matchSign)} />`, null, o({ bind: true }));
    } else {
      yield eat(m`signToken*: null`);
    }

    yield eat(m`value$: <*UnsignedInteger />`, o({ noDoubleZero }));
  }

  *UnsignedInteger({ props: { noDoubleZero = false } }) {
    let firstDigit = printSource(yield eat(re`/\d/`));

    if (!noDoubleZero || firstDigit.value !== '0') {
      yield eatMatch(re`/\d+/`);
    }
  }

  *UnsignedHexInteger() {
    yield eatMatch(re`/[\da-fA-F]+/`);
  }

  *Boolean() {
    yield eat(m`sigilToken*: <*Keyword /true|false/ />`);
  }

  *Null() {
    yield eat(m`sigilToken*: <*Keyword 'null' />`);
  }

  All(args) {
    return productions.All(args);
  }
};

export default { canonicalURL, dependencies, grammar, defaultMatcher };
