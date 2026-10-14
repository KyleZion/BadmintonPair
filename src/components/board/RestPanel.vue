<script setup>
import { computed, ref } from "vue";
import GenderMark from "@/components/common/GenderMark.vue";
import GameCount from "@/components/common/GameCount.vue";
import AppIcon from "@/components/common/AppIcon.vue";
import ToastMessage from "@/components/common/ToastMessage.vue";
import { useMedia } from "@/composables/useMedia";
import { GENDER_TEXT } from "@/utils/players";
import { useBoard } from "@/stores/board";

/**
 * 休息區（球員方塊依名字長度自動調整寬度、排不下就換行，名字不會被截斷）：
 *   手機 → 固定在分頁列上方、可以收合的抽屜
 *   桌機 → 看板右側的欄位（sticky）
 */
const board = useBoard();
const { ui, rest, selPlayer, selFrom, selRelations } = board;

// 選取提示的第二行：今天的搭檔與對手（各取前 3 位），達到 2 次的會標黃
const relTop = (list) => (list || []).slice(0, 3);

// 休息區固定在畫面下方時（寬度 < 960px），提示訊息改顯示在休息區正上方，不會擋住上方場地的按鈕
const dockToast = useMedia("(max-width: 959px)");

const filter = ref("all"); // 'all' | 'M' | 'F'
const shown = computed(() => (filter.value === "all" ? rest.value : rest.value.filter((p) => p.gender === filter.value)));
const slotSelected = computed(() => !!ui.sel && ui.sel.zone !== "rest");
const isSelected = (id) => !!ui.sel && ui.sel.zone === "rest" && ui.sel.id === id;
</script>

<template>
  <aside class="rest" :class="{ collapsed: ui.restCollapsed, drop: slotSelected }" aria-labelledby="h-rest">
    <ToastMessage v-if="dockToast" docked />
    <div class="head">
      <h2 id="h-rest">休息區</h2>
      <span class="pill num">{{ rest.length }}</span>
      <span class="grow"></span>
      <div class="seg small" role="group" aria-label="篩選性別">
        <button type="button" class="all" :aria-pressed="filter === 'all'" @click="filter = 'all'">全部</button>
        <button type="button" class="m" :aria-pressed="filter === 'M'" @click="filter = 'M'">男</button>
        <button type="button" class="f" :aria-pressed="filter === 'F'" @click="filter = 'F'">女</button>
      </div>
      <button
        type="button"
        class="toggle"
        :aria-expanded="!ui.restCollapsed"
        :aria-label="ui.restCollapsed ? '展開休息區' : '收起休息區'"
        @click="ui.restCollapsed = !ui.restCollapsed"
      >
        <AppIcon name="down" :stroke="2.2" />
      </button>
    </div>

    <!-- 選取提示：放在休息區裡（固定在畫面下方），不會把場地往下推 -->
    <div v-if="ui.sel && selPlayer" class="selstrip" role="status">
      <span class="who">已選 <b>{{ selPlayer.name }}</b><span class="from">（{{ selFrom }}）</span></span>
      <button v-if="ui.sel.zone === 'rest'" type="button" class="sbtn" @click="board.placeSelectedNext">放入空位</button>
      <button v-else type="button" class="sbtn" @click="board.sendSelectedToRest">放回休息區</button>
      <button type="button" class="sbtn plain" @click="board.clearSelection">取消</button>
      <div v-if="selRelations" class="rel">
        <template v-if="selRelations.partners.length || selRelations.opponents.length">
          <span v-if="selRelations.partners.length">
            今天搭檔：<template v-for="(r, i) in relTop(selRelations.partners)" :key="'p' + r.id"><span v-if="i">、</span><span :class="{ hot: r.count >= 2 }">{{ r.name }} <span class="num">{{ r.count }}</span></span></template>
          </span>
          <span v-if="selRelations.opponents.length">
            對手：<template v-for="(r, i) in relTop(selRelations.opponents)" :key="'o' + r.id"><span v-if="i">、</span><span :class="{ hot: r.count >= 2 }">{{ r.name }} <span class="num">{{ r.count }}</span></span></template>
          </span>
        </template>
        <span v-else>今天還沒上過場</span>
      </div>
    </div>

    <div class="body">
      <div v-if="shown.length" class="chips">
        <button
          v-for="p in shown"
          :key="p.id"
          type="button"
          class="chip"
          :class="{ selected: isSelected(p.id) }"
          :aria-pressed="isSelected(p.id)"
          :aria-label="`休息區：${p.name}（${GENDER_TEXT[p.gender]}，已打 ${p.games || 0} 場）`"
          @click="board.tapRest(p.id)"
        >
          <GenderMark :gender="p.gender" />
          <span class="nm">{{ p.name }}</span>
          <GameCount :count="p.games || 0" />
        </button>
      </div>
      <p v-else class="none">{{ rest.length ? "這個篩選條件下沒有人。" : "所有球員都已排入場地。" }}</p>
    </div>
  </aside>
</template>

<style scoped>
.rest {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(var(--tabbar-h) + var(--safe-bottom));
  z-index: 30;
  display: flex;
  flex-direction: column;
  max-height: var(--rest-h);
  background: var(--panel);
  border-top: 1px solid var(--line);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -8px 24px var(--shadow);
}
.rest.drop {
  box-shadow: 0 -8px 24px var(--shadow), inset 0 0 0 2px var(--sel);
}
.head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 14px;
  border-bottom: 1px solid var(--line);
}
.head h2 {
  font-size: 16px;
  font-weight: 900;
}
.grow {
  flex: 1;
}
.toggle {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--mute);
}
.toggle :deep(svg) {
  transition: transform 0.2s;
}
.collapsed .toggle :deep(svg) {
  transform: rotate(180deg);
}
.collapsed .body {
  display: none;
}
.body {
  overflow-y: auto;
  padding: 8px 10px 10px;
  min-height: 0;
}
.selstrip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: var(--ink);
  color: var(--page);
  font-size: 13px;
}
.rel {
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px;
  font-size: 12px;
  opacity: 0.9;
}
.hot {
  color: var(--chipb);
  font-weight: 700;
}
.who {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.who b {
  color: var(--chipb);
}
.from {
  opacity: 0.75;
}
.sbtn {
  flex-shrink: 0;
  padding: 4px 9px;
  border-radius: 7px;
  background: var(--page);
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
}
.sbtn.plain {
  background: transparent;
  color: var(--page);
  box-shadow: inset 0 0 0 1px var(--mute);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  padding: 5px 6px 5px 5px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--page);
  font-weight: 700;
  font-size: 13px;
  text-align: left;
  min-width: 0;
  transition: box-shadow 0.2s;
}
.nm {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.chip.selected {
  box-shadow: 0 0 0 3px var(--sel);
  border-color: transparent;
}
.none {
  font-size: 13px;
  color: var(--mute);
  padding: 12px 0;
  text-align: center;
}

@media (min-width: 960px) {
  .rest {
    position: sticky;
    top: 16px;
    bottom: auto;
    max-height: calc(100vh - 32px);
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: none;
  }
  .collapsed .body {
    display: block;
  }
  .selstrip {
    border-radius: 0;
  }
  .toggle {
    display: none;
  }
}
</style>
