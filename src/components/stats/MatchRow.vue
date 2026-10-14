<script setup>
import { computed } from "vue";
import { formatElapsed } from "@/utils/timer";
import { formatEndTime, pairType } from "@/utils/matches";
import AppIcon from "@/components/common/AppIcon.vue";

/** 一筆已結束的比賽：#編號 · 場地 · 結束時刻 · 比賽時間，下一行是 A、B vs C、D */
const props = defineProps({
  match: { type: Object, required: true },
  no: { type: Number, required: true }, // 第幾場（從 1 開始，最早的是 1）
  confirming: { type: Boolean, default: false }, // 刪除按鈕是否在「再點一次確認」狀態
  readonly: { type: Boolean, default: false }, // 過去的日子：不能刪除
});
defineEmits(["delete"]);

const teamA = computed(() => props.match.players.slice(0, 2));
const teamB = computed(() => props.match.players.slice(2, 4));
const names = (pair) => pair.map((p) => p.name).join("、");
const aria = computed(
  () =>
    `第 ${props.no} 場，場地 ${props.match.court}，${names(teamA.value)} 對 ${names(teamB.value)}，比賽時間 ${formatElapsed(props.match.duration)}`
);
</script>

<template>
  <li class="row" :aria-label="aria">
    <div class="meta">
      <span class="no num">#{{ no }}</span>
      <span>場地 {{ match.court }}</span>
      <span class="when">{{ formatEndTime(match.endedAt) }} 結束</span>
      <span class="dur num">{{ formatElapsed(match.duration) }}</span>
      <button
        v-if="!readonly"
        type="button"
        class="del"
        :class="{ confirming }"
        :aria-label="confirming ? `再點一次，刪除第 ${no} 場紀錄` : `刪除第 ${no} 場紀錄`"
        @click="$emit('delete')"
      >
        <template v-if="confirming">確定刪除？</template>
        <AppIcon v-else name="x" :size="14" :stroke="2.4" />
      </button>
    </div>
    <div class="teams">
      <span class="team">
        <span class="names">{{ names(teamA) }}</span>
        <span class="tag">{{ pairType(teamA) }}</span>
      </span>
      <span class="vs">vs</span>
      <span class="team">
        <span class="names">{{ names(teamB) }}</span>
        <span class="tag">{{ pairType(teamB) }}</span>
      </span>
    </div>
  </li>
</template>

<style scoped>
.row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.row:last-child {
  border-bottom: 0;
}
.meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
  color: var(--mute);
}
.no {
  font-weight: 800;
  color: var(--ink);
}
.when {
  flex: 1;
  min-width: 0;
}
.dur {
  padding: 1px 8px;
  border-radius: 99px;
  background: var(--court);
  color: var(--courtink);
  font-size: 13px;
  font-weight: 700;
}
.del {
  display: inline-grid;
  place-items: center;
  align-self: center;
  min-width: 26px;
  height: 26px;
  margin-left: -2px;
  border-radius: 7px;
  color: var(--mute);
}
.del:hover {
  background: var(--soft);
  color: var(--warn);
}
.del.confirming {
  padding: 0 8px;
  background: var(--warn);
  color: var(--panel);
  font-size: 12px;
  font-weight: 700;
}
.teams {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 8px;
  row-gap: 2px;
  font-size: 15px;
  font-weight: 700;
}
.team {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
}
.names {
  overflow-wrap: anywhere;
}
.tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--mute);
}
.vs {
  font-family: var(--font-num);
  font-size: 12px;
  font-weight: 700;
  color: var(--brand);
}
</style>
