const vue = require('rollup-plugin-vue')
const yaml = require('@rollup/plugin-yaml')
const json = require('@rollup/plugin-json')
const { default: i18n } = require('../lib/index')

export default {
  input: './example/index.js',
  output: {
    format: 'esm',
    file: './example/components.esm.js'
  },
  external: [
    // Externalize so that the output code is readable.
    'vue',
    'vue-runtime-helpers',
    'vue-i18n'
  ],
  plugins: [
    yaml(),
    json(),
    i18n(),
    vue({
      customBlocks: ['i18n']
    })
  ]
}
