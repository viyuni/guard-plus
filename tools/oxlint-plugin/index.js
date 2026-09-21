/**
 * guard-plus 的 oxlint JS 插件。
 *
 * 目前有三条规则：
 * - `ripple-deps-each-on-own-line`：强制 `ripple()` 的依赖对象每个属性独占一行。
 *   Cyrene 的 provider 输入是这份项目里唯一的“依赖清单”，
 *   竖排后新增/删除依赖在 diff 里一眼可见，也便于 review 依赖边界。
 * - `ripple-pascal-case`：强制 `ripple()` 返回的 provider 定义用 PascalCase 命名。
 * - `ripple-deps-pascal-case`：强制 `ripple()` 的依赖键与注入定义同名（PascalCase 简写）。
 *
 * 注意：oxfmt 会保留对象字面量里用户写的换行（不会把短对象折叠回一行），
 * 所以第一条规则的 autofix 结果不会被 `vp fmt` 撤销。
 */

const RIPPLE_CALLEE_NAME = 'ripple';
const INDENT_UNIT = '  ';
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

/**
 * 把一个普通命名转换成建议使用的 PascalCase。
 *
 * @param {string} name 现有命名，例如 `orderUseCase`、`legacy_point_migration_repo`
 */
function toPascalCase(name) {
  return name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * 依赖对象是否需要重新排版。
 *
 * @param {string} text 整个文件源码
 * @param {any} objectNode 依赖对象字面量
 */
function needsMultiline(text, objectNode) {
  const properties = objectNode.properties;
  const openBraceLine = objectNode.loc.start.line;

  // `{ a, b }`：第一个属性与 `{` 同行
  if (properties[0].loc.start.line === openBraceLine) {
    return true;
  }

  // 右花括号必须独占一行
  if (objectNode.loc.end.line === properties[properties.length - 1].loc.end.line) {
    return true;
  }

  // 任意两个属性同行
  for (let index = 1; index < properties.length; index++) {
    if (properties[index].loc.start.line === properties[index - 1].loc.end.line) {
      return true;
    }
  }

  return false;
}

/**
 * 取 `index` 所在行的缩进。
 *
 * @param {string} text 整个文件源码
 * @param {number} index 目标字符下标
 */
function indentOfLineAt(text, index) {
  const lineStart = text.lastIndexOf('\n', index - 1) + 1;
  const prefix = text.slice(lineStart, index);

  if (/^[ \t]*$/.test(prefix)) {
    return prefix;
  }

  const lineEnd = text.indexOf('\n', lineStart);
  const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);

  return /^[ \t]*/.exec(line)[0];
}

/**
 * 构造 autofix。
 *
 * 属性自身跨行、或对象内嵌注释时返回 null——这两种情况重排会破坏内部格式或丢注释，
 * 交给人工处理，规则本身仍然会报错。
 *
 * @param {any} sourceCode
 * @param {any} fixer
 * @param {any} objectNode
 */
function buildFix(sourceCode, fixer, objectNode) {
  const properties = objectNode.properties;

  if (properties.some(property => property.loc.start.line !== property.loc.end.line)) {
    return null;
  }

  const rawText = sourceCode.text.slice(objectNode.range[0], objectNode.range[1]);

  if (rawText.includes('//') || rawText.includes('/*')) {
    return null;
  }

  const baseIndent = indentOfLineAt(sourceCode.text, objectNode.range[0]);
  const propertyIndent = baseIndent + INDENT_UNIT;

  const body = properties
    .map(property => `${propertyIndent}${sourceCode.getText(property).trim()},`)
    .join('\n');

  return fixer.replaceTextRange(
    [objectNode.range[0], objectNode.range[1]],
    `{\n${body}\n${baseIndent}}`,
  );
}

const rippleDepsEachOnOwnLine = {
  meta: {
    type: 'layout',
    docs: {
      description: 'ripple() 的依赖对象必须每个属性独占一行',
    },
    fixable: 'code',
    schema: [],
    messages: {
      eachOnOwnLine: 'ripple() 的依赖对象必须每个属性独占一行',
    },
  },

  create(context) {
    const { sourceCode } = context;

    return {
      CallExpression(node) {
        const callee = node.callee;

        if (!callee || callee.type !== 'Identifier' || callee.name !== RIPPLE_CALLEE_NAME) {
          return;
        }

        const deps = node.arguments?.[0];

        if (!deps || deps.type !== 'ObjectExpression' || deps.properties.length === 0) {
          return;
        }

        if (!needsMultiline(sourceCode.text, deps)) {
          return;
        }

        context.report({
          node: deps,
          messageId: 'eachOnOwnLine',
          fix: fixer => buildFix(sourceCode, fixer, deps),
        });
      },
    };
  },
};

/**
 * `ripple()` 返回的是一个 provider 定义，语义上等同于“类”：`token()` 和
 * `InferInput<typeof X>` 的类型名已经是 PascalCase，返回值也统一成 PascalCase 后，
 * provider 定义、它的实例类型和 `container` 上的键名就是同一个名字。
 *
 * 依赖对象里的键不受此规则约束——令牌别名（`apiOrigin: ApiOrigin`）仍然是 camelCase，
 * 只有“返回值被绑定到哪个名字”需要大写开头。
 *
 * 不提供 autofix：这里的 provider 基本都是 `export` 的，跨文件引用无法在单文件 fix 里改到，
 * 只报错并给出建议名，改名交给调用方统一处理。
 */
const ripplePascalCase = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'ripple() 返回的 provider 必须用 PascalCase 命名',
    },
    schema: [],
    messages: {
      pascalCase:
        'ripple() 返回的是 provider 定义，请用 PascalCase 命名："{{name}}" 应改为 "{{suggestion}}"',
    },
  },

  create(context) {
    return {
      VariableDeclarator(node) {
        const id = node.id;

        if (id.type !== 'Identifier' || PASCAL_CASE.test(id.name)) {
          return;
        }

        const init = node.init;

        if (!init || init.type !== 'CallExpression') {
          return;
        }

        const callee = init.callee;

        if (!callee || callee.type !== 'Identifier' || callee.name !== RIPPLE_CALLEE_NAME) {
          return;
        }

        context.report({
          node: id,
          messageId: 'pascalCase',
          data: {
            name: id.name,
            suggestion: toPascalCase(id.name),
          },
        });
      },
    };
  },
};

/**
 * 判断一个依赖键是否合格：与注入定义同名（简写）为合格。
 *
 * 别名（`orderRepo: OrderRepo`）会让同一个依赖出现两个名字，这里统一禁止；
 * 只有值本身无法简写（例如带参数的 Ref `logger('users')`）时才退化为要求键 PascalCase。
 *
 * @param {any} context
 * @param {any} property 依赖对象里的属性节点
 */
function checkDependencyKey(context, property) {
  if (property.type !== 'Property' || property.shorthand) {
    return;
  }

  const key = property.key;

  if (!key || key.type !== 'Identifier') {
    return;
  }

  const value = property.value;

  if (value && value.type === 'Identifier') {
    context.report({
      node: key,
      messageId: 'shorthand',
      data: {
        name: key.name,
        suggestion: value.name,
      },
    });

    return;
  }

  if (!PASCAL_CASE.test(key.name)) {
    context.report({
      node: key,
      messageId: 'pascalCase',
      data: {
        name: key.name,
        suggestion: toPascalCase(key.name),
      },
    });
  }
}

/**
 * `ripple()` 的依赖键就是工厂参数名。键与注入定义同名时可以直接写简写：
 * `ripple({ Database, OrderRepo }, ({ Database, OrderRepo }) => ...)`。
 *
 * 同样不提供 autofix：改键名要同时改工厂参数和 body 里的引用，属于跨作用域重命名。
 */
const rippleDepsPascalCase = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'ripple() 的依赖键必须与注入定义同名（PascalCase 简写）',
    },
    schema: [],
    messages: {
      shorthand:
        'ripple() 的依赖键应与注入定义同名，请用简写："{{name}}: {{suggestion}}" 应改为 "{{suggestion}}"',
      pascalCase: 'ripple() 的依赖键必须用 PascalCase："{{name}}" 应改为 "{{suggestion}}"',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (!callee || callee.type !== 'Identifier' || callee.name !== RIPPLE_CALLEE_NAME) {
          return;
        }

        const deps = node.arguments?.[0];

        if (!deps || deps.type !== 'ObjectExpression') {
          return;
        }

        for (const property of deps.properties) {
          checkDependencyKey(context, property);
        }
      },
    };
  },
};

/**
 * 架构边界规则。
 *
 * `server/src` 的顶层目录就是依赖层级：apps → modules → infrastructure →
 * composition → shared，导入只能顺着这个方向走；另外还有两条模块级约束：
 * 跨模块只能走 `#modules/<name>` 公共入口，App 之间不能互相导入。
 *
 * 判据只看源码里的 `#` 别名导入，因此 relative import 仍留给人工判断
 * （同一模块内部的 relative import 是允许且推荐的）。
 */

const SOURCE_LAYERS = {
  // 同层互相依赖始终允许；这里只列"允许向下的层"。
  apps: new Set(['modules', 'infrastructure', 'composition', 'shared', 'config']),
  modules: new Set(['infrastructure', 'composition', 'shared']),
  infrastructure: new Set(['composition', 'shared']),
  // composition 声明的令牌必须用基础设施能力的类型（Database: DbClient ...），
  // 因此允许 composition → infrastructure，但基础设施本身不允许反向依赖 composition。
  composition: new Set(['infrastructure', 'shared']),
  shared: new Set(),
  // config 只包含无运行时副作用的环境变量 Schema 片段。
  config: new Set(),
};

const ALIAS_LAYERS = [
  ['#apps/', 'apps'],
  ['#modules/', 'modules'],
  ['#infrastructure/', 'infrastructure'],
  ['#composition/', 'composition'],
  ['#composition', 'composition'],
  ['#shared/', 'shared'],
  ['#shared', 'shared'],
  ['#config/', 'config'],
];

/**
 * 从文件名解析出它所在的架构层。
 *
 * @param {unknown} filename
 */
function parseSourcePath(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return null;
  }

  const normalized = filename.replaceAll('\\', '/');
  const match = /(?:^|\/)src\/(.+)$/.exec(normalized);
  const serverMatch = /(?:^|\/)server\/src\/(.+)$/.exec(normalized);
  const resolved = serverMatch?.[1] ?? match?.[1];

  if (!resolved) {
    return null;
  }

  const segments = resolved.split('/');

  return {
    layer: segments[0],
    relative: resolved,
  };
}

/**
 * 解析别名导入属于哪一层。
 *
 * @param {string} specifier
 */
function resolveAliasLayer(specifier) {
  for (const [prefix, layer] of ALIAS_LAYERS) {
    if (specifier === prefix.replace(/\/$/, '') || specifier.startsWith(prefix)) {
      return layer;
    }
  }

  return null;
}

const architectureImportBoundary = {
  meta: {
    type: 'problem',
    docs: {
      description: '强制 apps/modules/infrastructure/composition/shared 的单向依赖与模块公共入口',
    },
    schema: [],
    messages: {
      layerViolation:
        '{{layer}} 层不允许依赖 {{target}} 层："{{specifier}}" 破坏了 apps → modules → infrastructure → composition → shared 的单向依赖',
      moduleDeepImport:
        '跨模块禁止 deep import："{{specifier}}" 只允许该模块内部使用，其他模块请从 "#modules/{{module}}" 默认导出访问能力',
      appDeepImport: 'App 之间禁止互相导入："{{specifier}}" 只允许在 apps/{{app}} 内部使用',
      configBoundary:
        '环境变量 Schema 只允许由 apps/<app>/config.ts 导入："{{specifier}}" 出现在 {{relative}}',
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename?.();
    const source = parseSourcePath(filename);

    if (!source || !SOURCE_LAYERS[source.layer]) {
      return {};
    }

    /**
     * 判断一次别名导入违反了哪条约束。
     *
     * @param {string} specifier
     */
    function findViolation(specifier) {
      const targetLayer = resolveAliasLayer(specifier);

      if (!targetLayer) {
        return null;
      }

      if (
        targetLayer === 'config' &&
        source.layer !== 'config' &&
        !/^apps\/[^/]+\/config\.ts$/.test(source.relative)
      ) {
        return {
          messageId: 'configBoundary',
          data: {
            relative: source.relative,
            specifier,
          },
        };
      }

      const sameLayer = targetLayer === source.layer;

      if (!sameLayer && !SOURCE_LAYERS[source.layer].has(targetLayer)) {
        return {
          messageId: 'layerViolation',
          data: {
            layer: source.layer,
            target: targetLayer,
            specifier,
          },
        };
      }

      const moduleMatch = /^#modules\/([^/]+)\/.+$/.exec(specifier);

      if (moduleMatch && !source.relative.startsWith(`modules/${moduleMatch[1]}/`)) {
        return {
          messageId: 'moduleDeepImport',
          data: {
            module: moduleMatch[1],
            specifier,
          },
        };
      }

      const appMatch = /^#apps\/([^/]+)(?:\/.*)?$/.exec(specifier);

      if (appMatch && !source.relative.startsWith(`apps/${appMatch[1]}/`)) {
        return {
          messageId: 'appDeepImport',
          data: {
            app: appMatch[1],
            specifier,
          },
        };
      }

      return null;
    }

    function check(node, specifier) {
      if (typeof specifier !== 'string' || !specifier.startsWith('#')) {
        return;
      }

      const violation = findViolation(specifier);

      if (violation) {
        context.report({ node, ...violation });
      }
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source?.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          check(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        check(node, node.source?.value);
      },
    };
  },
};

const plugin = {
  meta: {
    name: 'guard-plus',
  },
  rules: {
    'architecture-import-boundary': architectureImportBoundary,
    'ripple-deps-each-on-own-line': rippleDepsEachOnOwnLine,
    'ripple-deps-pascal-case': rippleDepsPascalCase,
    'ripple-pascal-case': ripplePascalCase,
  },
};

export default plugin;
