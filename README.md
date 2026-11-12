# RepLog

RepLog is a modern, full-stack strength and conditioning app for planning and
logging workouts, tracking body-weight progress, and building structured
training routines with AI. It is designed as a responsive, installable web app
for use at the gym and at home.

**Live app:** [workout-logger-gamma.vercel.app](https://workout-logger-gamma.vercel.app/)

## Key features

- **Workout planning:** Build a workout from the exercise library, choose a
  workout type, and save reusable templates.
- **AI workout generation:** Request a routine for a selected workout type.
  Generation calls a Supabase Edge Function named `generate-workout`; see
  [AI generation setup](#ai-workout-generation).
- **Workout logging:** Record exercises, sets, reps, weight, duration where
  applicable, and workout notes. Review a summary when you finish.
- **Exercise library:** Search and browse the built-in exercise catalog,
  filter by muscle group, and view exercise details.
- **Progress tracking:** Browse workout history, personal bests, weekly
  progress, and body-weight entries.
- **Training tools:** Set a weekly workout goal and estimate a lift's one-rep
  max.
- **Account management:** Sign up and sign in, reset or update a password, and
  manage profile preferences.
- **Installable PWA:** Install RepLog on supported devices. The app shell can
  be cached for offline access; features that read or write Supabase data
  require a network connection.

## Tech stack

- **UI:** React 19, JavaScript/JSX, and TypeScript for typed contexts and
  Supabase integration.
- **Build and routing:** Vite 7 and React Router 7, with route-level lazy
  loading.
- **Backend:** Supabase Auth, Postgres, and the Supabase JavaScript client.
- **AI integration:** A Supabase Edge Function invoked by the workout
  generator. The function and its model-provider configuration are not included
  in this repository.
- **Styling and UI:** Custom CSS, React Icons, Recharts, and
  `@hello-pangea/dnd`.
- **PWA:** `vite-plugin-pwa` and a service worker.
- **Quality tools:** ESLint, TypeScript, Vitest, and React Testing Library.

## Architecture and data model

### Application flow

1. `src/main.jsx` mounts the app with React Router, the authentication
   provider, and the workout provider.
2. `src/App.jsx` checks the Supabase authentication state, presents public
   authentication screens to signed-out users, and lazy-loads the signed-in
   app routes.
3. Pages and reusable components implement planning, logging, exercise
   browsing, and progress views. The exercise catalog is bundled in
   `src/data/exercises.json`.
4. `src/context/AuthenticationContext.tsx` manages the Supabase session and
   account actions. `src/context/WorkoutContext.tsx` shares active workout and
   UI state; it persists the current plan, log, templates, and related state in
   browser `localStorage`.
5. `src/supabase/supabaseWorkoutService.ts` reads and writes per-user workout
   data through the client configured in `src/supabase/supabaseClient.ts`.
   Supabase Auth persists the session in the browser as well.
6. AI generation sends the workout type and exercise metadata to the
   `generate-workout` Supabase Edge Function. The function returns exercise
   IDs, which the app checks against its local catalog.

### Supabase data contract

The client uses Supabase Auth and expects these tables in the `public` schema.
Workout exercise lists are stored as JSON/JSONB values.

| Table | Data used by the app | Key requirements |
| --- | --- | --- |
| `workouts` | `id`, `user_id`, `date`, `type`, `exercises`, `completed_at`, `notes` | A row represents a logged workout. `id` is the row identifier; `user_id` identifies its owner. |
| `personal_bests` | `id`, `user_id`, `exercise_id`, `tracking_type`, `name`, `muscle`, `weight`, `reps`, `seconds`, `achieved_in_workout_id`, `achieved_at` | One current best per user and exercise. `achieved_in_workout_id` may be null if the workout is deleted. |
| `current_plan` | `user_id`, `date`, `type`, `exercises` | One row per user; `user_id` must be unique for plan upserts. |
| `templates` | `id`, `user_id`, `name`, `type`, `exercises`, `created_at` | Saved workout templates. The client limits each user to five templates. |
| `weekly_goal` | `user_id`, `weekly_goal` | One row per user; `user_id` must be unique for goal upserts. |
| `body_weights` | `user_id`, `recorded_date`, `weight` | One entry per user per date; `(user_id, recorded_date)` must be unique for upserts. |

`exercises` contains objects with an exercise `id` and optional `sets`. A set
can include `reps`, `weight`, or `seconds`. In `personal_bests`, `weight`,
`reps`, and `seconds` are nullable depending on the exercise's tracking type;
`completed_at` and `notes` in `workouts` may also be null.

Enable Row Level Security on user data tables and add policies that restrict
each authenticated user to rows where `user_id = auth.uid()`. The frontend
filters queries by user, but that is not a substitute for database-side
policies. The `workouts.id` and `templates.id` columns should have generated
primary keys, and `templates.created_at` should have a default timestamp.

### AI workout generation setup

The frontend expects an Edge Function deployed to the same Supabase project,
with the name `generate-workout`. It sends a `workoutType` and exercise
metadata, and expects a response containing an `exercises` array of IDs from
the supplied catalog. The function must be implemented and configured
separately; there is no model API key or function source in this repository.

## Setup

### Prerequisites

- Node.js (a current LTS release is recommended) and npm.
- A Supabase project with the tables and authentication settings described
  above.

### Run locally

1. Clone the repository and install dependencies:

2. Create a `.env.local` file in the project root and add your Supabase project
   URL and **publishable** key:

3. Configure Supabase Auth for the app's sign-in method and add your local and
   deployed app URLs to the allowed redirect URLs. Password reset redirects to
   `/update-password`.

4. Set up the database tables, unique constraints, and Row Level Security
   policies described in [Supabase data contract](#supabase-data-contract).
   Deploy and configure the `generate-workout` Edge Function if you want to use
   AI generation.

5. Start the development server:

   Vite prints the local URL (usually `http://localhost:5173`).

### Useful commands

```sh
npm run dev        # Start the Vite development server
npm run build      # Create a production build in dist/
npm run preview    # Preview the production build locally
npm test           # Run the Vitest test suite
npm run lint       # Run ESLint
npm run typecheck  # Run the TypeScript check
```

## Project structure

```text
public/                  Static assets and public PWA manifest
  images/                App icons
src/
  components/            Shared UI components, including workout generation
  constants/             Workout status and muscle-group constants
  context/               Authentication and workout state providers
  css/                   Page and component styles
  data/                  Bundled exercise catalog
  hooks/                 Reusable workout hooks
  pages/                 Route-level screens
  supabase/              Supabase client, data service, and service tests
  utils/                 Exercise, personal-best, and auth utilities
  App.jsx                Route definitions and authenticated layout
  main.jsx               Application entry point and provider setup
index.html               Vite HTML entry
vite.config.js           Vite and PWA configuration
vitest.config.js         Vitest configuration
```
