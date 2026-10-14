<script setup>
import { computed } from "vue";
import GenderMark from "@/components/common/GenderMark.vue";
import GameCount from "@/components/common/GameCount.vue";
import { GENDER_TEXT } from "@/utils/players";

/**
 * 球場上的一格：有人顯示名字，空位顯示「空位」；選取中的球員有紅色外框。
 * compact（手機精簡看板）：高度較矮、性別改用左側色條表示，省下性別方塊的寬度給名字。
 */
const props = defineProps({
  player: { type: Object, default: null }, // { id, name, gender } | null
  team: { type: String, required: true }, // 'a' | 'b'
  label: { type: String, required: true }, // 給讀屏軟體的位置描述，例如「場地 1 A 組」
  selected: { type: Boolean, default: false },
  targetable: { type: Boolean, default: false }, // 已有選取時，空位會提示可以放入
  compact: { type: Boolean, default: false },
});
defineEmits(["tap"]);

const aria = computed(() =>
  props.player
    ? `${props.label}：${props.player.name}（${GENDER_TEXT[props.player.gender]}，已打 ${props.player.games || 0} 場）`
    : `${props.label} 空位`
);
const emptyText = computed(() => (props.targetable ? (props.compact ? "放入" : "放這裡") : "空位"));
</script>

<template>
  <button
    type="button"
    class="slot"
    :class="[
      player ? 'filled' : 'empty',
      team,
      player && compact ? 'g-' + player.gender : '',
      { compact, selected, target: targetable && !player },
    ]"
    :aria-label="aria"
    :aria-pressed="selected"
    @click="$emit('tap')"
  >
    <template v-if="player">
      <GenderMark v-if="!compact" :gender="player.gender" />
      <span class="nm">{{ player.name }}</span>
      <GameCount :count="player.games || 0" />
    </template>
    <template v-else>{{ emptyText }}</template>
  </button>
</template>

<style scoped>
.slot {
  width: 100%;
  max-width: 9rem;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  transition: box-shadow 0.2s, transform 0.15s;
}
.nm {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.filled.a {
  background: var(--chipa);
  color: var(--chipaink);
  box-shadow: 0 1px 3px var(--shadow);
}
.filled.b {
  background: var(--chipb);
  color: var(--chipbink);
  box-shadow: 0 1px 3px var(--shadow);
}
.empty {
  justify-content: center;
  border: 1.5px dashed var(--courtline);
  color: var(--courtline);
  font-weight: 500;
  font-size: 13px;
}
.empty.target {
  border-style: solid;
  background: rgba(255, 255, 255, 0.14);
  color: var(--courtink);
  animation: breathe 1.6s ease-in-out infinite;
}
.selected {
  box-shadow: 0 0 0 3px var(--sel), 0 4px 12px var(--shadow);
  transform: scale(1.04);
}

/* 手機精簡模式 */
.compact {
  max-width: none;
  min-height: 28px;
  padding: 0 5px 0 6px;
  border-radius: 6px;
  font-size: 13px;
  letter-spacing: -0.01em;
}
.compact.filled {
  border-left: 4px solid transparent;
  padding-left: 4px;
}
.compact.g-M {
  border-left-color: var(--gm);
}
.compact.g-F {
  border-left-color: var(--gf);
}
.compact.empty {
  font-size: 11px;
  border-width: 1px;
}
/* 手機方塊很窄：場次只顯示數字、不加外框，把寬度留給名字 */
.compact :deep(.cnt) {
  min-width: 0;
  padding: 0 0 0 3px;
  box-shadow: none;
  opacity: 0.6;
}
.compact :deep(.cnt.zero) {
  opacity: 0.3;
}
.compact.selected {
  transform: none;
  box-shadow: 0 0 0 2.5px var(--sel);
}

@keyframes breathe {
  50% {
    background: rgba(255, 255, 255, 0.26);
  }
}
</style>
