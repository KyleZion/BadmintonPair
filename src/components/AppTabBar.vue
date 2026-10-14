<script setup>
import AppIcon from "@/components/common/AppIcon.vue";
import { useBoard } from "@/stores/board";

const { state, ui } = useBoard();
</script>

<template>
  <!-- 手機：固定在底部的分頁列；桌機（≥960px）：頁首 -->
  <nav class="tabbar" aria-label="主要分頁">
    <div class="inner">
      <h1 class="brand">羽球雙打配對</h1>
      <div class="tabs">
        <button type="button" :aria-current="ui.tab === 'setup' ? 'page' : null" @click="ui.tab = 'setup'">
          <AppIcon name="users" :size="22" />
          <span class="label">名單與場地 <span class="pill num">{{ state.players.length }}</span></span>
        </button>
        <button
          type="button"
          :aria-current="ui.tab === 'board' ? 'page' : null"
          :disabled="!state.started"
          @click="ui.tab = 'board'"
        >
          <AppIcon name="court" :size="22" />
          <span class="label">配對看板</span>
        </button>
        <button type="button" :aria-current="ui.tab === 'stats' ? 'page' : null" @click="ui.tab = 'stats'">
          <AppIcon name="chart" :size="22" />
          <span class="label">統計數據 <span v-if="state.matches.length" class="pill num">{{ state.matches.length }}</span></span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 40;
  background: var(--panel);
  border-top: 1px solid var(--line);
  padding-bottom: var(--safe-bottom);
}
.brand {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  height: var(--tabbar-h);
  max-width: 560px;
  margin: 0 auto;
}
.tabs button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  color: var(--mute);
  border-top: 2px solid transparent;
}
.tabs button[aria-current="page"] {
  color: var(--brand);
  border-top-color: var(--brand);
  font-weight: 700;
}
.label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

@media (min-width: 960px) {
  .tabbar {
    position: static;
    border-top: 0;
    border-bottom: 1px solid var(--line);
    padding-bottom: 0;
  }
  .inner {
    max-width: 1180px;
    margin: 0 auto;
    padding-inline: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    position: static;
    width: auto;
    height: auto;
    clip: auto;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: -0.01em;
  }
  .tabs {
    margin: 0;
    grid-template-columns: auto auto auto;
    gap: 4px;
    height: 60px;
  }
  .tabs button {
    flex-direction: row;
    gap: 6px;
    font-size: 14px;
    padding: 0 14px;
    border-top: 0;
    border-bottom: 2px solid transparent;
  }
  .tabs button[aria-current="page"] {
    border-bottom-color: var(--brand);
  }
  .tabs :deep(svg) {
    width: 18px;
    height: 18px;
  }
}
</style>
