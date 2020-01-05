import { rollup } from 'rollup'
import VuePlugin from 'rollup-plugin-vue'
import JSONPlugin from '@rollup/plugin-json'
import YAMLPlugin from '@rollup/plugin-yaml'
import I18nPlugin from '../src/index'
import { pluginInline as InlinePlugin } from './utils'

async function setupRollup (options: any = {}) {
  const i18nLang = options.lang || 'json'
  const i18nLocaleMessages = options.localeMessages || `
{
  "en": {
    "hello": "hello!"
  },
  "ja": {
    "hello": "こんにちは！"
  }
}
`
  return rollup({
    input: '/entry.vue',
    plugins: [
      InlinePlugin(
        '/entry.vue',
        `
<template>
  <p>{{ $t('hello') }}</p>
</template>
<script>
export default {
  name: 'Entry'
}
</script>
<i18n lang="${i18nLang}">
${i18nLocaleMessages}
</i18n>
`
      ),
      JSONPlugin(),
      YAMLPlugin(),
      I18nPlugin(),
      VuePlugin({
        customBlocks: ['i18n']
      })
    ]
  })
    .then(bundle => bundle.generate({ format: 'es' }))
    .then(generated => generated.output[0])
}

const EXPECT_INJECT_STRING = `const options = typeof Component === 'function' ? Component.options : Component`

test('basic', async () => {
  const { code } = await setupRollup()

  expect(code).toMatchSnapshot()
  expect(code).toEqual(expect.stringContaining(EXPECT_INJECT_STRING))
})

test('yaml', async () => {
  const { code } = await setupRollup({
    lang: 'yaml',
    localeMessages: `
en:
  hello: "hello!"
ja:
  hello: "こんにちは！"
`
  })

  expect(code).toMatchSnapshot()
  expect(code).toEqual(expect.stringContaining(EXPECT_INJECT_STRING))
})
