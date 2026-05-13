module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-unreachable': ['warn'],
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'backups/'],
};
