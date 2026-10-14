<script setup>
import RosterEditor from "@/components/setup/RosterEditor.vue";
import CourtSettings from "@/components/setup/CourtSettings.vue";
</script>

<template>
  <main class="page">
    <div class="grid">
      <RosterEditor />
      <CourtSettings />
    </div>
  </main>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 16px;
}
@media (min-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    align-items: start;
  }
}
</style>
