import { rollup } from 'rollup'
import VuePlugin from 'rollup-plugin-vue'
import JSONPlugin from '@rollup/plugin-json'
import I18nPlugin from '../src/index'
import { pluginInline } from './utils'

async function setupRollup () {
  return rollup({
    input: '/entry.vue',
    plugins: [
      pluginInline(
        '/entry.vue',
        `
      <template>
      <div>Hello, world</div>
      </template>
      <script>
      export default {
        name: 'Entry'
      }
      </script>
      <i18n>
      {
        "en": {
          "hello": "hello!"
        },
        "ja": {
          "hello": "こんにちは！"
        }
      }
      </i18n>
    `
      ),
      JSONPlugin(),
      I18nPlugin(),
      VuePlugin({
        customBlocks: ['i18n']
      })
    ]
  })
    .then(bundle => bundle.generate({ format: 'es' }))
    .then(generated => generated.output[0])
}

test('basic', async () => {
  const { code } = await setupRollup()
  expect(code).toMatchSnapshot()
})
