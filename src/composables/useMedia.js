import { ref, onMounted, onBeforeUnmount } from "vue";

/** 回傳一個會隨視窗大小更新的布林值，例如 useMedia("(max-width: 719px)") */
export function useMedia(query) {
  const mq = typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query) : null;
  const matches = ref(mq ? mq.matches : false);
  const update = () => (matches.value = mq.matches);
  onMounted(() => mq && mq.addEventListener("change", update));
  onBeforeUnmount(() => mq && mq.removeEventListener("change", update));
  return matches;
}
