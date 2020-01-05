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
