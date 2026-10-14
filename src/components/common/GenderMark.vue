<script setup>
import { GENDER_TEXT } from "@/utils/players";

defineProps({
  gender: { type: String, required: true }, // 'M' | 'F'
  as: { type: String, default: "span" }, // 傳 'button' 可當切換按鈕
});
</script>

<template>
  <component :is="as" class="gmark" :class="gender" :type="as === 'button' ? 'button' : undefined">
    {{ GENDER_TEXT[gender] }}
  </component>
</template>

<style scoped>
.gmark {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
button.gmark {
  width: 22px;
  height: 22px;
  font-size: 12px;
}
.M {
  background: var(--gm);
  color: var(--gmink);
}
.F {
  background: var(--gf);
  color: var(--gfink);
}
</style>
