<script setup>
import { computed } from "vue";
import MatchRow from "./MatchRow.vue";
import PlayerStatsTable from "./PlayerStatsTable.vue";
import KpiRow from "./KpiRow.vue";
import { formatElapsed, formatDuration } from "@/utils/timer";
import { useBoard } from "@/stores/board";
import { useConfirm } from "@/composables/useConfirm";

/** 過去某一天（唯讀）：摘要數字 + 比賽紀錄／球員統計；底部可以刪除這一天 */
const props = defineProps({
  day: { type: Object, required: true },
  fromHistory: { type: Boolean, default: false }, // 從歷史清單點進來的，顯示「‹ 歷史」返回
});
const board = useBoard();
const { ui } = board;
const { confirmTwice, isPending } = useConfirm();

const kpis = computed(() => {
  const s = props.day.summary;
  return [
    { label: "場", value: s.count },
    { label: "人", value: s.players },
    { label: "總時數", value: formatDuration(s.totalMs) },
    { label: "平均", value: formatElapsed(s.avgMs) },
  ];
});
</script>

<template>
  <section class="card" aria-labelledby="h-day">
    <button v-if="fromHistory" type="button" class="back" @click="ui.statsView = 'history'">‹ 歷史</button>
    <div class="card-head">
      <h2 id="h-day">{{ day.label.long }}</h2>
      <span class="sub">唯讀</span>
    </div>
    <KpiRow :items="kpis" />

    <div class="subtabs" role="tablist" aria-label="這一天的內容">
      <button type="button" role="tab" :aria-selected="ui.statsTab === 'matches'" @click="ui.statsTab = 'matches'">比賽紀錄</button>
      <button type="button" role="tab" :aria-selected="ui.statsTab === 'players'" @click="ui.statsTab = 'players'">球員統計</button>
    </div>

    <ol v-if="ui.statsTab === 'matches'" class="list">
      <MatchRow v-for="(m, i) in day.matches" :key="m.id" :match="m" :no="day.matches.length - i" readonly />
    </ol>
    <PlayerStatsTable v-else :rows="board.dayStats.value" mode="day" :matches="day.matches" :scope="day.label.short" />

    <div class="foot">
      <span class="sub">名單上已刪除的人也會列出。</span>
      <button type="button" class="link danger" @click="confirmTwice('delDay-' + day.id, () => board.deleteDay(day.id))">
        {{ isPending("delDay-" + day.id) ? "再點一次，刪除這一天" : "刪除這一天" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.back {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--brand);
}
.subtabs {
  margin-bottom: 4px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
</style>
