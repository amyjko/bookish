import Prism from 'prismjs';

Prism.languages['python'] = {
    comment: {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true,
        greedy: true,
    },
    'string-interpolation': {
        pattern:
            /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
        greedy: true,
        inside: {
            interpolation: {
                // "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
                pattern:
                    /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
                lookbehind: true,
                inside: {
                    'format-spec': {
                        pattern: /(:)[^:(){}]+(?=\}$)/,
                        lookbehind: true,
                    },
                    'conversion-option': {
                        pattern: /![sra](?=[:}]$)/,
                        alias: 'punctuation',
                    },
                    rest: undefined,
                },
            },
            string: /[\s\S]+/,
        },
    },
    'triple-quoted-string': {
        pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
        greedy: true,
        alias: 'string',
    },
    string: {
        pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
        greedy: true,
    },
    function: {
        pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
        lookbehind: true,
    },
    'class-name': {
        pattern: /(\bclass\s+)\w+/i,
        lookbehind: true,
    },
    decorator: {
        pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
        lookbehind: true,
        alias: ['annotation', 'punctuation'],
        inside: {
            punctuation: /\./,
        },
    },
    keyword:
        /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
    builtin:
        /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
    boolean: /\b(?:False|None|True)\b/,
    number: /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
    operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    punctuation: /[{}[\];(),.:]/,
};

(function (Prism) {
    var keywords =
        /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;

    // full package (optional) + parent classes (optional)
    var classNamePrefix = /(?:[a-z]\w*\s*\.\s*)*(?:[A-Z]\w*\s*\.\s*)*/.source;

    // based on the java naming conventions
    var className = {
        pattern: RegExp(
            /(^|[^\w.])/.source +
                classNamePrefix +
                /[A-Z](?:[\d_A-Z]*[a-z]\w*)?\b/.source,
        ),
        lookbehind: true,
        inside: {
            namespace: {
                pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
                inside: {
                    punctuation: /\./,
                },
            },
            punctuation: /\./,
        },
    };

    Prism.languages.java = Prism.languages.extend('clike', {
        string: {
            pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
            lookbehind: true,
            greedy: true,
        },
        'class-name': [
            className,
            {
                // variables, parameters, and constructor references
                // this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
                pattern: RegExp(
                    /(^|[^\w.])/.source +
                        classNamePrefix +
                        /[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/
                            .source,
                ),
                lookbehind: true,
                inside: className.inside,
            },
            {
                // class names based on keyword
                // this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
                pattern: RegExp(
                    /(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)/
                        .source +
                        classNamePrefix +
                        /[A-Z]\w*\b/.source,
                ),
                lookbehind: true,
                inside: className.inside,
            },
        ],
        keyword: keywords,
        function: [
            // @ts-ignore
            Prism.languages.clike.function,
            {
                pattern: /(::\s*)[a-z_]\w*/,
                lookbehind: true,
            },
        ],
        number: /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
        operator: {
            pattern:
                /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
            lookbehind: true,
        },
        constant: /\b[A-Z][A-Z_\d]+\b/,
    });

    Prism.languages.insertBefore('java', 'string', {
        'triple-quoted-string': {
            // http://openjdk.java.net/jeps/355#Description
            pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
            greedy: true,
            alias: 'string',
        },
        char: {
            pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/,
            greedy: true,
        },
    });

    Prism.languages.insertBefore('java', 'class-name', {
        annotation: {
            pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
            lookbehind: true,
            alias: 'punctuation',
        },
        generics: {
            pattern:
                /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
            inside: {
                'class-name': className,
                keyword: keywords,
                punctuation: /[<>(),.:]/,
                operator: /[?&|]/,
            },
        },
        import: [
            {
                pattern: RegExp(
                    /(\bimport\s+)/.source +
                        classNamePrefix +
                        /(?:[A-Z]\w*|\*)(?=\s*;)/.source,
                ),
                lookbehind: true,
                inside: {
                    namespace: className.inside.namespace,
                    punctuation: /\./,
                    operator: /\*/,
                    'class-name': /\w+/,
                },
            },
            {
                pattern: RegExp(
                    /(\bimport\s+static\s+)/.source +
                        classNamePrefix +
                        /(?:\w+|\*)(?=\s*;)/.source,
                ),
                lookbehind: true,
                alias: 'static',
                inside: {
                    namespace: className.inside.namespace,
                    static: /\b\w+$/,
                    punctuation: /\./,
                    operator: /\*/,
                    'class-name': /\w+/,
                },
            },
        ],
        namespace: {
            pattern: RegExp(
                /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/.source.replace(
                    /<keyword>/g,
                    function () {
                        return keywords.source;
                    },
                ),
            ),
            lookbehind: true,
            inside: {
                punctuation: /\./,
            },
        },
    });
})(Prism);

export default Prism;
