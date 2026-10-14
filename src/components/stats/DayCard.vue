<script setup>
import { formatElapsed } from "@/utils/timer";

/** 歷史清單裡的一天：日期方塊 + 場數、人數、平均時間 */
defineProps({
  day: { type: Object, required: true }, // useBoard().days 的一筆（含 label、summary）
});
defineEmits(["open"]);
</script>

<template>
  <li>
    <button type="button" class="day" @click="$emit('open')">
      <span class="d" aria-hidden="true">
        <b class="num">{{ day.label.day }}</b>
        <small>{{ day.label.week }}</small>
      </span>
      <span class="info">
        <span class="t">{{ day.label.long }}</span>
        <span class="s">
          <b class="num">{{ day.summary.count }}</b> 場 · <b class="num">{{ day.summary.players }}</b> 人 · 平均
          <b class="num">{{ formatElapsed(day.summary.avgMs) }}</b>
        </span>
      </span>
      <span class="go" aria-hidden="true">›</span>
    </button>
  </li>
</template>

<style scoped>
li {
  list-style: none;
}
.day {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--panel);
  text-align: left;
}
.day:hover {
  border-color: var(--brand);
}
.d {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--court);
  color: var(--courtink);
  line-height: 1.1;
}
.d b {
  font-size: 19px;
  font-weight: 800;
}
.d small {
  font-size: 11px;
  opacity: 0.85;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.t {
  font-weight: 900;
  font-size: 15px;
}
.s {
  font-size: 12px;
  color: var(--mute);
}
.s b {
  color: var(--ink);
}
.go {
  font-size: 22px;
  color: var(--mute);
}
</style>
