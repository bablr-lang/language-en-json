import { re, spam as m } from '@bablr/boot';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as productions from '@bablr/helpers/productions';
import { o, eat, eatMatch, match, fail, defineAttribute } from '@bablr/helpers/grammar';
import { buildString } from '@bablr/helpers/builders';
import * as Space from '@bablr/language-en-blank-space';

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

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: :Space: <*Space /[ \n\r\t]/ />`,
  },
  class JSONGrammar {
    constructor() {
      this.emptyables = new Set(['StringContent', 'List']);
      this.literals = new Set(['Punctuator', 'Keyword']);
    }

    *[Symbol.for('@bablr/fragment')]({ props: { rootMatcher } }) {
      // needed for the trivia plugin
      yield eat(rootMatcher);
    }

    *Expression() {
      if (yield eatMatch(m`<Array '[' />`)) {
      } else if (yield eatMatch(m`<Object '{' />`)) {
      } else if (yield eatMatch(m`<String /['"]/ />`)) {
      } else if (yield eatMatch(m`<Number /\d|-[\d\g]/ {span: 'Number'} />`)) {
      } else if (yield eatMatch(m`<Infinity /-?Infinity/ />`)) {
      } else if (yield eatMatch(m`<Null 'null' />`)) {
      } else {
        yield eatMatch(m`<Boolean /true|false/ />`);
      }
    }

    *Array() {
      yield eat(m`openToken: <* '[' { balanced: ']' } />`);
      yield eat(
        m`<__List />`,
        o({
          element: m`elements[]+$: <_Expression />`,
          separator: m`#separatorTokens[]: <* ',' />`,
          allowTrailingSeparator: false,
        }),
      );
      yield eat(m`closeToken: <* ']' { balancer: true } />`);
    }

    *Object() {
      yield eat(m`openToken: <* '{' { balanced: '}' } />`);
      let sep = true;

      yield eatMatch(m`#separatorTokens[]: []`);
      yield eatMatch(m`properties[]$: []`);

      while (sep && (yield match(re`/.|\g/s`))) {
        let suppressGap = !!(yield match(m`<__All />`, [m`key: <//>`, m`sigilToken: <* ':' />`]));
        yield eat(m`properties[]$: <Property />`, null, o({ suppressGap }));
        sep = yield eatMatch(m`#separatorTokens[]: <* ',' />`);
      }
      yield eat(m`closeToken: <* '}' { balancer: true } />`);
    }

    *Property() {
      yield eat(m`key$: <String />`);
      yield eat(m`sigilToken: <* ':' />`);
      yield eat(m`value+$: <_Expression />`);
    }

    *String() {
      yield eat(m`openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />`);

      yield eat(m`content$: <*StringContent />`);

      yield eat(m`closeToken: <* '"' { balancer: true } />`);
    }

    *StringContent({ state: { span } }) {
      let esc, lit;
      do {
        esc = (yield match('\\')) && (yield eat(m`@: <EscapeSequence />`));
        lit =
          span === 'String:Single'
            ? yield eatMatch(re`/[^\r\n\\'\g]+/`)
            : yield eatMatch(re`/[^\r\n\\"\g]+/`);
      } while (esc || lit);
    }

    *EscapeSequence({ state: { span }, ctx }) {
      if (!span.startsWith('String')) {
        yield fail();
      }

      yield eat(m`sigilToken: <* '\\' { openSpan: 'Escape' } />`);

      let match_;
      let cooked;

      if (
        (match_ =
          span === 'String:Single'
            ? yield match(re`/[\\/bfnrt0']/`)
            : yield match(re`/[\\/bfnrt0"]/`))
      ) {
        const matchText = ctx.sourceTextFor(match_);
        yield eat(m`code: <*Keyword ${buildString(matchText)} { closeSpan: 'Escape' } />`);

        cooked = escapables.get(matchText) || matchText;
      } else if (yield match('u')) {
        let codeNode = yield eat(m`code: <EscapeCode { closeSpan: 'Escape' } />`);

        const type = ctx.sourceTextFor(codeNode.get('typeToken'));

        if (type) {
          const value = ctx.sourceTextFor(codeNode.get('value'));

          if (!span.startsWith('String')) {
            throw new Error('not implemented');
          }

          if (type === 'u') {
            cooked = String.fromCharCode(parseInt(value, 16));
          } else {
            throw new Error();
          }
        } else {
          let value = ctx.sourceTextFor(codeNode);
          cooked = escapables.get(value) || value;
        }
      } else {
        yield fail();
      }

      yield defineAttribute('cooked', cooked);
    }

    *EscapeCode() {
      if (yield eatMatch(m`typeToken: <*Keyword 'u' />`)) {
        if (yield eatMatch(m`openToken: <* '{' { balanced: '}' } />`, null, o({ bind: true }))) {
          yield eat(m`value$: <*UnsignedHexInteger />`);
          yield eat(m`closeToken: <* '}' { balancer: true } />`);
        } else {
          yield eat(m`value$: <*UnsignedHexInteger /[\da-fA-F]{4}/ />`);
          yield eat(m`closeToken: null`);
        }
      }
    }

    *Number() {
      yield eat(m`wholePart$: <Integer />`, o({ noDoubleZero: true, matchSign: '-' }));

      let fs = yield eatMatch(m`fractionalSeparatorToken: <* '.' />`, null, o({ bind: true }));

      if (fs) {
        yield eat(m`fractionalPart$: <*UnsignedInteger />`);
      } else {
        yield eat(m`fractionalPart$: null`);
      }

      let es = yield eatMatch(m`exponentSeparatorToken: <* /[eE]/ />`, null, o({ bind: true }));

      if (es) {
        yield eat(m`exponentPart$: <Integer />`, { matchSign: /[+-]/ });
      } else {
        yield eat(m`exponentPart$: null`);
      }
    }

    *Integer({ props: { matchSign = null, noDoubleZero = false } }) {
      if (matchSign) {
        yield eatMatch(m`signToken: <* ${buildString(matchSign)} />`, null, o({ bind: true }));
      } else {
        yield eat(m`signToken: null`);
      }

      yield eat(m`value$: <*UnsignedInteger />`, o({ noDoubleZero }));
    }

    *UnsignedInteger({ props: { noDoubleZero = false }, ctx }) {
      let firstDigit = ctx.sourceTextFor(yield eat(re`/\d/`));

      if (!noDoubleZero || firstDigit.value !== '0') {
        yield eatMatch(re`/\d+/`);
      }
    }

    *UnsignedHexInteger() {
      yield eatMatch(re`/[\da-fA-F]+/`);
    }

    *Infinity() {
      yield eatMatch(m`signToken: <* '-' />`, null, o({ bind: true }));
      yield eat(m`sigilToken: <*Keyword 'Infinity' />`);
    }

    *Boolean() {
      yield eat(m`sigilToken: <*Keyword /true|false/ />`);
    }

    *Null() {
      yield eat(m`sigilToken: <*Keyword 'null' />`);
    }

    List(args) {
      return productions.List(args);
    }
  },
);
