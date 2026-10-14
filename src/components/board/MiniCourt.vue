<script setup>
import { computed } from "vue";
import PlayerSlot from "./PlayerSlot.vue";
import PairWarning from "./PairWarning.vue";
import { teamType } from "@/utils/players";
import { useBoard } from "@/stores/board";

/**
 * 手機用的迷你球場：不畫完整球場線，只保留外框與中間的網子。
 * A 組在左、B 組在右，每組上下兩人；操作按鈕由父層透過預設 slot 傳入。
 */
const props = defineProps({
  zone: { type: String, required: true }, // 'live' | 'wait'
  index: { type: Number, required: true },
  title: { type: String, required: true },
});

const board = useBoard();
const court = computed(() => board.state[props.zone][props.index]);

const meta = computed(() => {
  const ids = court.value;
  const n = ids.filter(Boolean).length;
  if (n < 4) return `${n}/4`;
  const byId = board.byId.value;
  const short = (t) => t.slice(0, 1); // 混雙 → 混
  return `${short(teamType(ids.slice(0, 2), byId))}vs${short(teamType(ids.slice(2, 4), byId))}`;
});
// 上場場地正在計時時，標題列顯示計時取代人數／組別
const timer = computed(() => (props.zone === "live" ? board.timerText.value[props.index] || "" : ""));
const keyOf = (s) => `${props.zone}-${props.index}-${s}`;
const playerAt = (s) => (court.value[s] ? board.byId.value[court.value[s]] || null : null);
</script>

<template>
  <article class="mini" :class="zone">
    <header class="head">
      <span class="name">{{ title }}</span>
      <span v-if="timer" class="timer num" role="timer" :aria-label="`${title} 已開打 ${timer}`">{{ timer }}</span>
      <span class="meta num">{{ timer ? "" : meta }}</span>
      <span class="actions"><slot /></span>
    </header>
    <div class="court">
      <div v-for="side in [[0, 1], [2, 3]]" :key="side[0]" class="side">
        <PlayerSlot
          v-for="s in side"
          :key="s"
          compact
          :player="playerAt(s)"
          :team="s < 2 ? 'a' : 'b'"
          :label="`${title} ${s < 2 ? 'A' : 'B'} 組`"
          :selected="board.selKey.value === keyOf(s)"
          :targetable="!!board.ui.sel"
          @tap="board.tapSlot(zone, index, s)"
        />
      </div>
    </div>
    <PairWarning :warn="board.pairWarnings.value[`${zone}-${index}`]" compact />
  </article>
</template>

<style scoped>
.mini {
  min-width: 0;
  border-radius: 10px;
  padding: 4px 4px 5px;
  background: var(--court);
  color: var(--courtink);
}
.mini.wait {
  background: var(--courtwait);
}
.head {
  display: flex;
  align-items: center;
  gap: 3px;
  min-height: 24px;
  padding: 0 2px 2px 4px;
}
.name {
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}
.meta {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  opacity: 0.85;
}
.timer {
  flex-shrink: 0;
  padding: 0 4px;
  border-radius: 99px;
  background: var(--courtink);
  color: var(--court);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 18px;
}
.actions {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}
/* 外框 + 中間虛線（網子） */
.court {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  padding: 3px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px var(--courtline);
}
.court::after {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 50%;
  border-left: 2px dashed var(--courtline);
  transform: translateX(-1px);
  pointer-events: none;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
</style>
