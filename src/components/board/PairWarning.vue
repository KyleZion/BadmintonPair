<script setup>
import { computed } from "vue";

/**
 * 場地／等待組下方的提醒：今天已經同隊或對打 2 次以上的組合。只提醒，不阻止排人。
 * compact（手機）最多顯示 2 行：最多次的同隊、最多次的對手，其他用「另 N 組」帶過。
 */
const props = defineProps({
  warn: { type: Object, default: null }, // { partners: [{names, count}], opponents: [...] }
  compact: { type: Boolean, default: false },
});

const items = computed(() => {
  if (!props.warn) return [];
  const p = props.warn.partners.map((w) => ({ kind: "同隊", text: w.names.join("·"), count: w.count }));
  const o = props.warn.opponents.map((w) => ({ kind: "對手", text: w.names.join("–"), count: w.count }));
  return [...p, ...o];
});
const shown = computed(() => {
  if (!props.compact) return items.value;
  const first = [];
  const p = items.value.find((i) => i.kind === "同隊");
  const o = items.value.find((i) => i.kind === "對手");
  if (p) first.push(p);
  if (o) first.push(o);
  return first;
});
const more = computed(() => items.value.length - shown.value.length);
const aria = computed(() => "今天重複的組合：" + items.value.map((i) => `${i.kind} ${i.text} ${i.count} 次`).join("，"));
</script>

<template>
  <div v-if="items.length" class="warn" :class="{ compact }" role="note" :aria-label="aria">
    <span v-for="(i, n) in shown" :key="n" class="item">
      <b>{{ i.kind }}</b> {{ i.text }} <span class="num">×{{ i.count }}</span>
    </span>
    <span v-if="more > 0" class="more">另 {{ more }} 組</span>
  </div>
</template>

<style scoped>
.warn {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--chipb);
  color: var(--chipbink);
  font-size: 12px;
  line-height: 1.4;
}
.warn.compact {
  flex-direction: column;
  gap: 0;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
}
.item {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
b {
  font-weight: 800;
}
.num {
  font-weight: 700;
}
.more {
  opacity: 0.8;
}
</style>
