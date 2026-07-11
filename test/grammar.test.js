import { buildTag } from 'bablr';
import { dedent } from '@qnighy/dedent';
import language from '@bablr/language-en-json';
import { expect } from 'expect';
import { printCSTML } from '@bablr/helpers/tree';
import { m } from '@bablr/helpers/grammar';

let enhancers = {};
let { raw } = String;

const buildJSONTag = (matcher) => {
  return buildTag(language, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printCSTML(tree);
};

describe('@bablr/language-en-json', () => {
  describe('Expression', () => {
    const json = buildJSONTag(m`<$_Expression />`);

    it('`"hello"`', () => {
      expect(print(json`"hello"`)).toEqual(dedent`
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent 'hello' />
            closeToken*: <* '"' />
          </>
        </>
      `);
    });

    it('`""`', () => {
      expect(print(json`""`)).toEqual(dedent`
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent />
            closeToken*: <* '"' />
          </>
        </>
      `);
    });

    it('`" "`', () => {
      expect(print(json`" "`)).toEqual(dedent`
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent ' ' />
            closeToken*: <* '"' />
          </>
        </>
      `);
    });

    it('` " " `', () => {
      expect(print(json` " " `)).toEqual(dedent`
        <$_>
          #: :Space: <*Space ' ' />
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent ' ' />
            closeToken*: <* '"' />
          </>
          #: :Space: <*Space ' ' />
        </>
      `);
    });

    it('`"\\n"`', () => {
      expect(print(json`"\n"`)).toEqual(dedent`
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent @'\\n' @@'\\\\n' />
            closeToken*: <* '"' />
          </>
        </>
      `);
    });

    it(`\`${raw`"\""`}\``, () => {
      expect(print(json`"\""`)).toEqual(dedent`
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent @'"' @@'\\\\"' />
            closeToken*: <* '"' />
          </>
        </>
      `);
    });

    it(`\`${raw`"\u1234"`}\``, () => {
      expect(print(json`"\u1234"`)).toEqual(dedent`
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent @'ሴ' @@'\\\\u1234' />
            closeToken*: <* '"' />
          </>
        </>
      `);
    });

    it(`\`${raw`"\u{1}"`}\``, () => {
      expect(print(json`"\u{1}"`)).toEqual(dedent`
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent @'\\u0001' @@'\\\\u{1}' />
            closeToken*: <* '"' />
          </>
        </>
      `);
    });

    it('`true`', () => {
      expect(print(json`true`)).toEqual(dedent`
        <$_>
          _:
          <$Boolean>
            sigilToken*: <*Keyword 'true' />
          </>
        </>
      `);
    });

    it('`1`', () => {
      expect(print(json`1`)).toEqual(dedent`
        <$_>
          _:
          <$Number>
            sign*: null 
            wholePart$: <*UnsignedInteger '1' />
            decimalSeparatorToken*: null 
            exponentSeparatorToken*: null 
          </>
        </>
      `);
    });

    it('`null`', () => {
      expect(print(json`null`)).toEqual(dedent`
        <$_>
          _:
          <$Null>
            sigilToken*: <*Keyword 'null' />
          </>
        </>
      `);
    });

    it('`[]`', () => {
      expect(print(json`[]`)).toEqual(dedent`
        <$_>
          _:
          <$Array>
            openToken*: <* '[' />
            closeToken*: <* ']' />
          </>
        </>
      `);
    });

    it('`[null]`', () => {
      expect(print(json`[null]`)).toEqual(dedent`
        <$_>
          _:
          <$Array>
            openToken*: <* '[' />
            elements[]$:
            <$Null>
              sigilToken*: <*Keyword 'null' />
            </>
            closeToken*: <* ']' />
          </>
        </>
      `);
    });

    it('`2e1`', () => {
      expect(print(json`2e1`)).toEqual(dedent`
        <$_>
          _:
          <$Number>
            sign*: null 
            wholePart$: <*UnsignedInteger '2' />
            decimalSeparatorToken*: null 
            exponentSeparatorToken*: <* 'e' />
            exponentPart$: <*UnsignedInteger '1' />
          </>
        </>
      `);
    });

    it('`[true, false]`', () => {
      expect(print(json`[true, false]`)).toEqual(dedent`
        <$_>
          _:
          <$Array>
            openToken*: <* '[' />
            elements[]$:
            <$Boolean>
              sigilToken*: <*Keyword 'true' />
            </>
            #separatorTokens: <* ',' />
            #: :Space: <*Space ' ' />
            elements[]$:
            <$Boolean>
              sigilToken*: <*Keyword 'false' />
            </>
            closeToken*: <* ']' />
          </>
        </>
      `);
    });

    it('`{"foo":null}`', () => {
      expect(print(json`{"foo":null}`)).toEqual(dedent`
        <$_>
          _:
          <$Object>
            openToken*: <* '{' />
            properties[]$:
            <$Property>
              key$:
              <$String>
                openToken*: <* '"' />
                content$: <*StringContent 'foo' />
                closeToken*: <* '"' />
              </>
              sigilToken*: <* ':' />
              value$:
              <$Null>
                sigilToken*: <*Keyword 'null' />
              </>
            </>
            closeToken*: <* '}' />
          </>
        </>
      `);
    });

    it('`[[]]`', () => {
      expect(print(json`[[]]`)).toEqual(dedent`
        <$_>
          _:
          <$Array>
            openToken*: <* '[' />
            elements[]$:
            <$Array>
              openToken*: <* '[' />
              closeToken*: <* ']' />
            </>
            closeToken*: <* ']' />
          </>
        </>
      `);
    });

    it('`{"key":[{}]}`', () => {
      expect(print(json`{"key":[{}]}`)).toEqual(dedent`
        <$_>
          _:
          <$Object>
            openToken*: <* '{' />
            properties[]$:
            <$Property>
              key$:
              <$String>
                openToken*: <* '"' />
                content$: <*StringContent 'key' />
                closeToken*: <* '"' />
              </>
              sigilToken*: <* ':' />
              value$:
              <$Array>
                openToken*: <* '[' />
                elements[]$:
                <$Object>
                  openToken*: <* '{' />
                  closeToken*: <* '}' />
                </>
                closeToken*: <* ']' />
              </>
            </>
            closeToken*: <* '}' />
          </>
        </>
      `);
    });
  });
});
