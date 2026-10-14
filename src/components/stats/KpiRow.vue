<script setup>
/** 一排摘要數字，例如「18 場 · 14 人 · 3h24 總時數 · 11:20 平均」 */
defineProps({
  items: { type: Array, required: true }, // [{ value, label }]
});
</script>

<template>
  <dl class="kpis">
    <div v-for="k in items" :key="k.label" class="kpi">
      <dt>{{ k.label }}</dt>
      <dd class="num">{{ k.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin: 0 0 12px;
}
.kpi {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  padding: 8px 4px;
  border-radius: 10px;
  background: var(--soft);
}
dt {
  font-size: 11px;
  color: var(--mute);
}
dd {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  white-space: nowrap;
}
</style>
