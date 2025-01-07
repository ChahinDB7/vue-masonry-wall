import { defineNuxtPlugin } from '#app'
import MasonryWall from '../src/components/MasonryWall.vue' // Adjust the path based on your project structure

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('MasonryWall', MasonryWall)
})
