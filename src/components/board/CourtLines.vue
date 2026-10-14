<!-- 雙打球場線（13.4m × 6.1m，以 10 倍座標繪製），中間虛線是球網 -->
<template>
  <svg class="court-lines" viewBox="0 0 134 61" preserveAspectRatio="none" fill="none" stroke="currentColor" aria-hidden="true">
    <rect x="0" y="0" width="134" height="61" vector-effect="non-scaling-stroke" stroke-width="1.5" />
    <path
      d="M0 4.6H134M0 56.4H134M47.2 0V61M86.8 0V61M7.6 0V61M126.4 0V61M0 30.5H47.2M86.8 30.5H134"
      vector-effect="non-scaling-stroke"
      stroke-width="1.5"
    />
    <path d="M67 0V61" vector-effect="non-scaling-stroke" stroke-width="3" stroke-dasharray="4 3" />
  </svg>
</template>

<style scoped>
.court-lines {
  position: absolute;
  inset: 8px;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  color: var(--courtline);
  pointer-events: none;
}
</style>
