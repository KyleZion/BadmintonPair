<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { formatElapsed, formatDuration } from "@/utils/timer";

/**
 * 點球員統計表的名字後，從下方滑出的詳細資料：搭檔次數、對手次數、還沒同隊過的人。
 * 範圍跟著統計頁目前選的日期（今天／某一天／全部）。
 */
const props = defineProps({
  row: { type: Object, required: true }, // 統計表的一列：name、games、totalMs…
  relations: { type: Object, required: true }, // utils/pairs.js 的 playerRelations 結果
  scope: { type: String, required: true }, // 例如「今天」「10/12」「全部累計」
});
const emit = defineEmits(["close"]);

// 長條的長度：以兩邊清單裡最多的次數為滿格
const max = computed(() =>
  Math.max(1, ...props.relations.partners.map((r) => r.count), ...props.relations.opponents.map((r) => r.count))
);
const width = (n) => Math.max(8, Math.round((n / max.value) * 100)) + "%";

const closeBtn = ref(null);
const onKey = (e) => e.key === "Escape" && emit("close");
onMounted(() => {
  document.addEventListener("keydown", onKey);
  closeBtn.value && closeBtn.value.focus();
});
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="pd-name">
      <header class="head">
        <div>
          <h2 id="pd-name">{{ row.name }}</h2>
          <p class="sub">
            {{ scope }} · <span class="num">{{ row.games }}</span> 場
            <template v-if="row.games"> · 總時間 <span class="num">{{ formatDuration(row.totalMs) }}</span> · 平均 <span class="num">{{ formatElapsed(row.avgMs) }}</span></template>
          </p>
        </div>
        <button ref="closeBtn" type="button" class="close" aria-label="關閉" @click="emit('close')">✕</button>
      </header>

      <p v-if="!row.games" class="none">這段期間還沒上過場。</p>
      <div v-else class="cols">
        <div v-for="col in [{ t: '搭檔', list: relations.partners }, { t: '對手', list: relations.opponents }]" :key="col.t" class="col">
          <h3>{{ col.t }}</h3>
          <ol>
            <li v-for="r in col.list" :key="r.id" :class="{ hot: r.count >= 2 }">
              <span class="nm">{{ r.name }}</span>
              <span class="bar"><i :style="{ width: width(r.count) }"></i></span>
              <span class="n num">{{ r.count }}</span>
            </li>
          </ol>
        </div>
      </div>

      <p v-if="relations.neverPartnered.length" class="never">
        <b>還沒同隊過：</b>{{ relations.neverPartnered.join("、") }}
      </p>
      <p class="hint">次數 2 以上用黃色標示，跟配對看板的提醒一樣。</p>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}
.sheet {
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 16px 16px calc(16px + var(--safe-bottom));
  border-radius: 18px 18px 0 0;
  background: var(--panel);
  box-shadow: 0 -8px 30px var(--shadow);
  animation: up 0.2s ease-out;
}
@keyframes up {
  from {
    transform: translateY(24px);
    opacity: 0;
  }
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
h2 {
  font-size: 20px;
  font-weight: 900;
}
.close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--soft);
  font-size: 15px;
}
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}
h3 {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--mute);
}
ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
li {
  display: grid;
  grid-template-columns: minmax(0, 5.5em) minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.nm {
  font-weight: 700;
  overflow-wrap: anywhere;
  line-height: 1.25;
}
.bar {
  height: 8px;
  border-radius: 99px;
  background: var(--soft);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: var(--court);
}
.hot .bar i {
  background: var(--chipb);
}
.hot .n {
  color: var(--warn);
}
.n {
  min-width: 1.4em;
  text-align: right;
  font-weight: 800;
}
.never {
  margin-top: 14px;
  font-size: 13px;
  color: var(--mute);
}
.never b {
  color: var(--ink);
}
.none {
  padding: 8px 0;
  color: var(--mute);
}
@media (max-width: 359px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
@media (min-width: 720px) {
  .backdrop {
    align-items: center;
  }
  .sheet {
    border-radius: 18px;
  }
}
</style>
