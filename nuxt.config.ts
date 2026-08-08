// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/test-utils/module", "@nuxt/ui"],

  css: ["~/assets/css/main.css"],

  eslint: {
    config: {
      standalone: false,
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ["node"],
      },
    },
  },
});
