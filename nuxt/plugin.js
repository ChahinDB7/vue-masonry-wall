import { defineNuxtPlugin } from '#app'
import MasonryWall from '../src/components/MasonryWall.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('MasonryWall', MasonryWall)
})
