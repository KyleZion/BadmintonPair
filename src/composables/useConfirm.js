import { ref } from "vue";

/**
 * 「再點一次確認」：危險操作第一次點只會進入待確認狀態（按鈕文字改變），
 * 幾秒內再點同一個按鈕才真的執行。不用 confirm() 對話框，手機上比較順手。
 */
const pendingKey = ref(null);
let timer = null;

export function useConfirm() {
  function confirmTwice(key, fn, ms = 3500) {
    if (pendingKey.value === key) {
      clearTimeout(timer);
      pendingKey.value = null;
      fn();
      return true;
    }
    pendingKey.value = key;
    clearTimeout(timer);
    timer = setTimeout(() => (pendingKey.value = null), ms);
    return false;
  }
  const isPending = (key) => pendingKey.value === key;
  return { pendingKey, confirmTwice, isPending };
}
