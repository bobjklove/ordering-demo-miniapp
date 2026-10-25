<script setup lang="ts">
import { reactive } from "vue";
import { levelFor, setLevels, setPointsRule } from "@demo/core";
import { centsInput, demo, explain, L, money, patch, readCents, tr } from "../demo";

const level = () => levelFor(demo.state.member.lifetimePoints, demo.state.levels);
const form = reactive({
  pointsPerUnit: String(demo.state.pointsRule.pointsPerUnit),
  redeemPoints: String(demo.state.pointsRule.redeemPoints),
  redeemCents: centsInput(demo.state.pointsRule.redeemCents),
  maxRatio: String(Math.round(demo.state.pointsRule.maxRedeemRatio * 100)),
});
const levels = reactive(demo.state.levels.map((item) => ({ id: item.id, minPoints: String(item.minPoints), multiplier: String(item.multiplier) })));
const note = reactive({ text: "" });

function saveRule(): void {
  const redeemCents = readCents(form.redeemCents);
  const maxRedeemRatio = Number(form.maxRatio) / 100;
  if (redeemCents == null || Number.isNaN(maxRedeemRatio)) {
    note.text = tr("rule_bad");
    return;
  }
  try {
    patch((state) =>
      setPointsRule(state, {
        pointsPerUnit: Number(form.pointsPerUnit),
        redeemPoints: Number(form.redeemPoints),
        redeemCents,
        maxRedeemRatio,
      }),
    );
    note.text = tr("saved");
  } catch (error) {
    note.text = explain(error);
  }
}

function saveLevels(): void {
  try {
    patch((state) =>
      setLevels(
        state,
        state.levels.map((item) => {
          const edited = levels.find((levelItem) => levelItem.id === item.id);
          return {
            ...item,
            minPoints: Number(edited?.minPoints ?? item.minPoints),
            multiplier: Number(edited?.multiplier ?? item.multiplier),
          };
        }),
      ),
    );
    note.text = tr("saved");
  } catch (error) {
    note.text = explain(error);
  }
}
</script>

<template>
  <section>
    <h1>{{ tr("members") }}</h1>
    <p class="sub">{{ tr("member_hint") }}</p>
    <p v-if="note.text" class="muted">{{ note.text }}</p>
    <article class="card">
      <h2>{{ tr("members_live") }}</h2>
      <p><strong>{{ demo.state.member.name }}</strong> · {{ demo.state.member.phone }}</p>
      <p class="muted">{{ tr("level") }} {{ L(level().name) }} · {{ tr("member_points") }} {{ demo.state.member.points }} · {{ tr("lifetime") }} {{ demo.state.member.lifetimePoints }}</p>
      <p class="muted">{{ tr("member_wallet") }} {{ money(demo.state.member.walletBalance) }} · {{ tr("orders_count") }} {{ demo.state.member.ordersCount }} · {{ demo.state.member.registered ? tr("signed_in") : tr("guest") }}</p>
    </article>
    <article class="card">
      <h2>{{ tr("members_other") }}</h2>
      <p class="muted">{{ tr("age_note") }}</p>
      <div v-for="person in demo.state.directory" :key="person.id" class="order spread">
        <span>{{ person.name }} · {{ person.phone }}</span>
        <span class="mini">{{ person.points }} {{ tr("points_unit") }} · {{ person.ordersCount }} {{ tr("orders_count") }}</span>
      </div>
    </article>
    <article class="card">
      <h2>{{ tr("points_rule") }}</h2>
      <div class="fields">
        <div><label>{{ tr("earn_per") }}</label><input v-model="form.pointsPerUnit" /></div>
        <div><label>{{ tr("redeem_block") }}</label><input v-model="form.redeemPoints" /></div>
        <div><label>{{ tr("redeem_value") }}</label><input v-model="form.redeemCents" /></div>
        <div><label>{{ tr("max_ratio") }} (%)</label><input v-model="form.maxRatio" /></div>
      </div>
      <button class="btn" style="margin-top: 12px" @click="saveRule">{{ tr("save_rule") }}</button>
    </article>
    <article class="card">
      <h2>{{ tr("level_edit") }}</h2>
      <div v-for="item in levels" :key="item.id" class="fields">
        <div><label>{{ L(demo.state.levels.find((levelItem) => levelItem.id === item.id)?.name || { zh: item.id, en: item.id }) }}</label></div>
        <div><label>{{ tr("min_points") }}</label><input v-model="item.minPoints" /></div>
        <div><label>{{ tr("rate") }}</label><input v-model="item.multiplier" /></div>
      </div>
      <button class="btn" @click="saveLevels">{{ tr("save") }}</button>
    </article>
  </section>
</template>
