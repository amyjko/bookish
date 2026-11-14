import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import ts from 'typescript';

// Bound books (bookish-reader) import the package entry and never talk to
// Firebase, so nothing the entry reaches through static imports may load the
// Firebase SDK or the modules that wrap it. Doing so put most of Firebase into
// every book's JavaScript. Load them with a dynamic import() instead; see
// src/lib/models/FirebaseAvailable.ts.

const lib = path.resolve('src/lib');
const entry = path.join(lib, 'index.js');
const forbidden = [
    path.join(lib, 'models/Firebase.ts'),
    path.join(lib, 'models/CRUD.ts'),
];

function resolve(from: string, specifier: string): string | undefined {
    const base = specifier.startsWith('#lib/')
        ? path.join(lib, specifier.slice('#lib/'.length))
        : specifier.startsWith('.')
          ? path.resolve(path.dirname(from), specifier)
          : undefined;
    if (base === undefined) return undefined;
    const candidates = [
        base,
        base.replace(/\.js$/, '.ts'),
        `${base}.ts`,
        `${base}.js`,
        `${base}.svelte`,
        path.join(base, 'index.ts'),
    ];
    return candidates.find((c) => existsSync(c) && statSync(c).isFile());
}

/** The module specifiers a file imports or re-exports at runtime. */
function runtimeImports(file: string): string[] {
    let source = readFileSync(file, 'utf8');
    if (file.endsWith('.svelte'))
        source = [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
            .map((match) => match[1])
            .join('\n');
    if (file.endsWith('.json')) return [];
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest);
    const specifiers: string[] = [];
    for (const statement of parsed.statements) {
        if (ts.isImportDeclaration(statement)) {
            const clause = statement.importClause;
            if (clause?.isTypeOnly) continue;
            const named = clause?.namedBindings;
            const onlyTypes =
                clause !== undefined &&
                clause.name === undefined &&
                named !== undefined &&
                ts.isNamedImports(named) &&
                named.elements.length > 0 &&
                named.elements.every((element) => element.isTypeOnly);
            if (onlyTypes) continue;
            specifiers.push(
                (statement.moduleSpecifier as ts.StringLiteral).text,
            );
        } else if (
            ts.isExportDeclaration(statement) &&
            statement.moduleSpecifier !== undefined &&
            !statement.isTypeOnly
        )
            specifiers.push(
                (statement.moduleSpecifier as ts.StringLiteral).text,
            );
    }
    return specifiers;
}

test('the package entry never statically loads Firebase', () => {
    const via = new Map<string, string | undefined>([[entry, undefined]]);
    const queue = [entry];
    const problems: string[] = [];
    const chain = (file: string) => {
        const steps: string[] = [];
        for (let at: string | undefined = file; at; at = via.get(at))
            steps.unshift(path.relative(lib, at));
        return steps.join(' > ');
    };

    while (queue.length > 0) {
        const file = queue.shift()!;
        for (const specifier of runtimeImports(file)) {
            if (/^@?firebase(\/|$)/.test(specifier)) {
                problems.push(`${chain(file)} imports ${specifier}`);
                continue;
            }
            const target = resolve(file, specifier);
            if (target === undefined) continue;
            if (forbidden.includes(target)) {
                problems.push(
                    `${chain(file)} imports ${path.relative(lib, target)}`,
                );
                continue;
            }
            if (!via.has(target)) {
                via.set(target, file);
                queue.push(target);
            }
        }
    }

    // Guard against the walk silently finding nothing.
    expect(via.size).toBeGreaterThan(100);
    expect(problems).toEqual([]);
});
