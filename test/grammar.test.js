import { buildTag } from 'bablr';
import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
import * as language from '@bablr/language-en-json';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';

let enhancers = {};
let { raw } = String;

// enhancers = debugEnhancers;

const buildJSONTag = (matcher) => {
  return buildTag(language, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree);
};

describe('@bablr/language-en-json', () => {
  describe('Expression', () => {
    const json = buildJSONTag(spam`<$_Expression />`);

    it('`"hello"`', () => {
      expect(print(json`"hello"`)).toEqual(dedent`\
        <$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$: <*StringContent 'hello' />
          closeToken: <* '"' { balancer: true } />
        </>\n`);
    });

    it('`""`', () => {
      expect(print(json`""`)).toEqual(dedent`\
        <$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$: <*StringContent />
          closeToken: <* '"' { balancer: true } />
        </>\n`);
    });

    it('`" "`', () => {
      expect(print(json`" "`)).toEqual(dedent`\
        <$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$: <*StringContent ' ' />
          closeToken: <* '"' { balancer: true } />
        </>\n`);
    });

    it('` " " `', () => {
      expect(print(json` " " `)).toEqual(dedent`\
        <$_>
          #: :Space: <*Space ' ' />
          .:
          <$String>
            openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
            content$: <*StringContent ' ' />
            closeToken: <* '"' { balancer: true } />
          </>
          #: :Space: <*Space ' ' />
        </>\n`);
    });

    it('`"\\n"`', () => {
      expect(print(json`"\n"`)).toEqual(dedent(String.raw)`<$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$:
          <*StringContent>
            @:
            <EscapeSequence { cooked: '\n' }>
              sigilToken: <* '\\' { openSpan: 'Escape' } />
              code: <*Keyword 'n' { closeSpan: 'Escape' } />
            </>
          </>
          closeToken: <* '"' { balancer: true } />
        </>${'\n'}`);
    });

    it('`"\\""`', () => {
      expect(print(json`"\""`)).toEqual(dedent(String.raw)`<$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$:
          <*StringContent>
            @:
            <EscapeSequence { cooked: '"' }>
              sigilToken: <* '\\' { openSpan: 'Escape' } />
              code: <*Keyword '"' { closeSpan: 'Escape' } />
            </>
          </>
          closeToken: <* '"' { balancer: true } />
        </>${'\n'}`);
    });

    it(`\`${raw`"\""`}\``, () => {
      expect(print(json`"\""`)).toEqual(dedent`\
        <$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$:
          <*StringContent>
            @:
            <EscapeSequence { cooked: '"' }>
              sigilToken: <* '${'\\\\'}' { openSpan: 'Escape' } />
              code: <*Keyword '"' { closeSpan: 'Escape' } />
            </>
          </>
          closeToken: <* '"' { balancer: true } />
        </>\n`);
    });

    it(`\`${raw`"\u1234"`}\``, () => {
      expect(print(json`"\u123f"`)).toEqual(dedent`\
        <$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$:
          <*StringContent>
            @:
            <EscapeSequence { cooked: 'ሿ' }>
              sigilToken: <* '${'\\\\'}' { openSpan: 'Escape' } />
              code:
              <EscapeCode { closeSpan: 'Escape' }>
                typeToken: <*Keyword 'u' />
                openToken: null
                value: <*UnsignedHexInteger '123f' />
                closeToken: null
              </>
            </>
          </>
          closeToken: <* '"' { balancer: true } />
        </>\n`);
    });

    it(`\`${raw`"\u{1}"`}\``, () => {
      expect(print(json`"\u{1}"`)).toEqual(dedent`\
        <$String>
          openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
          content$:
          <*StringContent>
            @:
            <EscapeSequence { cooked: '${'\\'}u0001' }>
              sigilToken: <* '${'\\\\'}' { openSpan: 'Escape' } />
              code:
              <EscapeCode { closeSpan: 'Escape' }>
                typeToken: <*Keyword 'u' />
                openToken: <* '{' { balanced: '}' } />
                value: <*UnsignedHexInteger '1' />
                closeToken: <* '}' { balancer: true } />
              </>
            </>
          </>
          closeToken: <* '"' { balancer: true } />
        </>\n`);
    });

    it('`true`', () => {
      expect(print(json`true`)).toEqual(dedent`\
        <$Boolean>
          sigilToken: <*Keyword 'true' />
        </>\n`);
    });

    it('`1`', () => {
      expect(print(json`1`)).toEqual(dedent`\
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
        </>\n`);
    });

    it('`null`', () => {
      expect(print(json`null`)).toEqual(dedent`\
        <$Null>
          sigilToken: <*Keyword 'null' />
        </>\n`);
    });

    it('`[]`', () => {
      expect(print(json`[]`)).toEqual(dedent`\
        <$Array>
          openToken: <* '[' { balanced: ']' } />
          closeToken: <* ']' { balancer: true } />
        </>\n`);
    });

    it('`[null]`', () => {
      expect(print(json`[null]`)).toEqual(dedent`\
        <$Array>
          openToken: <* '[' { balanced: ']' } />
          elements[]+$:
          <$Null>
            sigilToken: <*Keyword 'null' />
          </>
          closeToken: <* ']' { balancer: true } />
        </>\n`);
    });

    it('`21`', () => {
      expect(print(json`21`)).toEqual(dedent`\
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
        </>\n`);
    });

    it('`[true, false]`', () => {
      expect(print(json`[true, false]`)).toEqual(dedent`\
        <$Array>
          openToken: <* '[' { balanced: ']' } />
          elements[]+$:
          <$Boolean>
            sigilToken: <*Keyword 'true' />
          </>
          #separatorTokens[]: <* ',' />
          #: :Space: <*Space ' ' />
          elements[]+$:
          <$Boolean>
            sigilToken: <*Keyword 'false' />
          </>
          closeToken: <* ']' { balancer: true } />
        </>\n`);
    });

    it('`{"foo":null}`', () => {
      expect(print(json`{"foo":null}`)).toEqual(dedent`\
        <$Object>
          openToken: <* '{' { balanced: '}' } />
          properties[]$:
          <$Property>
            key$:
            <$String>
              openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
              content$: <*StringContent 'foo' />
              closeToken: <* '"' { balancer: true } />
            </>
            sigilToken: <* ':' />
            value+$:
            <$Null>
              sigilToken: <*Keyword 'null' />
            </>
          </>
          closeToken: <* '}' { balancer: true } />
        </>\n`);
    });

    it('`[[]]`', () => {
      expect(print(json`[[]]`)).toEqual(dedent`\
        <$Array>
          openToken: <* '[' { balanced: ']' } />
          elements[]+$:
          <$Array>
            openToken: <* '[' { balanced: ']' } />
            closeToken: <* ']' { balancer: true } />
          </>
          closeToken: <* ']' { balancer: true } />
        </>\n`);
    });

    it('`{"key":[{}]}`', () => {
      expect(print(json`{"key":[{}]}`)).toEqual(dedent`\
        <$Object>
          openToken: <* '{' { balanced: '}' } />
          properties[]$:
          <$Property>
            key$:
            <$String>
              openToken: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
              content$: <*StringContent 'key' />
              closeToken: <* '"' { balancer: true } />
            </>
            sigilToken: <* ':' />
            value+$:
            <$Array>
              openToken: <* '[' { balanced: ']' } />
              elements[]+$:
              <$Object>
                openToken: <* '{' { balanced: '}' } />
                closeToken: <* '}' { balancer: true } />
              </>
              closeToken: <* ']' { balancer: true } />
            </>
          </>
          closeToken: <* '}' { balancer: true } />
        </>\n`);
    });
  });
});
