# Canopy Commons Melbourne — FIT5032 Assignment 2

A Vue 3 web application for a fictional Melbourne not-for-profit that helps people
find local tree-planting and biodiversity activities.

## Running the app

```powershell
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

To make the production build:

```powershell
npm run build
```

## How the business requirements are met

### A.1 — Vue.js 3 with the Composition API

Built with Vue 3 and Vite. Every component uses `<script setup>`, which is the
Composition API. The code is split up so each part has one job:

- `src/views/` — one file per page (Home, Discover, Opportunity details, Not found)
- `src/components/` — reusable pieces (`OpportunityCard`, `InterestForm`, `DataStatus`)
- `src/composables/useOpportunities.js` — loads the activity data and shares it between pages
- `src/utils/` — the validation rules and the date/time formatting helpers

Vue features used: `ref`, `reactive`, `computed`, `onMounted`, props, emits,
`v-model`, `v-for`, `v-if`/`v-else`, and Vue Router.

### A.2 — Responsive design

Bootstrap 5 provides the grid and components. The layout uses Bootstrap's
breakpoint classes so it works on phones, tablets and desktops:

- Cards go from 1 column on a phone, to 2 (`col-sm-6`), to 3 (`col-lg-4`)
- The home hero stacks on small screens and sits side by side from `md` up
- The details page puts the form under the content on small screens (`col-lg-*`)
- The navbar collapses using `navbar-expand-sm`

### B.1 — Two or more types of validation

The interest form in `src/components/InterestForm.vue` uses three different
kinds of rule, defined in `src/utils/validation.js`:

1. **Required field** — name must not be empty (spaces alone do not count)
2. **Format check** — email must look like an email address
3. **Number range** — number of people must be a whole number from 1 to 10

Errors appear under the field they belong to, using Bootstrap's `is-invalid` and
`invalid-feedback` classes. What the user typed is kept so they can fix it. When
the form is valid, a confirmation replaces it, and an "Edit my details" button
goes back to the form.

### B.2 — Dynamic data

The activities are not typed into the pages. They are stored in
`public/opportunities.json` and loaded with `fetch` in
`src/composables/useOpportunities.js`.

The path the data takes is:

`opportunities.json` → `fetch` → `opportunities` ref → `computed` filter → `v-for` in the page

- Home shows the activities whose `featured` value is `true`
- Discover filters by search text, activity type and the beginner checkbox
- The details page finds one activity by matching the id in the URL
- The activity type dropdown is built from the data, not typed by hand

Loading, error, empty-results and "activity not found" states are all handled.

## Notes

All the activities are made up for this assignment. The interest form is a
demonstration only — nothing is sent or saved, and the details disappear when the
page is reloaded.
