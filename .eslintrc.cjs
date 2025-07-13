module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error Prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    
    // Best Practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'curly': ['error', 'all'],
    'dot-notation': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'warn',
    'no-magic-numbers': ['warn', { ignore: [-1, 0, 1, 2] }],
    'no-multi-spaces': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-useless-concat': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    
    // Code Style
    'camelcase': ['error', { properties: 'never' }],
    'consistent-return': 'error',
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'max-depth': ['warn', 4],
    'max-lines': ['warn', { max: 500, skipBlankLines: true }],
    'max-params': ['warn', 5],
    'no-nested-ternary': 'error',
    'no-unneeded-ternary': 'error',
    
    // ES6+
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    
    // Security
    'no-new-object': 'error',
    'no-new-wrappers': 'error'
  },
  globals: {
    quickMHLogApp: 'writable'
  }
};