import qs from 'querystring'
import JSON5 from 'json5'
import yaml from 'js-yaml'
import { Plugin } from 'rollup'
import { createFilter } from 'rollup-pluginutils'
import {friendlyJSONstringify } from 'vue-i18n'

import { debug as Debug } from 'debug'
const debug = Debug('rollup-plugin-vue-i18n')

type Query = {
  filename: string
  vue: boolean
  type?: 'script' | 'template' | 'style' | 'custom'
  lang?: string
  src?: boolean
  id?: string
  index?: number
  scoped?: boolean
  module?: string | boolean
  [key: string]: unknown
}

export default function i18n(options: Record<string, unknown>): Plugin {
  const filter = createFilter([/vue&type=i18n/])

  return {
    name: 'rollup-plugin-vue-i18n',
    transform(source: string, id: string) {
      debug('transform id', id)
      if (filter(id)) {
        const query = parseVuePartRequest(id)
        return {
          code:
            `export default function i18n(Component) {\n` +
            `  const options = typeof Component === 'function' ? Component.options : Component\n` +
            `  options.__i18n = options.__i18n || []\n` +
            `  options.__i18n.push(${stringify(parse(source, query), query)})\n` +
            `}`,
          map: {
            mappings: ''
          }
        }
      }
    }
  }
}

function stringify(data: any, query: Query): string {
  const { locale } = query
  if (locale) {
    return friendlyJSONstringify(Object.assign({}, { [locale as string]: data }))
  } else {
    return friendlyJSONstringify(data)
  }
}

function parse(source: string, query: Query): string {
  const value = source.trim()
  const { lang } = query
  switch (lang) {
    case 'yaml':
    case 'yml':
      return yaml.safeLoad(value)
    case 'json5':
      return JSON5.parse(value)
    default:
      return JSON.parse(value)
  }
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
    } as Query

    if (langPart) {
      const [, lang] = langPart.split('.')
      part.lang = lang
    }

    return part
  }

  return { vue: false, filename }
}
