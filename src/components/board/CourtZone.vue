<script setup>
/** 一個區域（上場區 / 等待區）：標題列 + 球場清單，每面球場的內容由父層透過具名 slot「court」提供 */
defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  filled: { type: Number, required: true },
  capacity: { type: Number, required: true },
  count: { type: Number, required: true }, // 幾面場地
});
</script>

<template>
  <section class="zone" :aria-labelledby="id">
    <div class="zone-head">
      <h2 :id="id">{{ title }}</h2>
      <span class="sub"><b class="num">{{ filled }}</b> / {{ capacity }} 人</span>
    </div>
    <div class="list">
      <div v-for="i in count" :key="i">
        <slot name="court" :index="i - 1" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.zone {
  margin-bottom: 26px;
}
.zone-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 6px;
  margin-bottom: 12px;
}
.zone-head h2 {
  font-size: 20px;
  font-weight: 900;
}
.zone-head b {
  color: var(--ink);
}
.list {
  display: grid;
  gap: 16px;
}
@media (min-width: 640px) {
  .list {
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  }
}
</style>
