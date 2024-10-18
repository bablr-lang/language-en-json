import { i } from '@bablr/boot/shorthand.macro';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as productions from '@bablr/helpers/productions';
import { buildString, buildBoolean } from '@bablr/agast-vm-helpers';
import {
  Node,
  CoveredBy,
  AllowEmpty,
  InjectFrom,
  UnboundAttributes,
} from '@bablr/helpers/decorators';
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
      if (yield i`match(/[ \n\r\t]/)`) {
        yield i`eat(<#*Space:Space />)`;
      }
    },
  },
  class JSONGrammar {
    *[Symbol.for('@bablr/fragment')]() {
      // needed for the trivia plugin
      yield i`eat(< />)`;
    }

    @CoveredBy('Element')
    *Expression() {
      yield i`eat(<Any /> null [
        <Array '[' />
        <Object '{' />
        <String '"' />
        <Number /-?\d/ span='Number' />
        <Null 'null' />
        <Boolean /true|false/ />
      ])`;
    }

    @CoveredBy('Expression')
    @Node
    *Array() {
      yield i`eat(<*Punctuator '[' balanced=']' /> 'openToken')`;
      yield i`eat(<List /> 'elements[]$' {
        element: <Expression />
        separator: <*Punctuator ',' />
        allowTrailingSeparator: false
      })`;
      yield i`eat(<*Punctuator ']' balancer /> 'closeToken')`;
    }

    @CoveredBy('Expression')
    @Node
    *Object() {
      yield i`eat(<*Punctuator '{' balanced='}' /> 'openToken')`;
      yield i`eat(<List /> 'properties[]$' {
        element: <Property />
        separator: <*Punctuator ',' />
        allowTrailingSeparator: false
      })`;
      yield i`eat(<*Punctuator '}' balancer /> 'closeToken')`;
    }

    @Node
    *Property() {
      yield i`eat(<String /> 'key$')`;
      yield i`eat(<*Punctuator ':' /> 'sigilToken')`;
      yield i`eat(<Expression /> 'value$')`;
    }

    @CoveredBy('Language')
    @Node
    *String() {
      yield i`eat(<*Punctuator '"' balanced='"' balancedSpan='String' /> 'openToken')`;
      yield i`eat(<*StringContent /> 'content')`;
      yield i`eat(<*Punctuator '"' balancer /> 'closeToken')`;
    }

    @AllowEmpty
    @Node
    *StringContent() {
      let esc, lit;
      do {
        esc = (yield i`match('\\')`) && (yield i`eat(<@EscapeSequence />)`);
        lit = yield i`eatMatch(/[^\r\n\\"\g]+/)`;
      } while (esc || lit);
    }

    @Node
    *EscapeSequence({ state: { span }, ctx }) {
      if (!span.startsWith('String')) {
        yield i`fail()`;
      }

      yield i`eat(<*Punctuator '\\' openSpan='Escape' /> 'sigilToken')`;

      let match;

      if ((match = yield i`match(/[\\/bfnrt"]/)`)) {
        const match_ = ctx.sourceTextFor(match);
        yield i`eat(<*Keyword ${buildString(match_)} closeSpan='Escape' /> 'code')`;
      } else if (yield i`match('u')`) {
        yield i`eat(<EscapeCode closeSpan='Escape' /> 'code')`;
      } else {
        yield i`fail()`;
      }
    }

    @Node
    *EscapeCode() {
      yield i`eat(<*Keyword 'u' /> 'typeToken')`;
      yield i`eat(<*UnsignedInteger /> 'value$')`;
    }

    @CoveredBy('Expression')
    @Node
    *Number() {
      yield i`eat(<Integer /> 'wholePart' { noDoubleZero: true matchSign: '-' })`;

      let fs = yield i`eatMatch(<*Punctuator '.' /> 'fractionalSeparatorToken')`;

      if (fs) {
        yield i`eat(<Integer /> 'fractionalPart')`;
      } else {
        yield i`eat(null 'fractionalPart')`;
      }

      let es = yield i`eatMatch(<*Punctuator /[eE]/ /> 'exponentSeparatorToken')`;

      if (es) {
        yield i`eat(<Integer /> 'exponentPart' { matchSign: /[+-]/ })`;
      } else {
        yield i`eat(null 'exponentPart')`;
      }
    }

    @Node
    *Integer({ value: props, ctx }) {
      const { matchSign = null, noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      if (matchSign) {
        yield i`eatMatch(<*Punctuator ${matchSign} /> 'signToken')`;
      } else {
        yield i`eat(null 'signToken')`;
      }

      yield i`eat(<*UnsignedInteger noDoubleZero=${buildBoolean(noDoubleZero)} /> 'value')`;
    }

    @Node
    *UnsignedInteger({ value: props, ctx }) {
      const { noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      let [firstDigit] = ctx.allTagsFor(yield i`eat(/\d/)`);

      if (!noDoubleZero || firstDigit.value !== '0') {
        yield i`eatMatch(/\d+/)`;
      }
    }

    @CoveredBy('Expression')
    @Node
    *Boolean() {
      yield i`eat(<*Keyword /true|false/ /> 'sigilToken')`;
    }

    @CoveredBy('Expression')
    @Node
    *Null() {
      yield i`eat(<*Keyword 'null' /> 'sigilToken')`;
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
  },
);
