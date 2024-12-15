<template>
  <div>
    <MasonryWall
      :items="images"
      :min-columns="1"
      :max-columns="5"
      :ssr-columns="5"
      :scroll-container="true"
      :column-width="200"
      :gap="16"
      >
      <template #default="{ item }">
          <img style="width: 100%;" :src="item" />
        </template>
    </MasonryWall>
  </div>
</template>

<script setup>
import MasonryWall from '@/components/MasonryWall.vue'

const images = [
  "https://picsum.photos/200/200",
  "https://picsum.photos/250/200",
  "https://picsum.photos/300/200",
  "https://picsum.photos/200/200",
  "https://picsum.photos/200/300",
  "https://picsum.photos/250/200",
  "https://picsum.photos/300/200",
  "https://picsum.photos/200/300",
];
</script>
