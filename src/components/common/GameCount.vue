<script setup>
/** 球員名字後方的「已打場次」數字。0 場顯示淡一點，方便一眼找出還沒上過場的人。 */
defineProps({
  count: { type: Number, default: 0 },
});
</script>

<template>
  <span class="cnt num" :class="{ zero: !count }" :title="`已打 ${count} 場`" aria-hidden="true">{{ count }}</span>
</template>

<style scoped>
/* 外框用目前的文字顏色，放在白色、黃色方塊或休息區晶片裡都能自動配色 */
.cnt {
  flex-shrink: 0;
  margin-left: auto;
  min-width: 1.4em;
  padding: 0 4px;
  border-radius: 99px;
  box-shadow: inset 0 0 0 1px currentColor;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
.zero {
  opacity: 0.4;
}
</style>
