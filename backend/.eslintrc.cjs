module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'plugin:node/recommended', 'plugin:security/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['security'],
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'backups/'],
};
