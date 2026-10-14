<script setup>
import { computed } from "vue";
import PlayerStatsTable from "./PlayerStatsTable.vue";
import KpiRow from "./KpiRow.vue";
import { formatDuration } from "@/utils/timer";
import { useBoard } from "@/stores/board";

/** 全部累計：保留中的日子加上今天，多一欄「出席天數」 */
const board = useBoard();
const allMatches = computed(() => board.state.matches.concat(...board.state.days.map((d) => d.matches)));
const kpis = computed(() => {
  const s = board.allSummary.value;
  return [
    { label: "天", value: s.days },
    { label: "場", value: s.count },
    { label: "人", value: s.players },
    { label: "總時數", value: formatDuration(s.totalMs) },
  ];
});
</script>

<template>
  <section class="card" aria-labelledby="h-all">
    <div class="card-head">
      <h2 id="h-all">全部累計</h2>
      <span class="sub">最近 {{ board.KEEP_DAYS }} 天＋今天</span>
    </div>
    <KpiRow :items="kpis" />
    <PlayerStatsTable :rows="board.allStats.value" mode="all" :matches="allMatches" scope="全部累計" />
    <p class="hint">點名字看搭檔與對手。「出席」是有上場的天數。超過 {{ board.KEEP_DAYS }} 天的日子會自動刪除，不列入累計。</p>
  </section>
</template>
