<script setup>
import { computed } from "vue";
import { useBoard } from "@/stores/board";
import { useConfirm } from "@/composables/useConfirm";

/**
 * 「開始新的一天」按鈕：今天的比賽紀錄存到歷史、已打場次歸零、所有人回休息區。
 * 第一次點會說明會清掉什麼，3.5 秒內再點一次才執行。今天還沒有任何資料時按鈕停用。
 */
defineProps({
  block: { type: Boolean, default: false }, // 撐滿整行（名單分頁用）
});
const board = useBoard();
const { state, dayHasData } = board;
const { confirmTwice, isPending } = useConfirm();

const pending = computed(() => isPending("newDay"));
const detail = computed(() => {
  const parts = [];
  if (state.matches.length) parts.push(`今天 ${state.matches.length} 場存到歷史`);
  parts.push("場次歸零", "所有人回休息區");
  return parts.join("、");
});
</script>

<template>
  <button
    type="button"
    class="newday"
    :class="{ pending, block }"
    :disabled="!dayHasData"
    @click="confirmTwice('newDay', board.startNewDay)"
  >
    <template v-if="pending">再點一次確認：{{ detail }}</template>
    <template v-else>開始新的一天</template>
  </button>
</template>

<style scoped>
.newday {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  font-size: 14px;
  font-weight: 700;
  text-wrap: balance;
}
.newday.block {
  width: 100%;
}
.newday.pending {
  border-color: transparent;
  background: var(--warn);
  color: var(--panel);
}
</style>
