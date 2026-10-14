<script setup>
import MiniCourt from "./MiniCourt.vue";
import AppIcon from "@/components/common/AppIcon.vue";
import { isEmptyCourt } from "@/utils/board";
import { useBoard } from "@/stores/board";

/**
 * 手機精簡看板：一列一面場地，左邊「上場」、右邊對應的「等待」組。
 * 同一列就看得到這面場地現在誰在打、下一組是誰，4 面場地可以放進一個畫面。
 */
const board = useBoard();
const { state, liveCount, waitCount, hasEmptyLive } = board;

const hasAny = (court) => court.some(Boolean);
const canPromote = (i) => hasAny(state.wait[i]) && (isEmptyCourt(state.live[i]) || hasEmptyLive.value);
</script>

<template>
  <section class="compact" aria-label="上場區與等待區">
    <div class="cols">
      <h2>上場區 <span class="num">{{ liveCount }}/{{ state.courtCount * 4 }}</span></h2>
      <h2>等待區 <span class="num">{{ waitCount }}/{{ state.courtCount * 4 }}</span></h2>
    </div>

    <div class="rows">
      <div v-for="(_, i) in state.live" :key="i" class="row">
        <MiniCourt zone="live" :index="i" :title="`場地 ${i + 1}`">
          <button
            type="button"
            class="act go"
            :disabled="!hasAny(state.live[i])"
            :aria-label="`結束場地 ${i + 1}，球員回休息區`"
            @click="board.finishLive(i)"
          >
            結束
          </button>
        </MiniCourt>

        <MiniCourt zone="wait" :index="i" :title="`等待 ${i + 1}`">
          <button
            type="button"
            class="act icon"
            :disabled="!hasAny(state.wait[i])"
            :aria-label="`清空等待 ${i + 1}`"
            @click="board.clearWait(i)"
          >
            <AppIcon name="x" :size="12" :stroke="2.6" />
          </button>
          <button
            type="button"
            class="act go"
            :disabled="!canPromote(i)"
            :aria-label="`等待 ${i + 1} 上場`"
            @click="board.promote(i)"
          >
            上場
          </button>
        </MiniCourt>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cols,
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px;
}
.cols {
  margin-bottom: 6px;
}
.cols h2 {
  font-size: 15px;
  font-weight: 900;
}
.cols .num {
  font-size: 12px;
  font-weight: 600;
  color: var(--mute);
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.act {
  display: inline-grid;
  place-items: center;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}
.act.go {
  background: var(--chipa);
  color: var(--chipaink);
}
.act.icon {
  width: 22px;
  padding: 0;
  color: var(--courtink);
  box-shadow: inset 0 0 0 1px var(--courtline);
}
</style>
