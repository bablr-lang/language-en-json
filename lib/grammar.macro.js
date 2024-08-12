import { i } from '@bablr/boot/shorthand.macro';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as productions from '@bablr/helpers/productions';
import { buildString, buildBoolean } from '@bablr/agast-vm-helpers';
import { Node, CoveredBy, AllowEmpty, InjectFrom, Attributes } from '@bablr/helpers/decorators';
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

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    *eatMatchTrivia() {
      if (yield i`match(/[ \n\r\t]/)`) {
        yield i`eat(<#*Space:Space>)`;
      }
    },
  },
  class JSONGrammar {
    *[Symbol.for('@bablr/fragment')]() {
      yield i`eat(<> 'root')`;
    }

    @CoveredBy('Element')
    *Expression() {
      yield i`eat(<Any> null [
        <Array '['>
        <Object '{'>
        <String '"'>
        <Number /-?\d/ span='Number'>
        <Null 'null'>
        <Boolean /true|false/>
      ])`;
    }

    @CoveredBy('Expression')
    @Node
    *Array() {
      yield i`eat(<~*Punctuator '[' balanced=']'> 'openToken')`;
      yield i`eat(<List> 'elements[]' {
        element: <Expression>
        separator: <~*Punctuator ','>
        allowTrailingSeparator: false
      })`;
      yield i`eat(<~*Punctuator ']' balancer> 'closeToken')`;
    }

    @CoveredBy('Expression')
    @Node
    *Object() {
      yield i`eat(<~*Punctuator '{' balanced='}'> 'openToken')`;
      yield i`eat(<List> 'properties[]' {
        element: <Property>
        separator: <~*Punctuator ','>
        allowTrailingSeparator: false
      })`;
      yield i`eat(<~*Punctuator '}' balancer> 'closeToken')`;
    }

    @Node
    *Property() {
      yield i`eat(<String> 'key')`;
      yield i`eat(<~*Punctuator ':'> 'sigilToken')`;
      yield i`eat(<Expression> 'value')`;
    }

    @CoveredBy('Language')
    @Node
    *String() {
      yield i`eat(<~*Punctuator '"' balanced='"' balancedSpan='String'> 'openToken')`;
      yield i`eat(<*StringContent> 'content')`;
      yield i`eat(<~*Punctuator '"' balancer> 'closeToken')`;
    }

    @AllowEmpty
    @Node
    *StringContent() {
      let esc, lit;
      do {
        esc = (yield i`match('\\')`) && (yield i`eat(<@EscapeSequence>)`);
        lit = yield i`eatMatch(/[^\r\n\\"]+/)`;
      } while (esc || lit);
    }

    @Attributes(['cooked'])
    @Node
    *EscapeSequence({ state: { span }, ctx }) {
      if (!span.startsWith('String')) {
        yield i`fail()`;
      }

      yield i`eat(<~*Punctuator '\\' openSpan='Escape'> 'sigilToken')`;

      let match, cooked;

      if ((match = yield i`match(/[\\/bfnrt"]/)`)) {
        const match_ = ctx.sourceTextFor(match);
        yield i`eat(<~*Keyword ${buildString(match_)} closeSpan='Escape'> 'value')`;
        cooked = escapables.get(match_) || match_;
      } else if (yield i`match('u')`) {
        const codeNode = yield i`eat(<EscapeCode closeSpan='Escape'> 'value')`;
        cooked = parseInt(
          codeNode.properties.digits.map((digit) => ctx.sourceTextFor(digit)).join(''),
          16,
        );
      } else {
        yield i`fail()`;
      }

      yield i`bindAttribute(cooked ${buildString(cooked.toString(10))})`;
    }

    @Node
    *EscapeCode() {
      yield i`eat(<~*Keyword 'u'> 'typeToken')`;
      yield i`eat(<Digits> 'digits[]')`;
    }

    @CoveredBy('Expression')
    @Node
    *Number() {
      yield i`eat(<Integer> 'wholePart' { noDoubleZero: true matchSign: '-' })`;

      let fs = yield i`eatMatch(<~*Punctuator '.'> 'fractionalSeparatorToken')`;

      if (fs) {
        yield i`eat(<Integer> 'fractionalPart')`;
      } else {
        yield i`eat(null 'fractionalPart')`;
      }

      let es = yield i`eatMatch(<~*Punctuator /[eE]/> 'exponentSeparatorToken')`;

      if (es) {
        yield i`eat(<Integer> 'exponentPart' { matchSign: /[+-]/ })`;
      } else {
        yield i`eat(null 'exponentPart')`;
      }
    }

    @Node
    *Integer({ value: props, ctx }) {
      const { matchSign = null, noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      if (matchSign) {
        yield i`eatMatch(<~*Punctuator ${matchSign}> 'signToken')`;
      } else {
        yield i`eat(null 'signToken')`;
      }

      yield i`eat(<*UnsignedInteger noDoubleZero=${buildBoolean(noDoubleZero)}> 'value')`;
    }

    @Node
    *UnsignedInteger({ value: props, ctx }) {
      const { noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      let [firstDigit] = ctx.allTerminalsFor(yield i`eat(/\d/)`);

      if (!noDoubleZero || firstDigit.value !== '0') {
        yield i`eatMatch(/\d+/)`;
      }
    }

    @CoveredBy('Expression')
    @Node
    *Boolean() {
      yield i`eat(<~*Keyword /true|false/> 'sigilToken')`;
    }

    @CoveredBy('Expression')
    @Node
    *Null() {
      yield i`eat(<~*Keyword 'null'> 'sigilToken')`;
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
