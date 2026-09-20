/**
 * guard-plus 的 oxlint JS 插件。
 *
 * 目前只有一条规则：强制 `ripple()` 的依赖对象每个属性独占一行。
 * Cyrene 的 provider 输入是这份项目里唯一的“依赖清单”，
 * 竖排后新增/删除依赖在 diff 里一眼可见，也便于 review 依赖边界。
 *
 * 注意：oxfmt 会保留对象字面量里用户写的换行（不会把短对象折叠回一行），
 * 所以本规则的 autofix 结果不会被 `vp fmt` 撤销。
 */

const RIPPLE_CALLEE_NAME = 'ripple';
const INDENT_UNIT = '  ';

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

const plugin = {
  meta: {
    name: 'guard-plus',
  },
  rules: {
    'ripple-deps-each-on-own-line': rippleDepsEachOnOwnLine,
  },
};

export default plugin;
