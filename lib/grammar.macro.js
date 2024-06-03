import { i } from '@bablr/boot';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as productions from '@bablr/helpers/productions';
import { buildString } from '@bablr/agast-vm-helpers';
import { Node, CoveredBy, AllowEmpty, InjectFrom, Attributes } from '@bablr/helpers/decorators';
import * as Space from '@bablr/language-blank-space';

export const dependencies = { Space };

export const canonicalURL = 'https://github.com/bablr-lang/language-json';

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
      yield i`eat(<*Punctuator '[' balanced=']'> 'open')`;
      yield i`eat(<List> 'elements[]' {
        element: <Expression>
        separator: <*Punctuator ','>
        allowTrailingSeparator: false
      })`;
      yield i`eat(<*Punctuator ']' balancer> 'close')`;
    }

    @CoveredBy('Expression')
    @Node
    *Object() {
      yield i`eat(<*Punctuator '{' balanced='}'> 'open')`;
      yield i`eat(<List> 'properties[]' {
        element: <Property>
        separator: <*Punctuator ','>
        allowTrailingSeparator: false
      })`;
      yield i`eat(<*Punctuator '}' balancer> 'close')`;
    }

    @Node
    *Property() {
      yield i`eat(<String> 'key')`;
      yield i`eat(<*Punctuator ':'> 'mapOperator')`;
      yield i`eat(<Expression> 'value')`;
    }

    @CoveredBy('Language')
    @Node
    *String() {
      yield i`eat(<*Punctuator '"' balanced='"' balancedSpan='String'> 'open')`;
      yield i`eat(<*StringContent> 'content')`;
      yield i`eat(<*Punctuator '"' balancer> 'close')`;
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

      yield i`eat(<*Punctuator '\\'> 'escape')`;

      let match, cooked;

      if ((match = yield i`match(/[\\/bfnrt"]/)`)) {
        const match_ = ctx.sourceTextFor(match);
        yield i`eat(<*Keyword ${buildString(match_)}> 'value')`;
        cooked = escapables.get(match_) || match_;
      } else if (yield i`match('u')`) {
        const codeNode = yield i`eat(<EscapeCode> 'value')`;
        cooked = parseInt(
          ctx
            .getProperty(codeNode, 'digits')
            .map((digit) => ctx.sourceTextFor(digit))
            .join(''),
          16,
        );
      } else {
        yield i`fail()`;
      }

      yield i`bindAttribute(cooked ${buildString(cooked.toString(10))})`;
    }

    @Node
    *EscapeCode() {
      yield i`eat(<*Keyword 'u'> 'type')`;
      yield i`eat(<Digits> 'digits[]')`;
    }

    @CoveredBy('Expression')
    @Node
    *Number() {
      yield i`eat(<Integer> 'wholePart' { no00: true matchSign: '-' })`;

      let fs = yield i`eatMatch(<*Punctuator '.'> 'fractionalSeparator')`;

      if (fs) {
        yield i`eat(<Integer> 'fractionalPart')`;
      } else {
        yield i`eat(null 'fractionalPart')`;
      }

      let es = yield i`eatMatch(<*Punctuator /[eE]/> 'exponentSeparator')`;

      if (es) {
        yield i`eat(<Integer> 'exponentPart' { matchSign: /[+-]/ })`;
      } else {
        yield i`eat(null 'exponentPart')`;
      }
    }

    @Node
    *Integer({ value: props, ctx }) {
      const { matchSign = null, no00 = false } = (props && ctx.unbox(props)) || {};

      if (matchSign) {
        yield i`eatMatch(<*Punctuator ${matchSign}> 'sign')`;
      } else {
        yield i`eat(null 'sign')`;
      }

      let [firstDigit] = ctx.ownTerminalsFor(yield i`eat(<*Digit> 'digits[]')`);

      if (!no00 || firstDigit.value !== '0') {
        while (yield i`eatMatch(<*Digit> 'digits[]')`);
      }
    }

    @Node
    *Digit() {
      yield i`eat(/\d/)`;
    }

    @CoveredBy('Expression')
    @Node
    *Boolean() {
      yield i`eat(<*Keyword /true|false/> 'value')`;
    }

    @CoveredBy('Expression')
    @Node
    *Null() {
      yield i`eat(<*Keyword 'null'> 'value')`;
    }

    @Node
    @InjectFrom(productions)
    *Keyword() {}

    @Node
    @InjectFrom(productions)
    *Punctuator() {}

    @InjectFrom(productions)
    *List() {}

    @InjectFrom(productions)
    *Any() {}
  },
);