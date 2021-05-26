module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: ["eslint:recommended"],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        parser: "babel-eslint",
    },
    rules: {
        quotes: ["error", "double"],
    },
};
