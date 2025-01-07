import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@chahindb7/vue-masonry-wall',
    configKey: '@chahindb7/vue-masonry-wall',
    compatibility: {
      nuxt: '>=3.0.0'
    }
  }, 
  defaults: {},
  setup() {
    const { resolve } = createResolver(import.meta.url)

    addPlugin(resolve('./plugin.js'))
  }
})