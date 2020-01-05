# :globe_with_meridians: rollup-plugin-vue-i18n

[![CircleCI](https://circleci.com/gh/intlify/rollup-plugin-vue-i18n.svg?style=svg)](https://circleci.com/gh/intlify/rollup-plugin-vue-i18n)
[![npm](https://img.shields.io/npm/v/@intlify/rollup-plugin-vue-i18n.svg)](https://www.npmjs.com/package/@intlify/rollup-plugin-vue-i18n)
[![codecov](https://codecov.io/gh/intlify/rollup-plugin-vue-i18n/branch/master/graph/badge.svg)](https://codecov.io/gh/intlify/rollup-plugin-vue-i18n)

vue-i18n rollup plugin for custom blocks


## :exclamation: Requirement

You need to install the follwoing:

- rollup-plugin-vue@5.1.4 later

If you use rollup-plugin-vue, We recommend you should read the [docs](https://rollup-plugin-vue.vuejs.org/)


## :cd: Installation

npm:
```bash
$ npm i --save-dev @rollup/plugin-json
$ npm i --save-dev @rollup/plugin-yaml # if you use locale messages with YAML format
$ npm i --save-dev @intlify/rollup-plugin-vue-i18n
```

yarn:
```bash
$ yarn add -D @rollup/plugin-json
$ yarn add -D @rollup/plugin-yaml # if you use locale messages with YAML format
$ yarn add -D @intlify/rollup-plugin-vue-i18n
```

## :rocket: Usages

the below example that `example/Hello.vue` have `i18n` custom block:

```vue
<template>
  <p>{{ $t('hello') }}</p>
</template>

<script>
export default {
  name: 'Hello'
}
</script>

<i18n>
{
  "en": {
    "hello": "Hello World!"
  },
  "ja": {
    "hello": "こんにちは、世界！"
  }
}
</i18n>
```

If you would like to bundle as common library with rollup, you can configure the following for ES Module:

```js
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
```

### Locale Messages formatting

You can be used by specifying the following format in the `lang` attribute:

- json (default)
- yaml

example `yaml` foramt:

```vue
<i18n lang="yaml">
en:
  hello: "Hello World!"
ja:
  hello: "こんにちは、世界！"
</i18n>
```


## :warning: Limitations
Currently, There are the following limitations:

- Not support `json5` format 
- Not support `locale` attributes


## :scroll: Changelog
Details changes for each release are documented in the [CHANGELOG.md](https://github.com/intlify/rollup-plugin-vue-i18n/blob/master/CHANGELOG.md).


## :exclamation: Issues
Please make sure to read the [Issue Reporting Checklist](https://github.com/inlitify/rollup-plugin-vue-i18n/blob/master/.github/CONTRIBUTING.md#issue-reporting-guidelines) before opening an issue. Issues not conforming to the guidelines may be closed immediately.


## :copyright: License

[MIT](http://opensource.org/licenses/MIT)
