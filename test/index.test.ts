import { bundleAndRun } from './utils'

test('basic', async () => {
  const { module, code } = await bundleAndRun('basic.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello world!'
      }
    }
  ])
})

test('yaml', async () => {
  const { module, code } = await bundleAndRun('yaml.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello world!'
      }
    }
  ])
})

test('json5', async () => {
  const { module, code } = await bundleAndRun('json5.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello world!'
      }
    }
  ])
})

test('import', async () => {
  const { module, code } = await bundleAndRun('import.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello world!'
      }
    }
  ])
})

test('multiple', async () => {
  const { module, code } = await bundleAndRun('multiple.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello world!'
      }
    },
    {
      ja: {
        hello: 'こんにちは、世界！'
      }
    }
  ])
})

test('locale', async () => {
  const { module, code } = await bundleAndRun('locale.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      ja: {
        hello: 'こんにちは、世界！'
      }
    }
  ])
})

test('locale attr and basic', async () => {
  const { module, code } = await bundleAndRun('locale-mix.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello world!'
      }
    },
    {
      ja: {
        hello: 'こんにちは、世界！'
      }
    }
  ])
})

test('locale attr and import', async () => {
  const { module, code } = await bundleAndRun('locale-import.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello world!'
      }
    }
  ])
})

test('special characters', async () => {
  const { module, code } = await bundleAndRun('special-char.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18n).toMatchObject([
    {
      en: {
        hello: 'hello\ngreat\t"world"'
      }
    }
  ])
})

test('global', async () => {
  const { module, code } = await bundleAndRun('global-mix.vue')
  expect(code).toMatchSnapshot('code')
  expect(module.__i18nGlobal).toMatchObject([
    {
      en: {
        hello: 'hello global!'
      }
    }
  ])
  expect(module.__i18n).toMatchObject([
    {
      ja: {
        hello: 'hello local!'
      }
    }
  ])
})
