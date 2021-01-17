module.exports = {
  env: {
    browser: false,
    es2021: true,
    es6: true,
  },
  extends: ["airbnb-base"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  globals: {
    uni: true,
  },
  plugins: ["babel"],
  parser: "@babel/eslint-parser",
  rules: {
    "no-param-reassign": 0,
    "no-extend-native": 0,
    "no-cond-assign": 0,
    "guard-for-in": 0,
    "no-restricted-syntax": 0,
    "no-bitwise": 0,
    "no-use-before-define": 0,
    "consistent-return": 0,
    "no-unused-vars": 1,
  },
};
