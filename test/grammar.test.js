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
          open: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            'hello'
          </>
          close: <*Punctuator '"' balancer />
        </>
      </>`);
  });

  it('`""`', () => {
    expect(json`""`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <String>
          open: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
          </>
          close: <*Punctuator '"' balancer />
        </>
      </>`);
  });

  it('`" "`', () => {
    expect(json`" "`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <String>
          open: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            ' '
          </>
          close: <*Punctuator '"' balancer />
        </>
      </>`);
  });

  it('` " " `', () => {
    expect(json` " " `).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <#*Space:Space>
          ' '
        </>
        <String>
          open: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            ' '
          </>
          close: <*Punctuator '"' balancer />
          <#*Space:Space>
            ' '
          </>
        </>
      </>`);
  });

  it('`"\\n"`', () => {
    expect(json`"\n"`).toEqual(dedent(
      String.raw,
    )`<!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <String>
          open: <*Punctuator '"' balanced='"' balancedSpan='String' />
          content:
          <*StringContent>
            <@EscapeSequence cooked='\n'>
              escape: <*Punctuator '\\' />
              value: <*Keyword 'n' />
            </>
          </>
          close: <*Punctuator '"' balancer />
        </>
      </>`);
  });

  it('`true`', () => {
    expect(json`true`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Boolean>
          value: <*Keyword 'true' />
        </>
      </>`);
  });

  it('`1`', () => {
    expect(json`1`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Number span='Number'>
          wholePart:
          <Integer>
            sign: null
            digits[]:
            <*Digit>
              '1'
            </>
          </>
          fractionalSeparator: null
          fractionalPart: null
          exponentSeparator: null
          exponentPart: null
        </>
      </>`);
  });

  it('`null`', () => {
    expect(json`null`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Null>
          value: <*Keyword 'null' />
        </>
      </>`);
  });

  it('`[]`', () => {
    expect(json`[]`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Array>
          open: <*Punctuator '[' balanced=']' />
          elements[]: null
          separators[]: null
          close: <*Punctuator ']' balancer />
        </>
      </>`);
  });

  it('`[null]`', () => {
    expect(json`[null]`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Array>
          open: <*Punctuator '[' balanced=']' />
          elements[]:
          <Null>
            value: <*Keyword 'null' />
          </>
          separators[]: null
          close: <*Punctuator ']' balancer />
        </>
      </>`);
  });

  it('`21`', () => {
    expect(json`21`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Number span='Number'>
          wholePart:
          <Integer>
            sign: null
            digits[]:
            <*Digit>
              '2'
            </>
            digits[]:
            <*Digit>
              '1'
            </>
          </>
          fractionalSeparator: null
          fractionalPart: null
          exponentSeparator: null
          exponentPart: null
        </>
      </>`);
  });

  it('`[true, false]`', () => {
    expect(json`[true, false]`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Array>
          open: <*Punctuator '[' balanced=']' />
          elements[]:
          <Boolean>
            value: <*Keyword 'true' />
          </>
          separators[]: <*Punctuator ',' />
          <#*Space:Space>
            ' '
          </>
          elements[]:
          <Boolean>
            value: <*Keyword 'false' />
          </>
          close: <*Punctuator ']' balancer />
        </>
      </>`);
  });

  it('`{"foo":null}`', () => {
    expect(json`{"foo":null}`).toEqual(dedent`\
      <!0:cstml bablr-language='https://github.com/bablr-lang/language-json'>
      <>
        <Object>
          open: <*Punctuator '{' balanced='}' />
          properties[]:
          <Property>
            key:
            <String>
              open: <*Punctuator '"' balanced='"' balancedSpan='String' />
              content:
              <*StringContent>
                'foo'
              </>
              close: <*Punctuator '"' balancer />
            </>
            mapOperator: <*Punctuator ':' />
            value:
            <Null>
              value: <*Keyword 'null' />
            </>
          </>
          separators[]: null
          close: <*Punctuator '}' balancer />
        </>
      </>`);
  });
});
