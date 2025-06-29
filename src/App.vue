<script setup lang="ts">
import { getUserInfo } from './service/request/index'
</script>

<template>
  <div></div>
  <button
    @click="getUserInfo"
    class="btn">
    获取信息
  </button>
</template>

<style scoped>
.btn {
  width: 200px;
  height: 200px;
  background-color: blue;
}
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
