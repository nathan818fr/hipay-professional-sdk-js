module.exports = {
    trailingComma: 'es5',
    printWidth: 120,
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    bracketSpacing: false,
    overrides: [
        {
            files: ['*.json', '*.yml'],
            options: {tabWidth: 2},
        },
    ],
};
