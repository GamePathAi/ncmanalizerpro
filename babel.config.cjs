module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }],
    '@babel/preset-typescript'
  ],
  env: {
    test: {
      plugins: [
        // Transformar import.meta.env para process.env nos testes
        function() {
          return {
            visitor: {
              MemberExpression(path) {
                if (
                  path.node.object &&
                  path.node.object.type === 'MetaProperty' &&
                  path.node.object.meta &&
                  path.node.object.meta.name === 'import' &&
                  path.node.object.property &&
                  path.node.object.property.name === 'meta' &&
                  path.node.property &&
                  path.node.property.name === 'env'
                ) {
                  path.replaceWith({
                    type: 'MemberExpression',
                    object: {
                      type: 'Identifier',
                      name: 'process'
                    },
                    property: {
                      type: 'Identifier',
                      name: 'env'
                    }
                  });
                }
              }
            }
          };
        }
      ]
    }
  }
};