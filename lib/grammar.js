import { i } from '@bablr/boot';
import { buildCovers } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';

const node = Symbol.for('@bablr/node');

export const dependencies = {};

export const name = 'JSON';

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    eatMatchTrivia: i`eatMatch#(/\s+/)`,
  },
  class JSONGrammar {
    constructor() {
      this.covers = buildCovers({
        [node]: [
          'Expression',
          'Property',
          'StringContent',
          'Punctuator',
          'Keyword',
          'Digit',
          'Integer',
        ],
        Expression: ['Array', 'Object', 'String', 'Boolean', 'Number', 'Null'],
      });
    }

    *Match(cases, s, ctx) {
      for (const case_ of ctx.unbox(cases)) {
        const { 0: matcher, 1: guard } = ctx.unbox(case_);
        if (yield i`match(${guard})`) {
          yield i`eat(${matcher})`;
          break;
        }
      }
    }

    // @CoveredBy('Element')
    *Expression() {
      yield i`eat(<Match> null [
        (<Array> '[')
        (<Object> '{')
        (<String> '"')
        (<Number span='Number'> /-?\d/)
        (<Null> 'null')
        (<Boolean> /true|false/)
      ])`;
    }

    // @CoveredBy('Expression')
    // @Node
    *Array() {
      yield i`eat(<| Punctuator '[' balanced=']' |> 'open')`;
      let first = true;
      while ((first || (yield i`match(',')`)) && !(yield i`match(']')`)) {
        if (!first) {
          yield i`eat(<| Punctuator ',' |> 'separators[]')`;
        }
        yield i`eat(<Expression> 'elements[]')`;
        first = false;
      }
      if (first) {
        yield i`eat(null 'elements[]')`;
        yield i`eat(null 'separators[]')`;
      }
      yield i`eat(<| Punctuator ']' balancer |> 'close')`;
    }

    // @CoveredBy('Expression')
    // @Node
    *Object() {
      yield i`eat(<| Punctuator '{' balanced='}' |> 'open')`;
      let first = true;
      while ((first || (yield i`match(',')`)) && !(yield i`match('}')`)) {
        if (!first) {
          yield i`eat(<| Punctuator ',' |> 'separators[]')`;
        }
        yield i`eat(<Property> 'properties[]')`;
        first = false;
      }
      if (first) {
        yield i`eat(null 'properties[]')`;
        yield i`eat(null 'separators[]')`;
      }
      yield i`eat(<| Punctuator '}' balancer |> 'close')`;
    }

    // @Node
    *Property() {
      yield i`eat(<String> 'key')`;
      yield i`eat(<| Punctuator ':' |> 'mapOperator')`;
      yield i`eat(<Expression> 'value')`;
    }

    // @CoveredBy('Expression')
    // @Node
    *String() {
      yield i`eat(<| Punctuator '"' balanced='"' lexicalSpan='String' |> 'open')`;
      yield i`eatMatch(<| StringContent |> 'content')`;
      yield i`eat(<| Punctuator '"' balancer |> 'close')`;
    }

    // @Node
    *StringContent() {
      let esc, lit;
      do {
        esc = yield i`eatMatch!(/\\(u(\{\d{1,6}\}|\d{4})|x[0-9a-fA-F]{2}|[\\nrt0"])/)`;
        lit = yield i`eatMatch(/[^\r\n\0\\"]+/)`;
      } while (esc || lit);
    }

    // @CoveredBy('Expression')
    // @Node
    *Number() {
      yield i`eat(<Integer> 'wholePart' { no00: true matchSign: '-' })`;

      let fs = yield i`eatMatch(<| Punctuator '.' |> 'fractionalSeparator')`;

      if (fs) {
        yield i`eat(<Integer> 'fractionalPart')`;
      } else {
        yield i`eat(null 'fractionalPart')`;
      }

      let es = yield i`eatMatch(<| Punctuator /[eE]/ |> 'exponentSeparator')`;

      if (es) {
        yield i`eat(<Integer> 'exponentPart' { matchSign: /[+-]/ })`;
      } else {
        yield i`eat(null 'exponentPart')`;
      }
    }

    // @Node
    *Integer(props, s, ctx) {
      const { matchSign = null, no00 = false } = (props && ctx.unbox(props)) || {};

      if (matchSign) {
        yield i`eatMatch(<| Punctuator ${matchSign} |> 'sign')`;
      } else {
        yield i`eatMatch(null 'sign')`;
      }

      let [firstDigit] = ctx.ownTerminalsFor(yield i`eat(<| Digit |> 'digits[]')`);

      if (!no00 || firstDigit.value !== '0') {
        while (yield i`eatMatch(<| Digit |> 'digits[]')`);
      }
    }

    // @Node
    *Digit() {
      yield i`eat(/\d/)`;
    }

    // @CoveredBy('Expression')
    // @Node
    *Boolean() {
      yield i`eat(<| Keyword /true|false/ |> 'value')`;
    }

    // @CoveredBy('Expression')
    // @Node
    *Null() {
      yield i`eat(<| Keyword 'null' |> 'value')`;
    }

    // @Node
    *Keyword(obj, s, ctx) {
      const { value, attrs } = ctx.unbox(obj);
      yield i`eat(${value})`;

      return { attrs };
    }

    // @Node
    *Punctuator(obj, s, ctx) {
      const { value, attrs } = ctx.unbox(obj);
      yield i`eat(${value})`;

      return { attrs };
    }
  },
);

const escapables = new Map(
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

export const cookEscape = (escape) => {
  if (!escape.startsWith('\\')) {
    throw new Error('string escape must start with \\');
  }

  const hexMatch = /\\u([0-9a-f]{4})/iy.exec(escape);

  if (hexMatch) {
    return String.fromCodePoint(parseInt(hexMatch[1], 16));
  }

  const litPattern = /\\([\\/bfnrt"])/y;
  const litMatch = litPattern.exec(escape);

  if (litMatch) {
    return escapables.get(litMatch[1]);
  }

  throw new Error('unable to cook string escape');
};
