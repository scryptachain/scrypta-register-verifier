<template>
  <div class="home">
    <Reader />
  </div>
</template>

<script>
import Reader from '@/components/Reader.vue'

export default {
  name: 'Home',
  components: {
    Reader
  }
}
</script>
<style>
  .home{
    padding: 20px;
  }
</style> 