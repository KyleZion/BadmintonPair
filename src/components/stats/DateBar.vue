<script setup>
import { computed } from "vue";
import { useBoard } from "@/stores/board";

/**
 * 統計分頁最上方的日期列：今天 · 最近 2 次 · 歷史 · 全部
 * 更早的日子放在「歷史」裡；從歷史點進去的日子，「歷史」會維持選取狀態。
 */
const board = useBoard();
const { state, ui, days } = board;

const RECENT = 2;
const recent = computed(() => days.value.slice(0, RECENT));
const isRecent = (id) => recent.value.some((d) => d.id === id);
const historyOn = computed(
  () => ui.statsView === "history" || (board.viewedDay.value && !isRecent(ui.statsView))
);
</script>

<template>
  <nav class="dates" aria-label="選擇日期">
    <button type="button" class="date" :aria-pressed="ui.statsView === 'today'" @click="ui.statsView = 'today'">
      今天<small><span class="num">{{ state.matches.length }}</span> 場</small>
    </button>
    <button
      v-for="d in recent"
      :key="d.id"
      type="button"
      class="date"
      :aria-pressed="ui.statsView === d.id"
      @click="ui.statsView = d.id"
    >
      <span class="num">{{ d.label.short }}</span><small>{{ d.label.week }}</small>
    </button>
    <button type="button" class="date" :aria-pressed="historyOn" @click="ui.statsView = 'history'">
      歷史<small><span class="num">{{ days.length }}</span> 天</small>
    </button>
    <button type="button" class="date" :aria-pressed="ui.statsView === 'all'" @click="ui.statsView = 'all'">
      全部<small>累計</small>
    </button>
  </nav>
</template>

<style scoped>
.dates {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  margin-inline: -16px;
  padding: 2px 16px 4px;
  scrollbar-width: none;
}
.dates::-webkit-scrollbar {
  display: none;
}
.date {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 58px;
  padding: 6px 10px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--panel);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}
.date small {
  font-size: 11px;
  font-weight: 500;
  color: var(--mute);
}
.date[aria-pressed="true"] {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--page);
}
.date[aria-pressed="true"] small {
  color: var(--page);
  opacity: 0.75;
}
@media (min-width: 720px) {
  .dates {
    margin-inline: 0;
    padding-inline: 0;
  }
  .date {
    flex: 0 0 auto;
  }
}
</style>
