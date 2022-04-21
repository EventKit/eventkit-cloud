module.exports = (api) => {
    api.cache.using(() => process.env.NODE_ENV);
    const presets = [
        '@babel/preset-react',
        ['@babel/preset-env', { targets: '> 0.25%, not dead' }],
        '@babel/preset-flow',
    ];
    const plugins = [
        '@babel/plugin-proposal-function-bind',
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-async-to-generator',
        ['@babel/plugin-proposal-private-methods', { 'loose': true }],
        ["@babel/plugin-proposal-private-property-in-object", { "loose": true }]
    ];

    return {
        presets,
        plugins,
    };
};
