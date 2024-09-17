import { buildTag, Context, AgastContext } from 'bablr';
import { dedent } from '@qnighy/dedent';
import * as language from '@bablr/language-en-json';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { buildFullyQualifiedSpamMatcher } from '@bablr/agast-vm-helpers';

let enhancers = {};

// enhancers = debugEnhancers;

const ctx = Context.from(AgastContext.create(), language, enhancers.bablrProduction);

const buildJSONTag = (type) => {
  const matcher = buildFullyQualifiedSpamMatcher({}, language.canonicalURL, type);
  return buildTag(ctx, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree, { ctx });
};

describe('@bablr/language-en-json', () => {
  describe('Expression', () => {
    const json = buildJSONTag('Expression');

    it('`"hello"`', () => {
      expect(print(json`"hello"`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <String>
            openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
            content:
            <*StringContent>
              'hello'
            </>
            closeToken: <~*Punctuator '"' balancer />
          </>
        </>\n`);
    });

    it('`""`', () => {
      expect(print(json`""`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <String>
            openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
            content: <*StringContent />
            closeToken: <~*Punctuator '"' balancer />
          </>
        </>\n`);
    });

    it('`" "`', () => {
      expect(print(json`" "`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <String>
            openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
            content:
            <*StringContent>
              ' '
            </>
            closeToken: <~*Punctuator '"' balancer />
          </>
        </>\n`);
    });

    it('` " " `', () => {
      expect(print(json` " " `)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          <#*Space:Space>
            ' '
          </>
          root:
          <String>
            openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
            content:
            <*StringContent>
              ' '
            </>
            closeToken: <~*Punctuator '"' balancer />
            <#*Space:Space>
              ' '
            </>
          </>
        </>\n`);
    });

    it('`"\\n"`', () => {
      expect(print(json`"\n"`)).toEqual(dedent(
        String.raw,
      )`<!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <String>
            openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
            content:
            <*StringContent>
              <@EscapeSequence cooked='\n'>
                sigilToken: <~*Punctuator '\\' openSpan='Escape' />
                value: <~*Keyword 'n' closeSpan='Escape' />
              </>
            </>
            closeToken: <~*Punctuator '"' balancer />
          </>
        </>${'\n'}`);
    });

    it('`"\\""`', () => {
      expect(print(json`"\""`)).toEqual(dedent(
        String.raw,
      )`<!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <String>
            openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
            content:
            <*StringContent>
              <@EscapeSequence cooked='"'>
                sigilToken: <~*Punctuator '\\' openSpan='Escape' />
                value: <~*Keyword '"' closeSpan='Escape' />
              </>
            </>
            closeToken: <~*Punctuator '"' balancer />
          </>
        </>${'\n'}`);
    });

    it('`true`', () => {
      expect(print(json`true`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Boolean>
            sigilToken: <~*Keyword 'true' />
          </>
        </>\n`);
    });

    it('`1`', () => {
      expect(print(json`1`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Number span='Number'>
            wholePart:
            <Integer>
              signToken: null
              value:
              <*UnsignedInteger noDoubleZero>
                '1'
              </>
            </>
            fractionalSeparatorToken: null
            fractionalPart: null
            exponentSeparatorToken: null
            exponentPart: null
          </>
        </>\n`);
    });

    it('`null`', () => {
      expect(print(json`null`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Null>
            sigilToken: <~*Keyword 'null' />
          </>
        </>\n`);
    });

    it('`[]`', () => {
      expect(print(json`[]`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Array>
            openToken: <~*Punctuator '[' balanced=']' />
            separators[]: []
            elements[]: []
            closeToken: <~*Punctuator ']' balancer />
          </>
        </>\n`);
    });

    it('`[null]`', () => {
      expect(print(json`[null]`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Array>
            openToken: <~*Punctuator '[' balanced=']' />
            separators[]: []
            elements[]: []
            elements[]:
            <Null>
              sigilToken: <~*Keyword 'null' />
            </>
            closeToken: <~*Punctuator ']' balancer />
          </>
        </>\n`);
    });

    it('`21`', () => {
      expect(print(json`21`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Number span='Number'>
            wholePart:
            <Integer>
              signToken: null
              value:
              <*UnsignedInteger noDoubleZero>
                '2'
                '1'
              </>
            </>
            fractionalSeparatorToken: null
            fractionalPart: null
            exponentSeparatorToken: null
            exponentPart: null
          </>
        </>\n`);
    });

    it('`[true, false]`', () => {
      expect(print(json`[true, false]`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Array>
            openToken: <~*Punctuator '[' balanced=']' />
            separators[]: []
            elements[]: []
            elements[]:
            <Boolean>
              sigilToken: <~*Keyword 'true' />
            </>
            separators[]: <~*Punctuator ',' />
            <#*Space:Space>
              ' '
            </>
            elements[]:
            <Boolean>
              sigilToken: <~*Keyword 'false' />
            </>
            closeToken: <~*Punctuator ']' balancer />
          </>
        </>\n`);
    });

    it('`{"foo":null}`', () => {
      expect(print(json`{"foo":null}`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Object>
            openToken: <~*Punctuator '{' balanced='}' />
            separators[]: []
            properties[]: []
            properties[]:
            <Property>
              key:
              <String>
                openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
                content:
                <*StringContent>
                  'foo'
                </>
                closeToken: <~*Punctuator '"' balancer />
              </>
              sigilToken: <~*Punctuator ':' />
              value:
              <Null>
                sigilToken: <~*Keyword 'null' />
              </>
            </>
            closeToken: <~*Punctuator '}' balancer />
          </>
        </>\n`);
    });

    it('`[[]]`', () => {
      expect(print(json`{"foo":null}`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Object>
            openToken: <~*Punctuator '{' balanced='}' />
            separators[]: []
            properties[]: []
            properties[]:
            <Property>
              key:
              <String>
                openToken: <~*Punctuator '"' balanced='"' balancedSpan='String' />
                content:
                <*StringContent>
                  'foo'
                </>
                closeToken: <~*Punctuator '"' balancer />
              </>
              sigilToken: <~*Punctuator ':' />
              value:
              <Null>
                sigilToken: <~*Keyword 'null' />
              </>
            </>
            closeToken: <~*Punctuator '}' balancer />
          </>
        </>\n`);
    });

    it('`{"key":[{}]}`', () => {
      expect(print(json`{"key":[{}]}`)).toEqual(dedent`\
        <!0:cstml bablr-language='https://github.com/bablr-lang/language-en-json'>
        <>
          root:
          <Object>
            openToken: <~*Punctuator '{' balanced='}' />
            separators[]: []
            properties[]: []
            properties[]:
            <Property>
              key:
              <String>
                openToken: <~*Punctuator '\"' balanced='\"' balancedSpan='String' />
                content:
                <*StringContent>
                  'key'
                </>
                closeToken: <~*Punctuator '\"' balancer />
              </>
              sigilToken: <~*Punctuator ':' />
              value:
              <Array>
                openToken: <~*Punctuator '[' balanced=']' />
                separators[]: []
                elements[]: []
                elements[]:
                <Object>
                  openToken: <~*Punctuator '{' balanced='}' />
                  separators[]: []
                  properties[]: []
                  closeToken: <~*Punctuator '}' balancer />
                </>
                closeToken: <~*Punctuator ']' balancer />
              </>
            </>
            closeToken: <~*Punctuator '}' balancer />
          </>
        </>
        `);
    });
  });
});
