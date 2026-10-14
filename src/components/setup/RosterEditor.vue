<script setup>
import { ref } from "vue";
import GenderMark from "@/components/common/GenderMark.vue";
import AppIcon from "@/components/common/AppIcon.vue";
import GameCount from "@/components/common/GameCount.vue";
import { GENDER_TEXT, NAME_MAX } from "@/utils/players";
import { useBoard } from "@/stores/board";
import { useConfirm } from "@/composables/useConfirm";

const board = useBoard();
const { state, locate, genderCount } = board;
const { confirmTwice, isPending } = useConfirm();

const newName = ref("");
const newGender = ref("M");
const bulk = ref("");
const notice = ref("");
const noticeWarn = ref(false);

function report({ added, skipped }) {
  noticeWarn.value = skipped.length > 0;
  notice.value = skipped.length ? "已略過重複的名字：" + skipped.join("、") : added > 1 ? `已加入 ${added} 位球員。` : "";
}
function addOne() {
  if (!newName.value.trim()) return;
  const r = board.addOne(newName.value, newGender.value);
  report(r);
  if (r.added) newName.value = "";
}
function onNameEnter(e) {
  if (e.isComposing || e.keyCode === 229) return; // 中文輸入法選字時的 Enter 不送出
  e.preventDefault();
  addOne();
}
function addBulk() {
  const r = board.addBulk(bulk.value, newGender.value);
  report(r);
  if (r.added) bulk.value = "";
}
function loadSample() {
  if (confirmTwice("sample", board.loadSample)) report({ added: 20, skipped: [] });
}
function clearRoster() {
  if (confirmTwice("clearRoster", board.clearRoster)) notice.value = "";
}
</script>

<template>
  <section class="card" aria-labelledby="h-roster">
    <div class="card-head">
      <h2 id="h-roster">球員名單</h2>
      <span class="sub">
        <span class="num">{{ state.players.length }}</span> 人 · 男 <span class="num">{{ genderCount.M }}</span> · 女
        <span class="num">{{ genderCount.F }}</span>
      </span>
    </div>

    <div class="add-row">
      <input
        id="new-name"
        v-model="newName"
        type="text"
        :maxlength="NAME_MAX + 4"
        placeholder="球員名稱"
        aria-label="球員名稱"
        autocomplete="off"
        @keydown.enter="onNameEnter"
      />
      <div class="seg" role="group" aria-label="性別">
        <button type="button" class="m" :aria-pressed="newGender === 'M'" @click="newGender = 'M'">男</button>
        <button type="button" class="f" :aria-pressed="newGender === 'F'" @click="newGender = 'F'">女</button>
      </div>
      <button type="button" class="btn primary" :disabled="!newName.trim()" @click="addOne">新增</button>
    </div>
    <p class="hint" :class="{ warn: noticeWarn }" aria-live="polite">
      {{ notice || "輸入名字、選性別後按「新增」或 Enter。" }}
    </p>

    <details class="bulk">
      <summary>批次貼上名單</summary>
      <textarea
        id="bulk-text"
        v-model="bulk"
        rows="5"
        placeholder="一行一位，或用逗號分隔&#10;阿明 男&#10;小美 女&#10;Ben M"
      ></textarea>
      <div class="bulk-foot">
        <button type="button" class="btn ghost" :disabled="!bulk.trim()" @click="addBulk">加入名單</button>
        <span class="sub">沒寫性別的人，會套用上方選取的「{{ GENDER_TEXT[newGender] }}」。</span>
      </div>
    </details>

    <p v-if="!state.players.length" class="hint">還沒有球員，至少需要 4 位才能排一場雙打。</p>
    <ul v-else class="roster">
      <li v-for="p in state.players" :key="p.id">
        <GenderMark
          as="button"
          :gender="p.gender"
          :aria-label="`${p.name} 性別：${GENDER_TEXT[p.gender]}，點擊切換`"
          title="點擊切換性別"
          @click="board.toggleGender(p.id)"
        />
        <span>{{ p.name }}</span>
        <GameCount :count="p.games || 0" />
        <span v-if="state.started && locate[p.id]" class="where">{{ locate[p.id] }}</span>
        <button type="button" class="del" :aria-label="'刪除 ' + p.name" @click="board.removePlayer(p.id)">
          <AppIcon name="x" :size="14" :stroke="2.4" />
        </button>
      </li>
    </ul>

    <div class="foot">
      <span class="sub">點性別標記可以切換男／女；名字後方的數字是已打場次。</span>
      <span>
        <button type="button" class="link" @click="loadSample">
          {{ isPending("sample") ? "再點一次，取代目前名單" : "載入範例 20 人" }}
        </button>
        <button v-if="state.players.length" type="button" class="link danger" @click="clearRoster">
          {{ isPending("clearRoster") ? "再點一次確認清空" : "清空名單" }}
        </button>
      </span>
    </div>
  </section>
</template>

<style scoped>
.add-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.add-row input {
  flex: 1 1 140px;
  min-width: 0;
  border: 1px solid var(--line);
  background: var(--page);
  border-radius: 10px;
  padding: 9px 12px;
}
.bulk {
  margin-top: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 10px 12px;
}
.bulk summary {
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  list-style: none;
}
.bulk summary::-webkit-details-marker {
  display: none;
}
.bulk summary::before {
  content: "＋ ";
  color: var(--brand);
}
.bulk[open] summary::before {
  content: "－ ";
}
.bulk textarea {
  display: block;
  width: 100%;
  margin-top: 10px;
  border: 1px solid var(--line);
  background: var(--page);
  border-radius: 10px;
  padding: 8px 10px;
  resize: vertical;
}
.bulk-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.roster {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.roster li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--soft);
  border-radius: 8px;
  padding: 4px 4px 4px 5px;
  font-size: 14px;
}
.where {
  font-size: 11px;
  color: var(--brand);
  font-weight: 700;
}
.del {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--mute);
}
.del:hover {
  color: var(--warn);
  background: var(--line);
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>
