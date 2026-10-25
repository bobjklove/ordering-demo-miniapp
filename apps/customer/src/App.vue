<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { themeStyle } from "@demo/shop";

onLaunch(() => {
  // #ifdef H5
  Object.entries(themeStyle).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  // #endif
});
</script>

<style>
@import "./styles/app.css";
</style>
