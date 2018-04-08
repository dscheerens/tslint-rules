import * as Lint from 'tslint';
import * as ts from 'typescript';
import { isStringLiteral } from 'tsutils';

export class Rule extends Lint.Rules.AbstractRule {

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'grouped-imports',
        type: 'style',
        description: 'Checks whether third party imports are grouped by module root.',
        descriptionDetails: Lint.Utils.dedent`
            When this rule is enabled it will check if import statements for third party modules are grouped together with respect to the
            module root and scope (if present).
            This will require for example all imports from \`rxjs\` to be placed directly after one another.

            The rule can also be configured to check that all third party (libraries) are placed before or after first party (your own code)
            imports.
        `,
        rationale: 'Grouping imports makes it easier to find related imports.',
        optionsDescription: Lint.Utils.dedent`
            An optional argument can be specified to control the value of the following settings:

            * \`groupThirdPartyModules\` - Checks whether import statements for the same third party are grouped together.
              _Defaults to \`true\`._
            * \`firstVsThirdPartyOrder\` - Checks whether third party modules are placed before or after first party modules.
              Valid options are either \`third-party-modules-first\` or \`third-party-modules-last\`.
              _Disabled by default._
        `,
        options: {
            type: 'object',
            properties: {
                groupThirdPartyModules: {
                    type: 'boolean'
                },
                firstVsThirdPartyOrder: {
                    type: 'string',
                    enum: ['third-party-modules-first', 'third-party-modules-last']
                }
            },
            additionalProperties: false
        },
        optionExamples: [
            [true],
            [true, { firstVsThirdPartyOrder: 'third-party-modules-first' }],
            [true, { groupThirdPartyModules: false, firstVsThirdPartyOrder: 'third-party-modules-last' }]
        ],
        typescriptOnly: false
    }

    public static FIRST_PARTY_IMPORT_FIRST_FAILURE_MESSAGE = 'First party imports should be placed before third party imports';
    public static THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE = 'Third party imports should be placed before first party imports';

    public static GROUP_MODULE_ROOT_FAILURE_MESSAGE(moduleRoot: string): string {
        return `Module imports starting with '${moduleRoot}' should be grouped`;
    }

    public static GROUP_SCOPED_MODULE_FAILURE_MESSAGE(scope: string): string {
        return `Module imports for the '${scope}' scope should be grouped`;
    }

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const options = parseOptions(this.ruleArguments);
        return options === undefined ? [] : this.applyWithFunction(sourceFile, walk, options);
    }

}

enum FirstVsThirdPartyOrder {
    THIRD_PARTY_MODULES_FIRST = 'third-party-modules-first',
    THIRD_PARTY_MODULES_LAST = 'third-party-modules-last'
}

interface Options {
    readonly groupThirdPartyModules: boolean;
    readonly firstVsThirdPartyOrder?: FirstVsThirdPartyOrder;
}

function parseOptions(ruleArguments: any[]): Options | undefined {

    if (!Array.isArray(ruleArguments) || ruleArguments.length > 0 && typeof ruleArguments[0] !== 'object') {
        return undefined;
    }

    const options = ruleArguments[0] || {};

    const groupThirdPartyModules = (
        typeof options.groupThirdPartyModules === 'boolean'
        ? options.groupThirdPartyModules
        : true
    );

    const firstVsThirdPartyOrder = (
        typeof options.firstVsThirdPartyOrder === 'string' && (
            options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_FIRST ||
            options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_LAST
        )
        ? options.firstVsThirdPartyOrder as FirstVsThirdPartyOrder
        : undefined
    );

    return {
        groupThirdPartyModules,
        firstVsThirdPartyOrder
    };
}

enum ModuleType {
    FIRST_PARTY = 'FIRST_PARTY',
    THIRD_PARTY = 'THIRD_PARTY'
}

function walk(ctx: Lint.WalkContext<Options>): void {

    const imports = ctx.sourceFile.statements
        .filter((statement) => statement.kind === ts.SyntaxKind.ImportDeclaration)
        .map((importDeclaration: ts.ImportDeclaration) => importDeclaration)
        .filter((importDeclaration) => isStringLiteral(importDeclaration.moduleSpecifier))

    let expectedModuleType: ModuleType | undefined;
    let lastUsedModuleRoot: string | undefined;
    let lastUsedModuleScope: string | undefined;
    const importedModuleRoots = new Set<string | undefined>();

    imports.forEach((importDeclaration, index) => {
        const moduleSpecifier = (importDeclaration.moduleSpecifier as ts.StringLiteral).text;

        const moduleType = moduleSpecifier.startsWith('.') ? ModuleType.FIRST_PARTY : ModuleType.THIRD_PARTY;
        const moduleRoot = getModuleSpecifierRoot(moduleSpecifier);
        const moduleScope = getModuleSpecifierScope(moduleSpecifier);

        const moduleTypeSectionSwitched = expectedModuleType !== moduleType && (
            ctx.options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_FIRST &&
                moduleType === ModuleType.FIRST_PARTY ||
            ctx.options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_LAST &&
                moduleType === ModuleType.THIRD_PARTY
        );

        if (expectedModuleType === undefined || moduleTypeSectionSwitched) {
            expectedModuleType = moduleType;
        }

        if (ctx.options.firstVsThirdPartyOrder !== undefined && expectedModuleType !== moduleType) {
            ctx.addFailureAtNode(
                importDeclaration,
                moduleType === ModuleType.FIRST_PARTY
                ? Rule.FIRST_PARTY_IMPORT_FIRST_FAILURE_MESSAGE
                : Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE
            );
        }

        if (index > 0 && ctx.options.groupThirdPartyModules) {
            if (moduleRoot !== undefined && lastUsedModuleRoot !== moduleRoot && importedModuleRoots.has(moduleRoot)) {
                ctx.addFailureAtNode(importDeclaration, Rule.GROUP_MODULE_ROOT_FAILURE_MESSAGE(moduleRoot));
            } else if (moduleScope !== undefined && lastUsedModuleScope !== moduleScope && importedModuleRoots.has(moduleScope)) {
                ctx.addFailureAtNode(importDeclaration, Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE(moduleScope));
            }
        }

        lastUsedModuleRoot = moduleRoot;
        lastUsedModuleScope = moduleScope;

        importedModuleRoots.add(moduleRoot);
        importedModuleRoots.add(moduleScope);
    });
}

function getModuleSpecifierRoot(moduleSpecifier: string): string | undefined {
    const moduleRootMatch = moduleSpecifier.match(/^((@\w+\/)?\w+)(?:\/.*)?$/);

    if (moduleRootMatch === null) {
        return undefined;
    }

    return moduleRootMatch[1];
}

function getModuleSpecifierScope(moduleSpecifier: string): string | undefined {
    const scopeMatch = moduleSpecifier.match(/^(@\w+)\//);

    if (scopeMatch === null) {
        return undefined;
    }

    return scopeMatch[1];
}
