import path from 'path'
import { rollup } from 'rollup'
import alias from '@rollup/plugin-alias'
import VuePlugin from 'rollup-plugin-vue'
import I18nPlugin from '../src/index'
import { JSDOM, VirtualConsole } from 'jsdom'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bundle(fixture: string, options = {}) {
  return rollup({
    input: path.resolve(__dirname, './fixtures/entry.js'),
    plugins: [
      alias({
        entries: {
          '~target': path.resolve(__dirname, './fixtures', fixture)
        }
      }),
      I18nPlugin(options),
      VuePlugin({
        customBlocks: ['i18n']
      })
    ],
    onwarn: () => {
      return
    }
  })
    .then(bundle => bundle.generate({ format: 'esm' }))
    .then(generated => generated.output[0])
}

export async function bundleAndRun(fixture: string, config = {}) {
  const { code } = await bundle(fixture, config)

  let dom: JSDOM | null = null
  let jsdomError
  try {
    dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
      runScripts: 'outside-only',
      virtualConsole: new VirtualConsole()
    })
    dom.window.eval(code)
  } catch (e) {
    console.error(`JSDOM error:\n${e.stack}`)
    jsdomError = e
  }

  if (!dom) {
    return Promise.reject(new Error('Cannot assigned JSDOM instance'))
  }

  const { window } = dom
  const { module, exports } = window

  return Promise.resolve({
    window,
    module,
    exports,
    code,
    jsdomError
  })
}
