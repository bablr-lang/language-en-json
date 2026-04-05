import { buildTag } from 'bablr';
import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
import language from '@bablr/language-en-json';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';

let enhancers = {};
let { raw } = String;

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
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent 'hello' />
            closeToken*: <* '"' />
          </>
        </>\n`);
    });

    it('`""`', () => {
      expect(print(json`""`)).toEqual(dedent`\
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent />
            closeToken*: <* '"' />
          </>
        </>\n`);
    });

    it('`" "`', () => {
      expect(print(json`" "`)).toEqual(dedent`\
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent ' ' />
            closeToken*: <* '"' />
          </>
        </>\n`);
    });

    it('` " " `', () => {
      expect(print(json` " " `)).toEqual(dedent`\
        <$_>
          #: :Space: <*Space ' ' />
          _:
          <$String>
            openToken*: <* '"' />
            content$: <*StringContent ' ' />
            closeToken*: <* '"' />
          </>
          #: :Space: <*Space ' ' />
        </>\n`);
    });

    it('`"\\n"`', () => {
      expect(print(json`"\n"`)).toEqual(dedent(String.raw)`<$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '\n' }>
                sigilToken*: <* '\\' />
                code*: <*Keyword 'n' />
              </>
            </>
            closeToken*: <* '"' />
          </>
        </>${'\n'}`);
    });

    it('`"\\""`', () => {
      expect(print(json`"\""`)).toEqual(dedent(String.raw)`<$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '"' }>
                sigilToken*: <* '\\' />
                code*: <*Keyword '"' />
              </>
            </>
            closeToken*: <* '"' />
          </>
        </>${'\n'}`);
    });

    it(`\`${raw`"\""`}\``, () => {
      expect(print(json`"\""`)).toEqual(dedent`\
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '"' }>
                sigilToken*: <* '${'\\\\'}' />
                code*: <*Keyword '"' />
              </>
            </>
            closeToken*: <* '"' />
          </>
        </>\n`);
    });

    it(`\`${raw`"\u1234"`}\``, () => {
      expect(print(json`"\u123f"`)).toEqual(dedent`\
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: 'ሿ' }>
                sigilToken*: <* '${'\\\\'}' />
                code*:
                <EscapeCode>
                  typeToken*: <*Keyword 'u' />
                  value: <*UnsignedHexInteger '123f' />
                </>
              </>
            </>
            closeToken*: <* '"' />
          </>
        </>\n`);
    });

    it(`\`${raw`"\u{1}"`}\``, () => {
      expect(print(json`"\u{1}"`)).toEqual(dedent`\
        <$_>
          _:
          <$String>
            openToken*: <* '"' />
            content$:
            <*StringContent>
              @:
              <EscapeSequence { cooked: '${'\\'}u0001' }>
                sigilToken*: <* '${'\\\\'}' />
                code*:
                <EscapeCode>
                  typeToken*: <*Keyword 'u' />
                  openToken*: <* '{' />
                  value: <*UnsignedHexInteger '1' />
                  closeToken*: <* '}' />
                </>
              </>
            </>
            closeToken*: <* '"' />
          </>
        </>\n`);
    });

    it('`true`', () => {
      expect(print(json`true`)).toEqual(dedent`\
        <$_>
          _:
          <$Boolean>
            sigilToken*: <*Keyword 'true' />
          </>
        </>\n`);
    });

    it('`1`', () => {
      expect(print(json`1`)).toEqual(dedent`\
        <$_>
          _:
          <$Number>
            wholePart$:
            <$Integer>
              value$: <*UnsignedInteger '1' />
            </>
            fractionalPart$: null
            exponentPart$: null
          </>
        </>\n`);
    });

    it('`null`', () => {
      expect(print(json`null`)).toEqual(dedent`\
        <$_>
          _:
          <$Null>
            sigilToken*: <*Keyword 'null' />
          </>
        </>\n`);
    });

    it('`[]`', () => {
      expect(print(json`[]`)).toEqual(dedent`\
        <$_>
          _:
          <$Array>
            openToken*: <* '[' />
            closeToken*: <* ']' />
          </>
        </>\n`);
    });

    it('`[null]`', () => {
      expect(print(json`[null]`)).toEqual(dedent`\
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
        </>\n`);
    });

    it('`21`', () => {
      expect(print(json`21`)).toEqual(dedent`\
        <$_>
          _:
          <$Number>
            wholePart$:
            <$Integer>
              value$: <*UnsignedInteger '21' />
            </>
            fractionalPart$: null
            exponentPart$: null
          </>
        </>\n`);
    });

    it('`[true, false]`', () => {
      expect(print(json`[true, false]`)).toEqual(dedent`\
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
        </>\n`);
    });

    it('`{"foo":null}`', () => {
      expect(print(json`{"foo":null}`)).toEqual(dedent`\
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
        </>\n`);
    });

    it('`[[]]`', () => {
      expect(print(json`[[]]`)).toEqual(dedent`\
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
        </>\n`);
    });

    it('`{"key":[{}]}`', () => {
      expect(print(json`{"key":[{}]}`)).toEqual(dedent`\
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
        </>\n`);
    });
  });
});
