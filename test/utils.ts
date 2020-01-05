import { Plugin } from 'rollup'

export function pluginInline (filename: string, code: string): Plugin {
  return {
    name: 'inline',
    resolveId (id: string) {
      if (id === filename) {
        return filename
      }
      return null
    },
    load (id: string) {
      if (id === filename) {
        return code
      }
      return null
    }
  }
}
