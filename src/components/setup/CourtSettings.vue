<script setup>
import { MAX_COURTS } from "@/utils/board";
import { useBoard } from "@/stores/board";
import NewDayButton from "@/components/common/NewDayButton.vue";

const board = useBoard();
const { state, rest } = board;
</script>

<template>
  <section class="card" aria-labelledby="h-courts">
    <div class="card-head"><h2 id="h-courts">場地設定</h2></div>

    <div class="stepper-row">
      <div>
        <div class="label">場地數</div>
        <div class="sub">上場區與等待區各會有同樣面數</div>
      </div>
      <div class="stepper">
        <button
          type="button"
          aria-label="減少場地"
          :disabled="state.courtCount <= 1"
          @click="board.setCourtCount(state.courtCount - 1)"
        >
          −
        </button>
        <span class="num value" aria-live="polite">{{ state.courtCount }}</span>
        <button
          type="button"
          aria-label="增加場地"
          :disabled="state.courtCount >= MAX_COURTS"
          @click="board.setCourtCount(state.courtCount + 1)"
        >
          +
        </button>
      </div>
    </div>

    <div class="capacity">
      <div class="cap live">
        <div class="k">上場區</div>
        <div class="v num">{{ state.courtCount }}</div>
        <div class="u">面 · {{ state.courtCount * 4 }} 人</div>
      </div>
      <div class="cap wait">
        <div class="k">等待區</div>
        <div class="v num">{{ state.courtCount }}</div>
        <div class="u">面 · {{ state.courtCount * 4 }} 人</div>
      </div>
      <div class="cap">
        <div class="k">休息區</div>
        <div class="v num">{{ state.started ? rest.length : state.players.length }}</div>
        <div class="u">人{{ state.started ? "（目前）" : "（初始）" }}</div>
      </div>
    </div>

    <button type="button" class="btn primary block" :disabled="state.players.length < 4" @click="board.build">
      {{ state.started ? "前往配對看板" : "建立場地" }}
    </button>
    <p class="hint" :class="{ warn: state.players.length < 4 }">
      <template v-if="state.players.length < 4">至少需要 4 位球員。</template>
      <template v-else-if="!state.started">建立後所有球員都會先放在休息區，再由你排入上場區或等待區。</template>
      <template v-else>場地已建立。調整場地數會立即套用，被移除場地上的人會回到休息區。</template>
    </p>

    <!-- 每次打球開始前用：名單與場地數保留，其他歸零 -->
    <div v-if="state.started" class="newday">
      <div>
        <div class="label">今天要重新開始？</div>
        <div class="sub">今天的比賽紀錄存到統計數據的「歷史」，已打場次歸零、所有人回休息區；名單和場地數會保留。</div>
      </div>
      <NewDayButton block />
    </div>
  </section>
</template>

<style scoped>
.stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.label {
  font-weight: 700;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stepper button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--line);
  font-size: 20px;
  line-height: 1;
}
.value {
  width: 28px;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
}
.capacity {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
}
.cap {
  border-radius: 12px;
  padding: 10px;
  background: var(--soft);
}
.cap.live {
  background: var(--court);
  color: var(--courtink);
}
.cap.wait {
  background: var(--courtwait);
  color: var(--courtink);
}
.newday {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.k,
.u {
  font-size: 12px;
  opacity: 0.85;
}
.v {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}
</style>
