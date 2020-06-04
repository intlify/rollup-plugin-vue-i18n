import VuePlugin from 'rollup-plugin-vue'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import path from 'path'

const i18n = require(path.resolve(__dirname, '../lib/index.js')).default

export default [
  {
    input: path.resolve(__dirname, `./${process.env.BUILD}/main.js`),
    output: {
      file: path.resolve(__dirname, `./${process.env.BUILD}/index.js`),
      format: 'cjs'
    },
    plugins: [
      commonjs(),
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      i18n(),
      VuePlugin({ customBlocks: ['i18n'] })
    ]
  }
]
