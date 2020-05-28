import qs from 'querystring'
import JSON5 from 'json5'
import yaml from 'js-yaml'
import { Plugin } from 'rollup'
import { createFilter } from 'rollup-pluginutils'

import { debug as Debug } from 'debug'
const debug = Debug('rollup-plugin-vue-i18n')

export default function i18n(): Plugin {
  const filter = createFilter([/vue&type=i18n/])

  return {
    name: 'rollup-plugin-vue-i18n',
    transform(source: string, id: string) {
      const query = parseVuePartRequest(id)
      debug('transform id', id)
      if (filter(id)) {
        return {
          code:
            `export default function i18n(Component) {\n` +
            `  const options = typeof Component === 'function' ? Component.options : Component\n` +
            `  options.__i18n = options.__i18n || []\n` +
            `  options.__i18n.push(${convert(source, (query as any).lang)})\n` + // eslint-disable-line @typescript-eslint/no-explicit-any
            `}`,
          map: {
            mappings: ''
          }
        }
      }
    }
  }
}

function convert(source: string, lang: string): string {
  const value = source.trim()
  switch (lang) {
    case 'yaml':
    case 'yml':
      const data = yaml.safeLoad(value)
      return JSON.stringify(data, undefined, '\t')
    case 'json5':
      return JSON.stringify(JSON5.parse(value))
    default:
      return JSON.stringify(JSON.parse(value))
  }
}

type Query =
  | {
      filename: string
      vue: false
    }
  | {
      filename: string
      vue: true
      type: 'script'
      lang?: string
      src?: true
    }
  | {
      filename: string
      vue: true
      type: 'template'
      id?: string
      lang?: string
      src?: true
    }
  | {
      filename: string
      vue: true
      type: 'style'
      index: number
      id?: string
      scoped?: boolean
      module?: string | boolean
      lang?: string
      src?: true
    }
  | {
      filename: string
      vue: true
      type: 'custom'
      index: number
      lang?: string
      src?: true
    }

function parseVuePartRequest(id: string): Query {
  const [filename, query] = id.split('?', 2)

  if (!query) {
    return { vue: false, filename }
  }

  const raw = qs.parse(query)

  if ('vue' in raw) {
    const langPart = Object.keys(raw).find(key => /lang\./i.test(key))
    const part = {
      ...raw,
      filename,
      vue: true,
      index: Number(raw.index),
      src: 'src' in raw,
      scoped: 'scoped' in raw
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (langPart) {
      const [, lang] = langPart.split('.')
      part['lang'] = lang
    }
    return part
  }

  return { vue: false, filename }
}
