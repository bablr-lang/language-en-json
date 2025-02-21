import { buildTag, Context } from 'bablr';
import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
import * as language from '@bablr/language-en-json';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { buildIdentifier, buildString } from '@bablr/helpers/builders';

let enhancers = {};
let { raw } = String;

// enhancers = debugEnhancers;

const ctx = Context.from(language, enhancers.bablrProduction);

const buildJSONTag = (type) => {
  const matcher = spam`<$${buildString(language.canonicalURL)}:${buildIdentifier(type)} />`;
  return buildTag(ctx, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree, { ctx });
};

describe('@bablr/language-en-cstml-json', () => {
  describe('Expression', () => {
    const json = buildJSONTag('Expression');

    it('`"hello"`', () => {
      expect(print(json`"hello"`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$: <*StringContent 'hello' />
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>\n`);
    });

    it('`""`', () => {
      expect(print(json`""`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$: <*StringContent />
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>\n`);
    });

    it('`" "`', () => {
      expect(print(json`" "`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$: <*StringContent ' ' />
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>\n`);
    });

    it('` " " `', () => {
      expect(print(json` " " `)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          #: <*Space:Space ' ' />
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$: <*StringContent ' ' />
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
          #: <*Space:Space ' ' />
        </>\n`);
    });

    it('`"\\n"`', () => {
      expect(print(json`"\n"`)).toEqual(dedent(
        String.raw,
      )`<!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '\n' }>
                sigilToken: <*Punctuator '\\' { openSpan: 'Escape' } />
                code: <*Keyword 'n' { closeSpan: 'Escape' } />
              </>
            </>
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>${'\n'}`);
    });

    it('`"\\""`', () => {
      expect(print(json`"\""`)).toEqual(dedent(
        String.raw,
      )`<!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '"' }>
                sigilToken: <*Punctuator '\\' { openSpan: 'Escape' } />
                code: <*Keyword '"' { closeSpan: 'Escape' } />
              </>
            </>
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>${'\n'}`);
    });

    it(`\`'"'\``, () => {
      expect(print(json`'"'`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator "'" { balanced: "'", balancedSpan: 'String:Single' } />
            content$: <*StringContent '"' />
            closeToken: <*Punctuator "'" { balancer: true } />
          </>
        </>\n`);
    });

    it(`\`${raw`"\""`}\``, () => {
      expect(print(json`"\""`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '"' }>
                sigilToken: <*Punctuator '${'\\\\'}' { openSpan: 'Escape' } />
                code: <*Keyword '"' { closeSpan: 'Escape' } />
              </>
            </>
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>\n`);
    });

    it(`\`${raw`"\u1234"`}\``, () => {
      expect(print(json`"\u1234"`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '4660' }>
                sigilToken: <*Punctuator '${'\\\\'}' { openSpan: 'Escape' } />
                code:
                <$EscapeCode { closeSpan: 'Escape' }>
                  typeToken: <*Keyword 'u' />
                  openToken: null
                  value$: <*UnsignedInteger '1234' />
                  closeToken: null
                </>
              </>
            </>
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>\n`);
    });

    it(`\`${raw`"\u{1}"`}\``, () => {
      expect(print(json`"\u{1}"`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$String>
            openToken: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '1' }>
                sigilToken: <*Punctuator '${'\\\\'}' { openSpan: 'Escape' } />
                code:
                <$EscapeCode { closeSpan: 'Escape' }>
                  typeToken: <*Keyword 'u' />
                  openToken: <*Punctuator '{' { balanced: '}' } />
                  value$: <*UnsignedInteger '1' />
                  closeToken: <*Punctuator '}' { balancer: true } />
                </>
              </>
            </>
            closeToken: <*Punctuator '"' { balancer: true } />
          </>
        </>\n`);
    });

    it('`true`', () => {
      expect(print(json`true`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Boolean>
            sigilToken: <*Keyword 'true' />
          </>
        </>\n`);
    });

    it('`1`', () => {
      expect(print(json`1`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Number { span: 'Number' }>
            wholePart$:
            <$Integer>
              signToken: null
              value$: <*UnsignedInteger '1' />
            </>
            fractionalSeparatorToken: null
            fractionalPart$: null
            exponentSeparatorToken: null
            exponentPart$: null
          </>
        </>\n`);
    });

    it('`null`', () => {
      expect(print(json`null`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Null>
            sigilToken: <*Keyword 'null' />
          </>
        </>\n`);
    });

    it('`[]`', () => {
      expect(print(json`[]`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Array>
            openToken: <*Punctuator '[' { balanced: ']' } />
            separatorTokens[]: []
            elements[]$: []
            closeToken: <*Punctuator ']' { balancer: true } />
          </>
        </>\n`);
    });

    it('`[null]`', () => {
      expect(print(json`[null]`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Array>
            openToken: <*Punctuator '[' { balanced: ']' } />
            separatorTokens[]: []
            elements[]$: []
            elements[]$:
            <$Null>
              sigilToken: <*Keyword 'null' />
            </>
            closeToken: <*Punctuator ']' { balancer: true } />
          </>
        </>\n`);
    });

    it('`21`', () => {
      expect(print(json`21`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Number { span: 'Number' }>
            wholePart$:
            <$Integer>
              signToken: null
              value$: <*UnsignedInteger '21' />
            </>
            fractionalSeparatorToken: null
            fractionalPart$: null
            exponentSeparatorToken: null
            exponentPart$: null
          </>
        </>\n`);
    });

    it('`[true, false]`', () => {
      expect(print(json`[true, false]`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Array>
            openToken: <*Punctuator '[' { balanced: ']' } />
            separatorTokens[]: []
            elements[]$: []
            elements[]$:
            <$Boolean>
              sigilToken: <*Keyword 'true' />
            </>
            separatorTokens[]: <*Punctuator ',' />
            #: <*Space:Space ' ' />
            elements[]$:
            <$Boolean>
              sigilToken: <*Keyword 'false' />
            </>
            closeToken: <*Punctuator ']' { balancer: true } />
          </>
        </>\n`);
    });

    it('`{foo:null}`', () => {
      expect(print(json`{foo:null}`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Object>
            openToken: <*Punctuator '{' { balanced: '}' } />
            separatorTokens[]: []
            properties[]$: []
            properties[]$:
            <$Property>
              key$: <*Identifier 'foo' />
              sigilToken: <*Punctuator ':' />
              value$:
              <$Null>
                sigilToken: <*Keyword 'null' />
              </>
            </>
            closeToken: <*Punctuator '}' { balancer: true } />
          </>
        </>\n`);
    });

    it('`[[]]`', () => {
      expect(print(json`[[]]`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Array>
            openToken: <*Punctuator '[' { balanced: ']' } />
            separatorTokens[]: []
            elements[]$: []
            elements[]$:
            <$Array>
              openToken: <*Punctuator '[' { balanced: ']' } />
              separatorTokens[]: []
              elements[]$: []
              closeToken: <*Punctuator ']' { balancer: true } />
            </>
            closeToken: <*Punctuator ']' { balancer: true } />
          </>
        </>\n`);
    });

    it('`{key:[{}]}`', () => {
      expect(print(json`{key:[{}]}`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/core/en/json' }>
        <$>
          .:
          <$Object>
            openToken: <*Punctuator '{' { balanced: '}' } />
            separatorTokens[]: []
            properties[]$: []
            properties[]$:
            <$Property>
              key$: <*Identifier 'key' />
              sigilToken: <*Punctuator ':' />
              value$:
              <$Array>
                openToken: <*Punctuator '[' { balanced: ']' } />
                separatorTokens[]: []
                elements[]$: []
                elements[]$:
                <$Object>
                  openToken: <*Punctuator '{' { balanced: '}' } />
                  separatorTokens[]: []
                  properties[]$: []
                  closeToken: <*Punctuator '}' { balancer: true } />
                </>
                closeToken: <*Punctuator ']' { balancer: true } />
              </>
            </>
            closeToken: <*Punctuator '}' { balancer: true } />
          </>
        </>
        `);
    });
  });
});
