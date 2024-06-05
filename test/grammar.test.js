import { buildTag } from 'bablr';
import { dedent } from '@qnighy/dedent';
import * as language from '@bablr/language-json';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/agast-helpers/tree';

let enhancers = undefined;

// enhancers = debugEnhancers;

const json = (...args) =>
  printPrettyCSTML(buildTag(language, 'Expression', undefined, enhancers)(...args));

describe('@bablr/language-json', () => {
  it('`"hello"`', () => {
    expect(json`"hello"`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <String>
          openToken: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            'hello'
          </>
          closeToken: <*Punctuator '"' balancer />
        </>
      </>\n`);
  });

  it('`""`', () => {
    expect(json`""`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <String>
          openToken: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
          </>
          closeToken: <*Punctuator '"' balancer />
        </>
      </>\n`);
  });

  it('`" "`', () => {
    expect(json`" "`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <String>
          openToken: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            ' '
          </>
          closeToken: <*Punctuator '"' balancer />
        </>
      </>\n`);
  });

  it('` " " `', () => {
    expect(json` " " `).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <#*Space:Space>
          ' '
        </>
        <String>
          openToken: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            ' '
          </>
          closeToken: <*Punctuator '"' balancer />
          <#*Space:Space>
            ' '
          </>
        </>
      </>\n`);
  });

  it('`"\\n"`', () => {
    expect(json`"\n"`).toEqual(dedent(
      String.raw,
    )`<!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <String>
          openToken: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            <@EscapeSequence cooked='\n'>
              sigilToken: <*Punctuator '\\' />
              value: <*Keyword 'n' />
            </>
          </>
          closeToken: <*Punctuator '"' balancer />
        </>
      </>${'\n'}`);
  });

  it('`true`', () => {
    expect(json`true`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Boolean>
          sigilToken: <*Keyword 'true' />
        </>
      </>\n`);
  });

  it('`1`', () => {
    expect(json`1`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Number span='Number'>
          wholePart:
          <Integer>
            signToken: null
            digits[]:
            <*Digit>
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
    expect(json`null`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Null>
          sigilToken: <*Keyword 'null' />
        </>
      </>\n`);
  });

  it('`[]`', () => {
    expect(json`[]`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Array>
          openToken: <*Punctuator '[' balanced=']' />
          elements[]: null
          separators[]: null
          closeToken: <*Punctuator ']' balancer />
        </>
      </>\n`);
  });

  it('`[null]`', () => {
    expect(json`[null]`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Array>
          openToken: <*Punctuator '[' balanced=']' />
          elements[]:
          <Null>
            sigilToken: <*Keyword 'null' />
          </>
          separators[]: null
          closeToken: <*Punctuator ']' balancer />
        </>
      </>\n`);
  });

  it('`21`', () => {
    expect(json`21`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Number span='Number'>
          wholePart:
          <Integer>
            signToken: null
            digits[]:
            <*Digit>
              '2'
            </>
            digits[]:
            <*Digit>
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
    expect(json`[true, false]`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Array>
          openToken: <*Punctuator '[' balanced=']' />
          elements[]:
          <Boolean>
            sigilToken: <*Keyword 'true' />
          </>
          separators[]: <*Punctuator ',' />
          <#*Space:Space>
            ' '
          </>
          elements[]:
          <Boolean>
            sigilToken: <*Keyword 'false' />
          </>
          closeToken: <*Punctuator ']' balancer />
        </>
      </>\n`);
  });

  it('`{"foo":null}`', () => {
    expect(json`{"foo":null}`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Object>
          openToken: <*Punctuator '{' balanced='}' />
          properties[]:
          <Property>
            key:
            <String>
              openToken: <*Punctuator '"' balanced='"' balancedSpan='String' />
              content:
              <*StringContent>
                'foo'
              </>
              closeToken: <*Punctuator '"' balancer />
            </>
            sigilToken: <*Punctuator ':' />
            value:
            <Null>
              sigilToken: <*Keyword 'null' />
            </>
          </>
          separators[]: null
          closeToken: <*Punctuator '}' balancer />
        </>
      </>\n`);
  });
});
