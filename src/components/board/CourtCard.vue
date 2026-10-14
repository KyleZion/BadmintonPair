<script setup>
import { computed } from "vue";
import CourtLines from "./CourtLines.vue";
import PlayerSlot from "./PlayerSlot.vue";
import PairWarning from "./PairWarning.vue";
import AppIcon from "@/components/common/AppIcon.vue";
import { teamType } from "@/utils/players";
import { useBoard } from "@/stores/board";

/**
 * 一面球場：A 組在左半場、B 組在右半場。
 * 操作按鈕（結束、上場、清空）透過預設 slot 由父層傳入。
 */
const props = defineProps({
  zone: { type: String, required: true }, // 'live' | 'wait'
  index: { type: Number, required: true }, // 第幾面（從 0 開始）
  title: { type: String, required: true },
});

const board = useBoard();
const court = computed(() => board.state[props.zone][props.index]);

// 格子順序 [A1, A2, B1, B2]；畫面上 2×2 排成：左上 A1、右上 B1、左下 A2、右下 B2
const ORDER = [0, 2, 1, 3];

const meta = computed(() => {
  const ids = court.value;
  const byId = board.byId.value;
  const a = teamType(ids.slice(0, 2), byId);
  const b = teamType(ids.slice(2, 4), byId);
  const types = [a && "A " + a, b && "B " + b].filter(Boolean).join(" · ");
  return `${ids.filter(Boolean).length}/4 人${types ? " · " + types : ""}`;
});
const timer = computed(() => (props.zone === "live" ? board.timerText.value[props.index] || "" : ""));
const keyOf = (s) => `${props.zone}-${props.index}-${s}`;
</script>

<template>
  <article>
    <header class="head">
      <div class="title">
        <span class="name">{{ title }}</span>
        <span v-if="timer" class="timer num" role="timer" :aria-label="`${title} 已開打 ${timer}`">
          <AppIcon name="clock" :size="13" :stroke="2.4" />{{ timer }}
        </span>
        <span class="meta">{{ meta }}</span>
      </div>
      <div class="actions"><slot /></div>
    </header>
    <div class="court" :class="zone">
      <CourtLines />
      <div class="grid">
        <div v-for="s in ORDER" :key="s" class="cell">
          <PlayerSlot
            :player="court[s] ? board.byId.value[court[s]] || null : null"
            :team="s < 2 ? 'a' : 'b'"
            :label="`${title} ${s < 2 ? 'A' : 'B'} 組`"
            :selected="board.selKey.value === keyOf(s)"
            :targetable="!!board.ui.sel"
            @tap="board.tapSlot(zone, index, s)"
          />
        </div>
      </div>
    </div>
    <PairWarning :warn="board.pairWarnings.value[`${zone}-${index}`]" />
  </article>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  margin-bottom: 6px;
}
.title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}
.name {
  font-weight: 900;
  font-size: 15px;
}
.meta {
  font-size: 12px;
  color: var(--mute);
}
.timer {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: center;
  padding: 1px 8px;
  border-radius: 99px;
  background: var(--court);
  color: var(--courtink);
  font-size: 13px;
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.court {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 2.4 / 1;
  border-radius: 14px;
  background: var(--court);
}
.court.wait {
  background: var(--courtwait);
}
.grid {
  position: absolute;
  inset: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px 6px;
}
</style>
