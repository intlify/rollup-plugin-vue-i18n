# :globe_with_meridians: @intlify/rollup-plugin-vue-i18n

![Test](https://github.com/intlify/rollup-plugin-vue-i18n/workflows/Test/badge.svg)
[![npm](https://img.shields.io/npm/v/@intlify/rollup-plugin-vue-i18n/next.svg)](https://www.npmjs.com/package/@intlify/rollup-plugin-vue-i18n)
[![npm](https://img.shields.io/npm/v/@intlify/rollup-plugin-vue-i18n.svg)](https://www.npmjs.com/package/@intlify/rollup-plugin-vue-i18n)

vue-i18n rollup plugin for i18n resource pre-compilation and custom blocks

**NOTE:** :warning: This `next` branch is development branch for Vue 3! The version for Vue 2 is now in [`master`](https://github.com/intlify/rollup-plugin-vue-i18n/tree/master) branch!


## :exclamation: Requirement

You need to install the follwoing:

- rollup-plugin-vue@6.0.0-beta.4

If you use rollup-plugin-vue, We recommend you should read the [docs](https://rollup-plugin-vue.vuejs.org/)


## :star: Features
- i18n resources pre-compilation
- i18n custom block


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

### i18n resource pre-compilation

Since vue-i18n@v9.0, The locale messages are handled with message compiler, which converts them to javascript functions after compiling. After compiling, message compiler converts them into javascript functions, which can improve the performance of the application.

However, with the message compiler, the javascript function conversion will not work in some environments (e.g. CSP). For this reason, vue-i18n@v9.0 and later offer a full version that includes compiler and runtime, and a runtime only version.

If you are using the runtime version, you will need to compile before importing locale messages by managing them in a file such as `.json`.

#### Rollup Config

The below rollup configi example:

```js
import VuePlugin from 'rollup-plugin-vue'
import VueI18nPlugin from '@intlify/rollup-plugin-vue-i18n'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import path from 'path'

export default [
  {
    input: path.resolve(__dirname, `./path/to/src/main.js`),
    output: {
      file: path.resolve(__dirname, `./path/to/dist/index.js`),
      format: 'cjs'
    },
    plugins: [
      // set `customBlocks` opton to `rollup-plugin-vue`
      VuePlugin({ customBlocks: ['i18n'] }),
      // set `rollup-plugin-vue-i18n` after **`rollup-plugin-vue`**
      VueI18nPlugin({
        // `include` option for i18n resources bundling
        include: path.resolve(__dirname, `./path/to/src/locales/**`)
      }),
      resolve(),
      commonjs()
    ]
  }
]
```

#### Notes on using with other i18n resource loading plugins

If you use the plugin like `@rollup/plugin-json`, make sure that the i18n resource to be pre-compiled with `rollup-plugin-vue-i18n` is not loaded. you need to filter with the plugin options.


### `i18n` custom block

the below example that `examples/composition/App.vue` have `i18n` custom block:

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
  <Banana />
</template>

<script>
import { useI18n } from 'vue-i18n'
import Banana from './Banana.vue'

export default {
  name: 'App',
  components: {
    Banana
  },
  setup() {
    const { t, locale } = useI18n({
      inheritLocale: true,
      useScope: 'local'
    })
    return { t, locale }
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

## :wrench: Options

### `include`

- **Type:** `string | string[] | undefined`
- **Default:** `undefined`

  A [minimatch](https://github.com/isaacs/minimatch) pattern, or array of patterns, you can specify a path to pre-compile i18n resources files. The extensions of i18n resources to be precompiled are as follows:

  ```
  - json
  - json5
  - yaml
  - yml
  ```


### `forceStringify`

- **Type:** `boolean`
- **Default:** `false`

  Whether pre-compile number and boolean values as message functions that return the string value.

  for example, the following json resources:

  ```json
  {
    "trueValue": true,
    "falseValue": false,
    "nullValue": null,
    "numberValue": 1
  }
  ```

  after pre-compiled (development):

  ```js
  export default {
    "trueValue": (()=>{const fn=(ctx) => {const { normalize: _normalize } = ctx;return _normalize(["true"])};fn.source="true";return fn;})(),
    "falseValue": (()=>{const fn=(ctx) => {const { normalize: _normalize } = ctx;return _normalize(["false"])};fn.source="false";return fn;})(),
    "nullValue": (()=>{const fn=(ctx) => {const { normalize: _normalize } = ctx;return _normalize(["null"])};fn.source="null";return fn;})(),
    "numberValue": (()=>{const fn=(ctx) => {const { normalize: _normalize } = ctx;return _normalize(["1"])};fn.source="1";return fn;})()
  }
  ```

  Configration example:

  ```ts
  import VuePlugin from 'rollup-plugin-vue'
  import VueI18nPlugin from 'rollup-plugin-vue-i18n'
  import resolve from '@rollup/plugin-node-resolve'
  import commonjs from '@rollup/plugin-commonjs'
  import path from 'path'

  export default [
    {
      input: path.resolve(__dirname, `./src/main.js`),
      output: {
        file: path.resolve(__dirname, `./dist/index.js`),
        format: 'cjs'
      },
      plugins: [
        VuePlugin({ customBlocks: ['i18n'] }),
        VueI18nPlugin({
          include: path.resolve(__dirname, `./path/to/src/locales/**`)
          // `forceStringify` option
          forceStringify: true
        }),
        resolve(),
        commonjs()
      ]
    }
  ]
  ```

## :scroll: Changelog
Details changes for each release are documented in the [CHANGELOG.md](https://github.com/intlify/rollup-plugin-vue-i18n/blob/master/CHANGELOG.md).


## :exclamation: Issues
Please make sure to read the [Issue Reporting Checklist](https://github.com/inlitify/rollup-plugin-vue-i18n/blob/master/.github/CONTRIBUTING.md#issue-reporting-guidelines) before opening an issue. Issues not conforming to the guidelines may be closed immediately.


## :copyright: License

[MIT](http://opensource.org/licenses/MIT)
