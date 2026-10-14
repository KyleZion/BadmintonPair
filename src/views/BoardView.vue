<script setup>
import CourtZone from "@/components/board/CourtZone.vue";
import CourtCard from "@/components/board/CourtCard.vue";
import CompactBoard from "@/components/board/CompactBoard.vue";
import RestPanel from "@/components/board/RestPanel.vue";
import { useBoard } from "@/stores/board";
import { useConfirm } from "@/composables/useConfirm";
import { useMedia } from "@/composables/useMedia";
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

const board = useBoard();
const { state, ui, liveCount, waitCount, hasEmptyLive } = board;
const { confirmTwice, isPending } = useConfirm();

// 手機直式：上場與等待並排的精簡看板；平板以上：完整球場
const compact = useMedia("(max-width: 719px)");

/**
 * 手機版休息區的高度 = 畫面剩下的空間（場地下方到分頁列之間），
 * 讓所有場地與休息區盡量同時出現在一個畫面；最少 140px、最多半個畫面。
 */
const boardEl = ref(null);
const boardBottom = ref(0);
let ro = null;
const measure = () => {
  if (boardEl.value) boardBottom.value = Math.round(boardEl.value.getBoundingClientRect().bottom + window.scrollY);
};
onMounted(() => {
  if (typeof ResizeObserver === "undefined") return;
  ro = new ResizeObserver(measure);
  watch(boardEl, (el, old) => {
    if (old) ro.unobserve(old);
    if (el) ro.observe(el);
  }, { immediate: true });
});
onBeforeUnmount(() => ro && ro.disconnect());
const pageStyle = computed(() =>
  compact.value && boardBottom.value
    ? { "--rest-h": `min(50vh, max(140px, calc(100vh - ${boardBottom.value}px - var(--tabbar-h) - var(--safe-bottom) - 8px)))` }
    : null
);

const hasAny = (court) => court.some(Boolean);
</script>

<template>
  <main class="page board-page" :class="{ 'rest-min': ui.restCollapsed, compact }" :style="pageStyle">
    <div class="wrap">
      <div>
        <div v-if="compact" ref="boardEl"><CompactBoard /></div>

        <template v-else>
          <CourtZone id="h-live" title="上場區" :filled="liveCount" :capacity="state.courtCount * 4" :count="state.courtCount">
            <template #court="{ index }">
              <CourtCard zone="live" :index="index" :title="`場地 ${index + 1}`">
                <button
                  type="button"
                  class="btn-sm go"
                  :disabled="!hasAny(state.live[index])"
                  :aria-label="`結束場地 ${index + 1}，球員回休息區`"
                  @click="board.finishLive(index)"
                >
                  結束
                </button>
              </CourtCard>
            </template>
          </CourtZone>

          <CourtZone id="h-wait" title="等待區" :filled="waitCount" :capacity="state.courtCount * 4" :count="state.courtCount">
            <template #court="{ index }">
              <CourtCard zone="wait" :index="index" :title="`等待 ${index + 1}`">
                <button type="button" class="btn-sm clear" :disabled="!hasAny(state.wait[index])" @click="board.clearWait(index)">
                  清空
                </button>
                <button
                  type="button"
                  class="btn-sm go"
                  :disabled="!hasAny(state.wait[index]) || !hasEmptyLive"
                  :title="hasEmptyLive ? '移到空的上場場地' : '沒有空的上場場地'"
                  @click="board.promote(index)"
                >
                  上場
                </button>
              </CourtCard>
            </template>
          </CourtZone>
        </template>

        <div class="tools">
          <button
            type="button"
            class="link danger"
            :disabled="!liveCount && !waitCount"
            @click="confirmTwice('reset', board.resetBoard)"
          >
            {{ isPending("reset") ? "再點一次，全部放回休息區" : "全部放回休息區" }}
          </button>
        </div>
      </div>

      <RestPanel />
    </div>
  </main>
</template>

<style scoped>
/* 手機：底部有分頁列 + 休息區抽屜，內容要留出空間才捲得到最下面 */
.board-page {
  padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + var(--rest-h) + 24px);
}
.board-page.rest-min {
  padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 80px);
}
.board-page.compact {
  padding-inline: 10px;
  padding-top: 10px;
}
.go {
  background: var(--brand);
  color: var(--brandink);
}
.clear {
  border: 1px solid var(--line);
  background: var(--panel);
}
.tools {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

@media (min-width: 960px) {
  .board-page,
  .board-page.rest-min {
    padding-block: 24px 48px;
  }
  .wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 24px;
    align-items: start;
  }
}
</style>
