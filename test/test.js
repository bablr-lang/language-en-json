import { runTests } from '@bablr/test-runner';
import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
import * as language from '@bablr/language-json';

export const testCases = [
  {
    matcher: spam`<Expression>`,
    sourceText: '"hello"',
    parsed: dedent`\
      <>
        root:
        <String>
          open:
          <Punctuator balanced='"' balancedSpan='String'>
            '"'
          </>
          content:
          <StringContent>
            'hello'
          </>
          close:
          <Punctuator balancer>
            '"'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '""',
    parsed: dedent`\
      <>
        root:
        <String>
          open:
          <Punctuator balanced='"' balancedSpan='String'>
            '"'
          </>
          content:
          null
          close:
          <Punctuator balancer>
            '"'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '" "',
    parsed: dedent`\
      <>
        root:
        <String>
          open:
          <Punctuator balanced='"' balancedSpan='String'>
            '"'
          </>
          content:
          <StringContent>
            ' '
          </>
          close:
          <Punctuator balancer>
            '"'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: ' " " ',
    parsed: dedent`\
      <>
        #' '
        root:
        <String>
          open:
          <Punctuator balanced='"' balancedSpan='String'>
            '"'
          </>
          content:
          <StringContent>
            ' '
          </>
          close:
          <Punctuator balancer>
            '"'
          </>
          #' '
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '"\\n"',
    parsed: dedent`\
      <>
        root:
        <String>
          open:
          <Punctuator balanced='"' balancedSpan='String'>
            '"'
          </>
          content:
          <StringContent>
            !'${'\\\\n'}' :'${'\\n'}'
          </>
          close:
          <Punctuator balancer>
            '"'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: 'true',
    parsed: dedent`\
      <>
        root:
        <Boolean>
          value:
          <Keyword>
            'true'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '1',
    parsed: dedent`\
      <>
        root:
        <Number span='Number'>
          wholePart:
          <Integer>
            sign:
            null
            digits[]:
            <Digit>
              '1'
            </>
          </>
          fractionalSeparator:
          null
          fractionalPart:
          null
          exponentSeparator:
          null
          exponentPart:
          null
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: 'null',
    parsed: dedent`\
      <>
        root:
        <Null>
          value:
          <Keyword>
            'null'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '[]',
    parsed: dedent`\
      <>
        root:
        <Array>
          open:
          <Punctuator balanced=']'>
            '['
          </>
          elements[]:
          null
          separators[]:
          null
          close:
          <Punctuator balancer>
            ']'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '[null]',
    parsed: dedent`\
      <>
        root:
        <Array>
          open:
          <Punctuator balanced=']'>
            '['
          </>
          elements[]:
          <Null>
            value:
            <Keyword>
              'null'
            </>
          </>
          close:
          <Punctuator balancer>
            ']'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '21',
    parsed: dedent`\
      <>
        root:
        <Number span='Number'>
          wholePart:
          <Integer>
            sign:
            null
            digits[]:
            <Digit>
              '2'
            </>
            digits[]:
            <Digit>
              '1'
            </>
          </>
          fractionalSeparator:
          null
          fractionalPart:
          null
          exponentSeparator:
          null
          exponentPart:
          null
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '[true, false]',
    parsed: dedent`\
      <>
        root:
        <Array>
          open:
          <Punctuator balanced=']'>
            '['
          </>
          elements[]:
          <Boolean>
            value:
            <Keyword>
              'true'
            </>
          </>
          separators[]:
          <Punctuator>
            ','
          </>
          #' '
          elements[]:
          <Boolean>
            value:
            <Keyword>
              'false'
            </>
          </>
          close:
          <Punctuator balancer>
            ']'
          </>
        </>
      </>`,
  },
  {
    matcher: spam`<Expression>`,
    sourceText: '{"foo":null}',
    parsed: dedent`\
      <>
        root:
        <Object>
          open:
          <Punctuator balanced='}'>
            '{'
          </>
          properties[]:
          <Property>
            key:
            <String>
              open:
              <Punctuator balanced='"' balancedSpan='String'>
                '"'
              </>
              content:
              <StringContent>
                'foo'
              </>
              close:
              <Punctuator balancer>
                '"'
              </>
            </>
            mapOperator:
            <Punctuator>
              ':'
            </>
            value:
            <Null>
              value:
              <Keyword>
                'null'
              </>
            </>
          </>
          close:
          <Punctuator balancer>
            '}'
          </>
        </>
      </>`,
  },
];

runTests(language, testCases);
