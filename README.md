# :globe_with_meridians: @intlify/rollup-plugin-vue-i18n

![Test](https://github.com/intlify/rollup-plugin-vue-i18n/workflows/Test/badge.svg)
[![npm](https://img.shields.io/npm/v/@intlify/rollup-plugin-vue-i18n.svg)](https://www.npmjs.com/package/@intlify/rollup-plugin-vue-i18n)

vue-i18n rollup plugin for custom blocks

**NOTE:** :warning: This `next` branch is development branch for Vue 3! The stable version is now in [`master`](https://github.com/intlify/rollup-plugin-vue-i18n/tree/master) branch!

## Status: Alpha ![Test](https://github.com/intlify/rollup-plugin-vue-i18n/workflows/Test/badge.svg)


## :exclamation: Requirement

You need to install the follwoing:

- rollup-plugin-vue@6.0.0-beta.4

If you use rollup-plugin-vue, We recommend you should read the [docs](https://rollup-plugin-vue.vuejs.org/)


## :cd: Installation

### NPM

```sh
$ npm i --save-dev @intlify/rollup-plugin-vue-i18n@next
```

### YARN

```sh
$ yarn add -D @intlify/rollup-plugin-vue-i18n@next
```

## :rocket: Usages

the below example that `examples/composable/App.vue` have `i18n` custom block:

```vue
<template>
  <form>
    <label>{{ t('language') }}</label>
    <select v-model="locale">
      <option value="en">en</option>
      <option value="ja">ja</option>
    </select>
  </form>
  <p>{{ t('hello') }}</p>
</template>

<script>
import { useI18n } from 'vue-i18n'
export default {
  name: 'App',
  setup() {
    return { ...useI18n({
      inheritLocale: true
    }) }
  }
}
</script>

<i18n>
{
  "en": {
    "language": "Language",
    "hello": "hello, world!"
  },
  "ja": {
    "language": "言語",
    "hello": "こんにちは、世界！"
  }
}
</i18n>

```

If you would like to bundle as common library with rollup, you can configure the following for ES Module:

```js
import vue from 'rollup-plugin-vue'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import i18n from '@intlify/rollup-plugin-vue-i18n'
import path from 'path'

export default [
  {
    input: path.resolve(__dirname, `./examples/composable/main.js`),
    output: {
      file: path.resolve(__dirname, `./examples/composable/index.js`),
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

```

### Locale Messages formatting

You can be used by specifying the following format in the `lang` attribute:

- json (default)
- yaml
- json5

example `yaml` foramt:

```vue
<i18n lang="yaml">
en:
  hello: "Hello World!"
ja:
  hello: "こんにちは、世界！"
</i18n>
```


## :scroll: Changelog
Details changes for each release are documented in the [CHANGELOG.md](https://github.com/intlify/rollup-plugin-vue-i18n/blob/master/CHANGELOG.md).


## :exclamation: Issues
Please make sure to read the [Issue Reporting Checklist](https://github.com/inlitify/rollup-plugin-vue-i18n/blob/master/.github/CONTRIBUTING.md#issue-reporting-guidelines) before opening an issue. Issues not conforming to the guidelines may be closed immediately.


## :copyright: License

[MIT](http://opensource.org/licenses/MIT)
