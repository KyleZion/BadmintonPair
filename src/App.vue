<script setup>
import AppTabBar from "@/components/AppTabBar.vue";
import ToastMessage from "@/components/common/ToastMessage.vue";
import SetupView from "@/views/SetupView.vue";
import BoardView from "@/views/BoardView.vue";
import StatsView from "@/views/StatsView.vue";
import { useBoard } from "@/stores/board";

const { ui } = useBoard();
</script>

<template>
  <AppTabBar />
  <SetupView v-if="ui.tab === 'setup'" />
  <BoardView v-else-if="ui.tab === 'board'" />
  <StatsView v-else />
  <ToastMessage />
</template>
