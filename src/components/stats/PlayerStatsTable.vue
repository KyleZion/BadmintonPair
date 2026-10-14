<script setup>
import { computed, ref, watch } from "vue";
import { formatElapsed, formatDuration } from "@/utils/timer";
import { formatEndTime } from "@/utils/matches";
import { sortStats } from "@/utils/stats";
import { playerRelations } from "@/utils/pairs";
import PlayerDetail from "./PlayerDetail.vue";
import { useBoard } from "@/stores/board";

/**
 * 球員統計表，三種模式：
 *   today  今天：場數、總時間、平均、休息（距離上一場結束多久，每秒更新）
 *   day    過去某一天：場數、總時間、平均、最後一場結束時刻
 *   all    全部累計：出席天數、場數、總時間、平均
 * 點欄位標題可以排序，再點一次反向。
 */
const props = defineProps({
  rows: { type: Array, required: true },
  mode: { type: String, default: "today" },
  // 點名字看搭檔與對手用：這個範圍的比賽紀錄、範圍名稱（「今天」「10/12」「全部累計」）
  matches: { type: Array, default: () => [] },
  scope: { type: String, default: "今天" },
});

const picked = ref(null); // 點開詳細資料的那一列
const relations = computed(() => (picked.value ? playerRelations(picked.value.id, props.matches, props.rows) : null));
const board = useBoard();

const LAST_COL = {
  today: { key: "rest", label: "休息", first: -1 },
  day: { key: "last", label: "最後", first: -1 },
};
const cols = computed(() => {
  const base = [{ key: "name", label: "球員", first: 1 }];
  if (props.mode === "all") base.push({ key: "days", label: "出席", first: -1 });
  base.push({ key: "games", label: "場數", first: props.mode === "today" ? 1 : -1 });
  base.push({ key: "total", label: "總時間", first: -1 }, { key: "avg", label: "平均", first: -1 });
  if (LAST_COL[props.mode]) base.push(LAST_COL[props.mode]);
  return base;
});

// 今天預設「場數少到多」，最該上場的人在最上面；過去和累計預設「場數多到少」
const sortKey = ref("games");
const sortDir = ref(props.mode === "today" ? 1 : -1);
watch(
  () => props.mode,
  (m) => {
    sortKey.value = "games";
    sortDir.value = m === "today" ? 1 : -1;
  }
);
function sortBy(col) {
  if (sortKey.value === col.key) sortDir.value = -sortDir.value;
  else {
    sortKey.value = col.key;
    sortDir.value = col.first;
  }
}
const ariaSort = (key) => (sortKey.value === key ? (sortDir.value === 1 ? "ascending" : "descending") : "none");

const sorted = computed(() => sortStats(props.rows, sortKey.value, sortDir.value, board.now.value));
const restText = (r) => {
  if (r.onCourt) return "場上";
  if (r.lastEndedAt === null) return "未上場";
  return formatElapsed(board.now.value - r.lastEndedAt);
};
const ms = (v, r) => (r.games ? formatElapsed(v) : "—");
// 累計的總時間可能超過一小時，改用 "3h05"，避免數字太長擠壞表格
const long = (v, r) => (r.games ? formatDuration(v) : "—");
</script>

<template>
  <div v-if="sorted.length" class="wrap">
    <table>
      <thead>
        <tr>
          <th v-for="col in cols" :key="col.key" :class="col.key" :aria-sort="ariaSort(col.key)" scope="col">
            <button type="button" :class="{ on: sortKey === col.key }" @click="sortBy(col)">
              {{ col.label }}<span class="arrow" aria-hidden="true">{{ sortKey === col.key ? (sortDir === 1 ? "↑" : "↓") : "" }}</span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in sorted" :key="r.id">
          <th scope="row" class="name">
            <button type="button" class="who" :class="'g-' + r.gender" :aria-label="`${r.name}：查看搭檔與對手`" @click="picked = r">
              {{ r.name }}
            </button>
          </th>
          <td v-if="mode === 'all'" class="num" :class="{ dim: !r.days }">{{ r.days }}</td>
          <td class="games num">{{ r.games }}</td>
          <td class="num" :class="{ dim: !r.games }">{{ mode === "all" ? long(r.totalMs, r) : ms(r.totalMs, r) }}</td>
          <td class="num" :class="{ dim: !r.games }">{{ ms(r.avgMs, r) }}</td>
          <td v-if="mode === 'today'" class="num" :class="{ court: r.onCourt, dim: !r.onCourt && r.lastEndedAt === null }">
            {{ restText(r) }}
          </td>
          <td v-else-if="mode === 'day'" class="num">{{ r.lastEndedAt ? formatEndTime(r.lastEndedAt, r.lastEndedAt) : "—" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="none">還沒有球員資料。</p>
  <PlayerDetail v-if="picked && relations" :row="picked" :relations="relations" :scope="scope" @close="picked = null" />
</template>

<style scoped>
.wrap {
  overflow-x: auto;
  margin: 0 -4px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  padding: 6px 3px;
  border-bottom: 1px solid var(--line);
  text-align: right;
  white-space: nowrap;
}
tbody tr:last-child th,
tbody tr:last-child td {
  border-bottom: 0;
}
thead th {
  padding-top: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--mute);
}
thead button {
  font-weight: inherit;
  padding: 4px 0;
}
thead button.on {
  color: var(--ink);
  font-weight: 700;
}
.arrow {
  display: inline-block;
  width: 0.8em;
  text-align: left;
}
/* 名字欄：性別用左側色條（跟手機版場地方塊一樣），長名字換行而不截斷 */
.name {
  text-align: left;
  width: 100%;
  white-space: normal;
  font-weight: 700;
}
.who {
  display: block;
  width: 100%;
  text-align: left;
  font-weight: inherit;
  text-decoration: underline dotted var(--line);
  text-underline-offset: 4px;
  padding-left: 7px;
  border-left: 3px solid transparent;
  overflow-wrap: anywhere;
  line-height: 1.3;
}
.g-M {
  border-left-color: var(--gm);
}
.g-F {
  border-left-color: var(--gf);
}
td.num {
  font-size: 13px;
}
.games {
  font-weight: 800;
}
.dim {
  color: var(--mute);
  font-weight: 400;
}
.court {
  color: var(--brand);
  font-weight: 700;
}
.none {
  padding: 16px 0;
  text-align: center;
  color: var(--mute);
}
</style>
