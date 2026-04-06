import * as productions from '@bablr/helpers/productions';
import {
  m,
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
import * as BSet from '@bablr/agast-helpers/b-set';
import { get, printSource } from '@bablr/agast-helpers/tree';
import { freeze } from '@bablr/agast-helpers/object';

const escapables = Object.freeze({
  b: '\b', // these two escapes are antiquated
  f: '\f', // but giving their meaning away could be confusing
  n: '\n',
  r: '\r',
  t: '\t',
  0: '\0',
});

export function* eatMatchTrivia() {
  let trivia = null;
  while (yield match(m`/[ \t\r\n]/`)) {
    trivia = yield eat(m`#: :Space: <_Blank />`);
  }
  return trivia;
}

export default class JSON {
  static canonicalURL = 'https://bablr.org/languages/core/en/json';
  static dependencies = freeze({ Space });
  static defaultMatcher = m`<_Expression />`;
  static fragmentProduction = 'Fragment';

  constructor() {
    this.emptyables = BSet.from('StringContent', 'List');
    this.literals = BSet.from('Keyword');
  }

  *Fragment({ props: { rootMatcher } }) {
    yield* eatMatchTrivia();
    yield eat(rootMatcher);
    yield* eatMatchTrivia();
  }

  *Expression() {
    let res = yield match(m`/[\d[{'"-]|null|true|false/`);
    switch (printSource(res)) {
      case '[':
        yield eat(m`<Array />`);
        break;
      case '{':
        yield eat(m`<Object />`);
        break;
      case "'":
      case '"':
        yield eat(m`<String />`);
        break;
      case 'true':
      case 'false':
        yield eat(m`<Boolean />`);
        break;
      case 'null':
        yield eat(m`<Null />`);
        break;
      default:
        yield eat(m`<Number />`);
        break;
    }
  }

  *Array() {
    yield eat(m`openToken*: <* '[' />`);
    yield* eatMatchTrivia();
    let sep = true;

    while (sep && (yield match(m`/[^\]]/s`))) {
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

    while (sep && (yield match(m`/[^}]/s`))) {
      yield match(m`<__All />`, [m`key$: <//>`, m`sigilToken*: <* ':' />`]);
      yield eat(m`properties[]$: <Property />`);
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
    yield eat(m`value$: <_Expression />`);
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
      lit = yield eatMatch(m`/[^\r\n\\\g]+/`);
      esc = yield eatMatch(m`@: <EscapeSequence '\\' />`);
    } while (esc || lit);
  }

  *EscapeSequence({ ctx }) {
    let { getGapNode } = ctx;

    yield startSpan('Escape');
    yield eat(m`sigilToken*: <* '\\' />`);

    let match_;
    let cooked;

    if ((match_ = yield match(m`/[\\/bfnrt0"]/`))) {
      const matchText = printSource(match_);
      yield eat(m`code*: <*Keyword ${buildString(matchText)} />`);

      cooked = escapables[matchText] || matchText;
    } else if (yield match(m`'u'`)) {
      let codeNode = yield eat(m`code*: <EscapeCode />`);

      const type = printSource(get('typeToken', codeNode.node));

      if (type) {
        const value = printSource(getGapNode(get('value', codeNode.node)));

        if (type === 'u') {
          cooked = String.fromCharCode(parseInt(value, 16));
        } else {
          throw new Error();
        }
      } else {
        let value = printSource(codeNode.node, { getGapNode });
        cooked = escapables[value] || value;
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
      if (yield eatMatch(m`openToken*: <* '{' />`)) {
        yield* eatMatchTrivia();
        yield eat(m`value: <*UnsignedHexInteger />`);
        yield* eatMatchTrivia();
        yield eat(m`closeToken*: <* '}' />`);
      } else {
        yield eat(m`value: <*UnsignedHexInteger /[\da-fA-F]{4}/ />`);
      }
    }
  }

  *Number() {
    yield eat(m`wholePart$: <Integer />`, o({ noDoubleZero: true, matchSign: '-' }));

    let fs = yield eatMatch(m`fractionalSeparatorToken*: <* '.' />`);

    if (fs) {
      yield eat(m`fractionalPart$: <*UnsignedInteger />`);
    } else {
      yield eat(m`fractionalPart$: null`);
    }

    let es = yield eatMatch(m`exponentSeparatorToken*: <* /[eE]/ />`);

    if (es) {
      yield eat(m`exponentPart$: <Integer />`, { matchSign: /[+-]/ });
    } else {
      yield eat(m`exponentPart$: null`);
    }
  }

  *Integer({ props: { matchSign = null, noDoubleZero = false } }) {
    if (matchSign) {
      yield eatMatch(m`signToken*: <* ${buildString(matchSign)} />`);
    }

    yield eat(m`value$: <*UnsignedInteger />`, o({ noDoubleZero }));
  }

  *UnsignedInteger({ props: { noDoubleZero = false } }) {
    let firstDigit = printSource(yield eat(m`/\d/`));

    if (!noDoubleZero || firstDigit.value !== '0') {
      yield eatMatch(m`/\d+/`);
    }
  }

  *UnsignedHexInteger() {
    yield eatMatch(m`/[\da-fA-F]+/`);
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
}

freeze(JSON);
freeze(JSON.prototype);
