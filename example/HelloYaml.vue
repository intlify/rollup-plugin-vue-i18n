<template>
  <p>{{ $t('hello') }}</p>
</template>

<script>
export default {
  name: 'HelloYaml'
}
</script>

<i18n lang="yaml">
en:
  hello: "Hello World!"
ja:
  hello: "こんにちは、世界！"
</i18n>
