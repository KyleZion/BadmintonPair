<script setup>
import { computed } from "vue";
import DateBar from "@/components/stats/DateBar.vue";
import MatchRow from "@/components/stats/MatchRow.vue";
import PlayerStatsTable from "@/components/stats/PlayerStatsTable.vue";
import DayCard from "@/components/stats/DayCard.vue";
import DayDetail from "@/components/stats/DayDetail.vue";
import AllStats from "@/components/stats/AllStats.vue";
import NewDayButton from "@/components/common/NewDayButton.vue";
import { formatElapsed } from "@/utils/timer";
import { useBoard } from "@/stores/board";
import { useConfirm } from "@/composables/useConfirm";

/**
 * 統計數據：上方日期列切換要看哪一天
 *   今天      比賽紀錄（可刪除單筆）／球員統計
 *   最近 2 次 或從歷史點進去的某一天：唯讀
 *   歷史      每一天一張卡片
 *   全部      累計統計
 */
const board = useBoard();
const { state, ui, matchSummary, days } = board;
const { confirmTwice, isPending } = useConfirm();

// 選到的日子不在日期列的最近 2 次裡，就是從歷史點進來的
const fromHistory = computed(() => {
  const d = board.viewedDay.value;
  return !!d && days.value.findIndex((x) => x.id === d.id) >= 2;
});
</script>

<template>
  <main class="page">
    <div class="wrap">
      <DateBar />

      <!-- 今天 -->
      <template v-if="ui.statsView === 'today'">
        <div class="subtabs" role="tablist" aria-label="今天的統計">
          <button type="button" role="tab" :aria-selected="ui.statsTab === 'matches'" @click="ui.statsTab = 'matches'">
            比賽紀錄 <span v-if="state.matches.length" class="pill num">{{ state.matches.length }}</span>
          </button>
          <button type="button" role="tab" :aria-selected="ui.statsTab === 'players'" @click="ui.statsTab = 'players'">
            球員統計
          </button>
        </div>

        <section v-if="ui.statsTab === 'matches'" class="card" aria-labelledby="h-matches">
          <div class="card-head">
            <h2 id="h-matches">已結束的比賽</h2>
            <span v-if="matchSummary.count" class="sub">
              共 <b class="num">{{ matchSummary.count }}</b> 場 · 平均
              <b class="num">{{ formatElapsed(matchSummary.avgMs) }}</b>
            </span>
          </div>
          <ol v-if="state.matches.length" class="list">
            <MatchRow
              v-for="(m, i) in state.matches"
              :key="m.id"
              :match="m"
              :no="state.matches.length - i"
              :confirming="isPending('del-' + m.id)"
              @delete="confirmTwice('del-' + m.id, () => board.deleteMatch(m.id))"
            />
          </ol>
          <div v-else class="empty">
            <p class="empty-title">今天還沒有已結束的比賽</p>
            <p class="sub">場地排滿 4 人開始計時後，在配對看板按「結束」，這裡就會新增一筆紀錄。</p>
          </div>
          <div v-if="state.matches.length" class="foot">
            <span class="sub">最新的在最上面。按 × 刪除單筆，這 4 人的場次會 -1。</span>
            <NewDayButton />
          </div>
        </section>

        <section v-else class="card" aria-labelledby="h-players">
          <div class="card-head">
            <h2 id="h-players">球員統計</h2>
            <span class="sub">今天</span>
          </div>
          <PlayerStatsTable :rows="board.stats.value" mode="today" :matches="state.matches" scope="今天" />
          <p class="hint">點名字看搭檔與對手。點欄位標題可以排序，再點一次反向。「休息」是距離上一場結束多久。</p>
        </section>
      </template>

      <!-- 歷史 -->
      <section v-else-if="ui.statsView === 'history'" class="card" aria-labelledby="h-history">
        <div class="card-head">
          <h2 id="h-history">過去的日子</h2>
          <span class="sub">保留最近 {{ board.KEEP_DAYS }} 天</span>
        </div>
        <ul v-if="days.length" class="days">
          <DayCard v-for="d in days" :key="d.id" :day="d" @open="ui.statsView = d.id" />
        </ul>
        <div v-else class="empty">
          <p class="empty-title">還沒有過去的日子</p>
          <p class="sub">打完一天後按「開始新的一天」，當天的比賽紀錄就會存到這裡。</p>
        </div>
      </section>

      <!-- 全部累計 -->
      <AllStats v-else-if="ui.statsView === 'all'" />

      <!-- 某一天 -->
      <DayDetail v-else-if="board.viewedDay.value" :day="board.viewedDay.value" :from-history="fromHistory" />

      <!-- 那一天已被刪除或超過保留天數 -->
      <section v-else class="card empty">
        <p class="empty-title">找不到這一天的紀錄</p>
        <button type="button" class="link" @click="ui.statsView = 'history'">回到歷史</button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card-head b {
  color: var(--ink);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.days {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
}
.empty {
  padding: 20px 4px 8px;
  text-align: center;
}
.empty-title {
  font-weight: 700;
  margin-bottom: 4px;
}
.empty .sub {
  max-width: 34em;
  margin: 0 auto;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
</style>
