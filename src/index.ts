import { Plugin } from 'rollup'

import { debug as Debug } from 'debug'
const debug = Debug('rollup-plugin-vue-i18n')

export default function i18n (): Plugin {
  return {
    name: 'rollup-plugin-vue-i18n',
    transform (source: string, id: string) {
      debug('transform id', id)
      if (/rollup-plugin-vue=i18n/i.test(id)) {
        return {
          code:
            `${source.replace(/export default/, 'const __i18n =')}` +
            `export default function i18n(Component) {\n` +
            `  const options = typeof Component === 'function' ? Component.options : Component\n` +
            `  options.__i18n = options.__i18n || []\n` +
            `  options.__i18n.push(JSON.stringify(__i18n))\n` +
            `}`,
          map: {
            mappings: ''
          }
        }
      }
    }
  }
}
