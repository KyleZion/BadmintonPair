import { ref, shallowRef } from "vue";

/**
 * 全域浮動提示（單例）：任何元件呼叫 toast('文字') 都會顯示在同一個位置。
 * 可以帶一個動作按鈕，例如 toast('場地 1 結束', { action: { label: '復原', run: undo } })；
 * 有動作按鈕時預設顯示久一點（6 秒），讓人來得及按。
 *
 * 顯示位置：平常在畫面上方；手機看板上休息區會放一個「停靠」的提示（docked），
 * 這時改顯示在休息區正上方，不會擋住上方場地的按鈕。dockCount > 0 代表有停靠的提示存在。
 */
const message = ref("");
const action = shallowRef(null); // { label, run } | null
const dockCount = ref(0);
let timer = null;

export function useToast() {
  function toast(text, opts = {}) {
    message.value = text;
    action.value = opts.action || null;
    clearTimeout(timer);
    timer = setTimeout(dismiss, opts.ms || (opts.action ? 6000 : 2600));
  }
  function dismiss() {
    clearTimeout(timer);
    message.value = "";
    action.value = null;
  }
  function runAction() {
    const a = action.value;
    dismiss();
    if (a) a.run();
  }
  return { message, action, dockCount, toast, dismiss, runAction };
}
