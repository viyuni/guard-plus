import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  run: {
    cache: {
      scripts: false,
      tasks: true,
    },
    tasks: {
      check: {
        command: ['vpr @server/app#build:types', 'vp fmt', 'vp lint', 'vpr typecheck'],
      },
      typecheck: {
        command: 'golar typecheck',
      },
      'typecheck:schema': {
        command: 'vpr --filter "@shared/schema" typecheck',
      },
      'typecheck:server': {
        command: 'vpr --concurrency-limit 1 --filter "@server/*" typecheck',
      },
      'typecheck:web': {
        command: [
          'vpr @server/app#build:types',
          'vpr --concurrency-limit 1 --filter "@web/*" typecheck',
        ],
      },
      test: {
        command: 'vpr -r test',
      },
      changelog: {
        command: 'changelogen',
      },
      release: {
        command: 'changelogen --release',
      },
      'release:github': {
        command: 'changelogen gh release',
      },
      'release:prepare': {
        command: 'changelogen --bump',
      },
    },
  },
  fmt: {
    singleQuote: true,
    sortImports: true,
    sortTailwindcss: true,
    sortPackageJson: true,
    arrowParens: 'avoid',
    embeddedLanguageFormatting: 'auto',
    printWidth: 100,
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      'webs/ui/components/ui/**',
      '**/drizzle/**',
    ],
  },
  lint: {
    jsPlugins: [
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
      {
        name: 'stylistic',
        specifier: '@stylistic/eslint-plugin',
      },
    ],
    rules: {
      'constructor-super': 'warn',
      'for-direction': 'warn',
      'no-async-promise-executor': 'warn',
      'no-caller': 'warn',
      'no-class-assign': 'warn',
      'no-compare-neg-zero': 'warn',
      'no-cond-assign': 'warn',
      'no-const-assign': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-constant-condition': 'warn',
      'no-control-regex': 'warn',
      'no-debugger': 'warn',
      'no-delete-var': 'warn',
      'no-dupe-class-members': 'warn',
      'no-dupe-else-if': 'warn',
      'no-dupe-keys': 'warn',
      'no-duplicate-case': 'warn',
      'no-empty-character-class': 'warn',
      'no-empty-pattern': 'warn',
      'no-empty-static-block': 'warn',
      'no-eval': 'warn',
      'no-ex-assign': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-func-assign': 'warn',
      'no-global-assign': 'warn',
      'no-import-assign': 'warn',
      'no-invalid-regexp': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-loss-of-precision': 'warn',
      'no-new-native-nonconstructor': 'warn',
      'no-nonoctal-decimal-escape': 'warn',
      'no-obj-calls': 'warn',
      'no-self-assign': 'warn',
      'no-setter-return': 'warn',
      'no-shadow-restricted-names': 'warn',
      'no-sparse-arrays': 'warn',
      'no-this-before-super': 'warn',
      'no-unassigned-vars': 'warn',
      'no-unsafe-finally': 'warn',
      'no-unsafe-negation': 'warn',
      'no-unsafe-optional-chaining': 'warn',
      'no-unused-expressions': 'warn',
      'no-unused-labels': 'warn',
      'no-unused-private-class-members': 'warn',
      'no-unused-vars': 'warn',
      'no-useless-backreference': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-rename': 'warn',
      'no-with': 'warn',
      'require-yield': 'warn',
      'use-isnan': 'warn',
      'valid-typeof': 'warn',
      'oxc/bad-array-method-on-arguments': 'warn',
      'oxc/bad-char-at-comparison': 'warn',
      'oxc/bad-comparison-sequence': 'warn',
      'oxc/bad-min-max-func': 'warn',
      'oxc/bad-object-literal-comparison': 'warn',
      'oxc/bad-replace-all-arg': 'warn',
      'oxc/const-comparisons': 'warn',
      'oxc/double-comparisons': 'warn',
      'oxc/erasing-op': 'warn',
      'oxc/missing-throw': 'warn',
      'oxc/number-arg-out-of-range': 'warn',
      'oxc/only-used-in-recursion': 'warn',
      'oxc/uninvoked-array-callback': 'warn',
      'typescript/await-thenable': 'warn',
      'typescript/no-array-delete': 'warn',
      'typescript/no-base-to-string': 'warn',
      'typescript/no-duplicate-enum-values': 'warn',
      'typescript/no-duplicate-type-constituents': 'warn',
      'typescript/no-extra-non-null-assertion': 'warn',
      'typescript/no-floating-promises': 'off',
      'typescript/no-for-in-array': 'warn',
      'typescript/no-implied-eval': 'warn',
      'typescript/no-meaningless-void-operator': 'warn',
      'typescript/no-misused-new': 'warn',
      'typescript/no-misused-spread': 'warn',
      'typescript/no-non-null-asserted-optional-chain': 'warn',
      'typescript/no-redundant-type-constituents': 'warn',
      'typescript/no-this-alias': 'warn',
      'typescript/no-unnecessary-parameter-property-assignment': 'warn',
      'typescript/no-unsafe-declaration-merging': 'warn',
      'typescript/no-unsafe-unary-minus': 'warn',
      'typescript/no-useless-empty-export': 'warn',
      'typescript/no-wrapper-object-types': 'warn',
      'typescript/prefer-as-const': 'warn',
      'typescript/require-array-sort-compare': 'warn',
      'typescript/restrict-template-expressions': 'warn',
      'typescript/triple-slash-reference': 'warn',
      'typescript/unbound-method': 'warn',
      'unicorn/no-await-in-promise-methods': 'warn',
      'unicorn/no-empty-file': 'warn',
      'unicorn/no-invalid-fetch-options': 'warn',
      'unicorn/no-invalid-remove-event-listener': 'warn',
      'unicorn/no-new-array': 'warn',
      'unicorn/no-single-promise-in-promise-methods': 'warn',
      'unicorn/no-thenable': 'warn',
      'unicorn/no-unnecessary-await': 'warn',
      'unicorn/no-useless-fallback-in-spread': 'warn',
      'unicorn/no-useless-length-check': 'warn',
      'unicorn/no-useless-spread': 'warn',
      'unicorn/prefer-set-size': 'warn',
      'unicorn/prefer-string-starts-ends-with': 'warn',
      'vite-plus/prefer-vite-plus-imports': 'error',
      'typescript/switch-exhaustiveness-check': 'error',
      'typescript/consistent-type-imports': 'error',
      'unicorn/switch-case-braces': 'error',
      'default-case-last': 'allow',
      'no-return-assign': 'error',
      'no-implicit-coercion': 'error',
      'prefer-template': 'error',
      'prefer-const': 'error',
      'no-sequences': 'error',
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],

      curly: 'error',

      // return 后不要再套 else
      'no-else-return': 'error',

      // 避免 else { if (...) }
      'no-lonely-if': 'error',

      // 禁止嵌套三元
      'no-nested-ternary': 'error',

      // 去掉无意义三元
      'no-unneeded-ternary': 'error',

      // 最大块嵌套层级
      'max-depth': ['warn', { max: 4 }],

      // 圈复杂度
      complexity: ['warn', { max: 12 }],

      // foo(bar(baz(qux()))) 这种调用嵌套
      'unicorn/max-nested-calls': ['warn', { max: 3 }],

      'stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'block-like',
        },
        {
          blankLine: 'always',
          prev: 'block-like',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['multiline-const', 'multiline-let', 'multiline-var'],
        },

        {
          blankLine: 'always',
          prev: ['multiline-const', 'multiline-let', 'multiline-var'],
          next: '*',
        },
      ],
    },
    settings: {
      jsdoc: {
        ignorePrivate: false,
        ignoreInternal: false,
        ignoreReplacesDocs: true,
        overrideReplacesDocs: true,
        augmentsExtendsReplacesDocs: false,
        implementsReplacesDocs: false,
        exemptDestructuredRootsFromChecks: false,
        tagNamePreference: {},
      },
      vitest: {
        typecheck: true,
      },
    },
    env: {
      builtin: true,
    },
    globals: {},
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      'webs/ui/components/ui/**',
      '**/drizzle/**',
    ],
  },
});
