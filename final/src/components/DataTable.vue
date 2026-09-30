<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  selectRows,
  pageRows,
  downloadCsv,
  PAGE_SIZE,
} from "../utils/table.js";
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: "id" },
});
const search = ref(""),
  filters = reactive({}),
  sortKey = ref(""),
  direction = ref("asc"),
  page = ref(1),
  message = ref("");
const filtered = computed(() =>
  selectRows(props.rows, props.columns, {
    search: search.value,
    filters,
    sortKey: sortKey.value,
    direction: direction.value,
  }),
);
const paged = computed(() => pageRows(filtered.value, page.value));
watch([search, filters, sortKey, direction], () => {
  page.value = 1;
  message.value = "";
});
watch(
  () => paged.value.page,
  (value) => {
    page.value = value;
  },
);
function sort(key) {
  direction.value =
    sortKey.value === key && direction.value === "asc" ? "desc" : "asc";
  sortKey.value = key;
}
function clear() {
  search.value = "";
  Object.keys(filters).forEach((key) => delete filters[key]);
  page.value = 1;
}
function exportRows() {
  try {
    downloadCsv(filtered.value, props.columns, props.id);
    message.value = `CSV download started for ${filtered.value.length} matching rows.`;
  } catch {
    message.value =
      "The download could not start. Please allow downloads and try again.";
  }
}
</script>
<template>
  <section class="mb-5" :aria-labelledby="`${id}-heading`">
    <h2 :id="`${id}-heading`" class="h4">{{ title }}</h2>
    <div class="d-flex flex-wrap align-items-end gap-3 mb-3">
      <div class="flex-grow-1">
        <label :for="`${id}-search`" class="form-label"
          >Search all {{ title.toLowerCase() }} columns</label
        >
        <input
          :id="`${id}-search`"
          v-model="search"
          type="search"
          class="form-control"
        />
      </div>
      <button class="btn btn-outline-secondary" type="button" @click="clear">
        Clear {{ title.toLowerCase() }} filters
      </button>
      <button
        class="btn btn-outline-primary"
        type="button"
        :disabled="!filtered.length"
        @click="exportRows"
      >
        Export {{ title.toLowerCase() }} CSV
      </button>
    </div>
    <p :id="`${id}-count`" role="status" aria-atomic="true" class="small">
      {{ filtered.length }} of {{ rows.length }} rows. Page {{ paged.page }} of
      {{ paged.pages }}. Up to {{ PAGE_SIZE }} rows per page.
    </p>
    <p class="small">
      Export includes all matching rows in the current sort order, across all
      pages.
    </p>
    <div
      class="table-responsive"
      role="region"
      :aria-label="`${title} table, scroll horizontally if needed`"
      tabindex="0"
    >
      <table
        class="table table-striped table-hover align-middle"
        :aria-describedby="`${id}-count`"
      >
        <caption class="visually-hidden">
          {{
            title
          }}. Sort using column headings and filter using the fields below them.
        </caption>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="
                sortKey === column.key
                  ? direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              "
            >
              <button
                class="btn btn-link p-0 text-start fw-bold"
                type="button"
                :aria-label="`Sort ${title.toLowerCase()} by ${column.label}${sortKey === column.key && direction === 'asc' ? ' descending' : ' ascending'}`"
                @click="sort(column.key)"
              >
                {{ column.label }}
                <span aria-hidden="true">{{
                  sortKey === column.key
                    ? direction === "asc"
                      ? "↑"
                      : "↓"
                    : "↕"
                }}</span>
              </button>
            </th>
          </tr>
          <tr>
            <th v-for="column in columns" :key="column.key">
              <label class="visually-hidden" :for="`${id}-filter-${column.key}`"
                >Filter {{ title.toLowerCase() }} by {{ column.label }}</label
              >
              <input
                :id="`${id}-filter-${column.key}`"
                v-model="filters[column.key]"
                type="search"
                class="form-control form-control-sm"
                :placeholder="column.label"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paged.rows" :key="row[rowKey]">
            <td v-for="column in columns" :key="column.key">
              {{ row[column.key] ?? "—" }}
            </td>
          </tr>
          <tr v-if="!paged.rows.length">
            <td :colspan="columns.length">
              No matching rows. Clear or change the filters to try again.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <nav
      class="d-flex align-items-center gap-3 mt-3"
      :aria-label="`${title} pagination`"
    >
      <button
        class="btn btn-outline-secondary"
        type="button"
        :disabled="paged.page === 1"
        @click="page = paged.page - 1"
      >
        Previous<span class="visually-hidden">
          {{ title.toLowerCase() }} page</span
        >
      </button>
      <span>{{ paged.page }} / {{ paged.pages }}</span>
      <button
        class="btn btn-outline-secondary"
        type="button"
        :disabled="paged.page === paged.pages"
        @click="page = paged.page + 1"
      >
        Next<span class="visually-hidden"> {{ title.toLowerCase() }} page</span>
      </button>
    </nav>
    <p v-if="message" class="mt-2" role="status">{{ message }}</p>
  </section>
</template>
<style scoped>
th {
  min-width: 10rem;
}
td {
  overflow-wrap: anywhere;
}
</style>
