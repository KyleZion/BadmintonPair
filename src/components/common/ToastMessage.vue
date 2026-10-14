<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";
import { useToast } from "@/composables/useToast";

/**
 * docked：停靠在父元素（休息區）正上方顯示。
 * 有停靠的提示存在時，畫面上方的全域提示就不顯示，同一則訊息只出現一次。
 */
const props = defineProps({
  docked: { type: Boolean, default: false },
});
const { message, action, dockCount, dismiss, runAction } = useToast();

onMounted(() => props.docked && dockCount.value++);
onBeforeUnmount(() => props.docked && dockCount.value--);

const show = computed(() => !!message.value && (props.docked || dockCount.value === 0));
</script>

<template>
  <Transition :name="docked ? 'toast-up' : 'toast'">
    <div v-if="show" class="toast" :class="{ docked }" role="status" aria-live="polite">
      <span class="text" @click="dismiss">{{ message }}</span>
      <button v-if="action" type="button" class="act" @click="runAction">{{ action.label }}</button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 16px;
  right: 16px;
  top: calc(var(--safe-top) + 12px);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 460px;
  margin: 0 auto;
  padding: 10px 10px 10px 14px;
  border-radius: 12px;
  background: var(--ink);
  color: var(--page);
  font-size: 14px;
  box-shadow: 0 8px 24px var(--shadow);
}
/* 停靠在休息區正上方 */
.toast.docked {
  position: absolute;
  top: auto;
  bottom: calc(100% + 8px);
  left: 10px;
  right: 10px;
}
.text {
  flex: 1;
  min-width: 0;
}
.act {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 8px;
  background: var(--chipb);
  color: var(--chipbink);
  font-size: 13px;
  font-weight: 700;
}
.toast-enter-active,
.toast-leave-active,
.toast-up-enter-active,
.toast-up-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.toast-up-enter-from,
.toast-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
