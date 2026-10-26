# Canopy Commons Melbourne

A Vue 3 app for a fictional Melbourne not-for-profit that helps people find
local tree-planting and biodiversity activities. It has accounts and roles,
ratings, searchable tables, maps and trip planning, email, session bookings, a
saved list and an offline reader.

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

### Demo mode and cloud mode

The app runs in one of two modes, chosen once at startup from
`VITE_AUTH_MODE`:

- **Demo mode** (the default, no settings needed). Accounts and ratings are kept
  in this browser only. A coordinator account is created for you the first time
  the app runs: `coordinator@example.com` / `coordinator123`.
- **Cloud mode** (`VITE_AUTH_MODE=firebase`). Accounts use Firebase
  Authentication and ratings, sessions and email requests use Firestore.

For cloud mode, copy `.env.example` to `.env.local` and fill in the Firebase web
app settings. Those settings are public identifiers, not secrets. `.env.local`
is ignored by git.

The two modes are deliberately separate. If cloud mode cannot connect it shows
an error rather than quietly falling back to the demo accounts.

## What the app does

### Accounts and roles

`src/auth.js` keeps accounts in the browser and `src/cloudAuth.js` uses
Firebase. `src/identity.js` picks one of them at startup so the rest of the app
does not need to know which is in use. Passwords are hashed with bcryptjs and
never stored or displayed as plain text.

There are two roles, volunteer and coordinator. Pages are protected in
`src/router.js` with a `beforeEach` guard and route `meta`, so typing an address
directly cannot skip the check:

- `/account` needs any signed-in account
- `/coordinator` needs the coordinator role, and sends anyone else to
  `/access-denied`

The coordinator link is also hidden from the navigation for other accounts,
but the guard is what actually enforces it.

### Ratings

Signed-in people can rate an activity from 1 to 5 on the activity page, and see
their own ratings on `/account`. Each person has one rating per activity, and
changing it replaces the old one. Coordinators see the average and the number of
ratings per activity.

### Tables with search, sort, filter and export

`src/components/DataTable.vue` is a reusable table used twice on the coordinator
page, for activities and for accounts. It supports a search box across all
columns, a per-column filter, sortable headings, paging at 10 rows a page, and a
CSV export of every matching row in the current sort order. Password hashes are
never included in the table or the export.

### Maps and trip planning

The discover page can open a map (`src/components/ActivityMap.vue`) built with
Leaflet and OpenStreetMap tiles. You can search for a starting place in Greater
Melbourne, pick a destination activity and get an estimated driving distance and
time. Place search uses Photon and routing uses FOSSGIS, so no API key is
needed. The locations are approximate suburb reference points for fictional
activities, not real meeting points.

### Email

A signed-in person with a verified email can ask for an activity's details by
email. The page writes a request document to Firestore and a Cloud Function
(`functions/index.js`) picks it up and sends the email through Resend with the
details attached as a text file. The address always comes from the signed-in
account, never from the form, so the app cannot be used to send mail to someone
else.

### Session bookings

`/bookings` lists future demonstration sessions. Reserving or cancelling a place
writes a request document, and a Cloud Function applies it inside a single
Firestore transaction so two people cannot take the last place at the same time.
The planner also warns about sessions that clash with one you have already
reserved.

### Saved activities

Any activity can be saved to a list kept in this browser, shown at `/saved`.
This is not a reservation, and the list is shared by anyone using the browser.

### Offline reader

`offline.html` is a small separate page that can be downloaded for offline
reading, using a service worker. It covers the public activity details and the
saved list. Anything that needs an account stays online only, and the app says
so rather than appearing to work.

### Accessibility

- A skip link to the main content, and a visible focus outline everywhere
- Form errors are announced and the first bad field is focused on submit
- Status and error messages use `role="status"` and `role="alert"`
- The map has a keyboard-usable alternative: the activity selector and the text
  trip summary work without touching the map

## Project layout

- `src/views/` — one file per page
- `src/components/` — reusable pieces
- `src/composables/` — shared reactive state
- `src/utils/` — pure helpers, which is where most of the checking lives
- `functions/` — Firebase Cloud Functions for email and bookings
- `build/` — two small Vite plugins used by `npm run build`
- `firestore.rules` — the Firestore security rules

## Notes

All the activities, sessions and coordinators are made up. The expression of
interest form is a demonstration only and nothing is sent.
