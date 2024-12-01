import { re, spam as m } from '@bablr/boot';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as productions from '@bablr/helpers/productions';
import { eat, eatMatch, match, fail } from '@bablr/helpers/grammar';
import { o } from '@bablr/agast-vm-helpers/embed';
import { buildString, buildBoolean } from '@bablr/agast-vm-helpers';
import { Node, CoveredBy, AllowEmpty, InjectFrom } from '@bablr/helpers/decorators';
import * as Space from '@bablr/language-en-blank-space';

export const dependencies = { Space };

export const canonicalURL = 'https://github.com/bablr-lang/language-en-json';

export const escapables = new Map(
  Object.entries({
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
    '\\': '\\',
    '/': '/',
  }),
);

export const getCooked = (escapeNode, span, ctx) => {
  let cooked;
  const codeNode = escapeNode.get('code');
  const type = ctx.sourceTextFor(codeNode.get('typeToken'));
  const value = ctx.sourceTextFor(codeNode.get('value'));

  if (!span.startsWith('String')) {
    throw new Error('not implemented');
  }

  if (!type) {
    const match_ = ctx.sourceTextFor(codeNode);

    cooked = escapables.get(match_) || match_;
  } else if (type === 'u') {
    cooked = parseInt(value, 16);
  } else {
    throw new Error();
  }

  return cooked.toString(10);
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    *eatMatchTrivia() {
      if (yield match(re`/[ \n\r\t]/`)) {
        yield eat(m`#: <*Space:Space />`);
      }
    },
  },
  class JSONGrammar {
    *[Symbol.for('@bablr/fragment')]() {
      // needed for the trivia plugin
      yield eat(m`<? />`);
    }

    @CoveredBy('Element')
    *Expression() {
      yield eat(m`<Any />`, [
        m`<Array '[' />`,
        m`<Object '{' />`,
        m`<String '"' />`,
        m`<Number /-?\d/ span='Number' />`,
        m`<Null 'null' />`,
        m`<Boolean /true|false/ />`,
      ]);
    }

    @CoveredBy('Expression')
    @Node
    *Array() {
      yield eat(m`openToken: <*Punctuator '[' balanced=']' />`);
      yield eat(
        m`elements[]$: <List />`,
        o({
          element: m`<Expression />`,
          separator: m`<*Punctuator ',' />`,
          allowTrailingSeparator: false,
        }),
      );
      yield eat(m`closeToken: <*Punctuator ']' balancer />`);
    }

    @CoveredBy('Expression')
    @Node
    *Object() {
      yield eat(m`openToken: <*Punctuator '{' balanced='}' />`);
      let sep = true;

      yield eatMatch(m`separators[]: []`);
      yield eatMatch(m`properties[]$: []`);

      while (sep && (yield match(re`/./`))) {
        let suppressGap = yield match(m`<All />`, [m`<//>`, m`<*Punctuator ':' />`]);
        yield eat(m`properties[]$: <Property />`, null, o({ suppressGap }));
        sep = yield eatMatch(m`separators[]: <*Punctuator ',' />`);
      }
      yield eat(m`closeToken: <*Punctuator '}' balancer />`);
    }

    @Node
    *Property() {
      yield eat(m`key$: <String />`);
      yield eat(m`sigilToken: <*Punctuator ':' />`);
      yield eat(m`value$: <Expression />`);
    }

    @CoveredBy('Language')
    @Node
    *String() {
      yield eat(m`openToken: <*Punctuator '"' balanced='"' balancedSpan='String' />`);
      yield eat(m`content: <*StringContent />`);
      yield eat(m`closeToken: <*Punctuator '"' balancer />`);
    }

    @AllowEmpty
    @Node
    *StringContent() {
      let esc, lit;
      do {
        esc = (yield match('\\')) && (yield eat(m`.@: <EscapeSequence />`));
        lit = yield eatMatch(re`/[^\r\n\\"\g]+/`);
      } while (esc || lit);
    }

    @Node
    *EscapeSequence({ state: { span }, ctx }) {
      if (!span.startsWith('String')) {
        yield fail();
      }

      yield eat(m`sigilToken: <*Punctuator '\\' openSpan='Escape' />`);

      let match;

      if ((match = yield match(re`/[\\/bfnrt"]/`))) {
        const match_ = ctx.sourceTextFor(match);
        yield eat(m`code: <*Keyword ${buildString(match_)} closeSpan='Escape' />`);
      } else if (yield match('u')) {
        yield eat(m`code: <EscapeCode closeSpan='Escape' />`);
      } else {
        yield fail();
      }
    }

    @Node
    *EscapeCode() {
      yield eat(m`typeToken: <*Keyword 'u' />`);
      yield eat(m`value$: <*UnsignedInteger />`);
    }

    @CoveredBy('Expression')
    @Node
    *Number() {
      yield eat(m`wholePart: <Integer /> { noDoubleZero: true matchSign: '-' }`);

      let fs = yield eatMatch(m`fractionalSeparatorToken: <*Punctuator '.' />`);

      if (fs) {
        yield eat(m`fractionalPart: <Integer />`);
      } else {
        yield eat(m`fractionalPart: null`);
      }

      let es = yield eatMatch(m`exponentSeparatorToken: <*Punctuator /[eE]/ />`);

      if (es) {
        yield eat(m`exponentPart: <Integer /> { matchSign: /[+-]/ }`);
      } else {
        yield eat(m`exponentPart: null`);
      }
    }

    @Node
    *Integer({ value: props, ctx }) {
      const { matchSign = null, noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      if (matchSign) {
        yield eatMatch(m`signToken: <*Punctuator ${matchSign} />`);
      } else {
        yield eat(m`signToken: null`);
      }

      yield eat(m`value: <*UnsignedInteger noDoubleZero=${buildBoolean(noDoubleZero)} />`);
    }

    @Node
    *UnsignedInteger({ value: props, ctx }) {
      const { noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      let firstDigit = ctx.getCooked(yield eat(re`/\d/`));

      if (!noDoubleZero || firstDigit.value !== '0') {
        yield eatMatch(re`/\d+/`);
      }
    }

    @CoveredBy('Expression')
    @Node
    *Boolean() {
      yield eat(m`sigilToken: <*Keyword /true|false/ />`);
    }

    @CoveredBy('Expression')
    @Node
    *Null() {
      yield eat(m`sigilToken: <*Keyword 'null' />`);
    }

    @Node
    @InjectFrom(productions)
    *Keyword() {}

    @Node
    @InjectFrom(productions)
    *Punctuator() {}

    @AllowEmpty
    @InjectFrom(productions)
    *List() {}

    @InjectFrom(productions)
    *Any() {}

    @InjectFrom(productions)
    *All() {}
  },
);
