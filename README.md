<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4c7f7e54-26f8-4b15-bd6c-f2faa7423242

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Local UI Verification

Use this checklist before and after UI changes to confirm the Cloudy MVP still runs locally and the core screens remain usable.

### Environment setup

1. Create `.env.local` if it does not exist.
2. Set `GEMINI_API_KEY` in `.env.local`.
3. Optionally set `GOOGLE_MAPS_PLATFORM_KEY` if you want map-related UI to use a real Google Maps key.
4. No real backend is required for local UI checks. The logistics data is mocked through `services/apiService.ts`.

### Development run

1. Install dependencies:
   `npm install`
2. Check TypeScript:
   `npm run lint`
3. Start the Vite dev server:
   `npm run dev`
4. Open the local app:
   `http://localhost:3000`

### Production-like preview

1. Build the app:
   `npm run build`
2. Preview the production build:
   `npm run preview`
3. Open the preview URL printed by Vite. It is normally:
   `http://localhost:4173`

### UI smoke-test checklist

- Log in with `SuperAdmin / admin123`.
- Confirm the flow is Login -> Hub -> Trip Scheduling.
- Confirm Inventory and Billing remain disabled Coming Soon modules.
- Inspect Dashboard, Trip Management, Trip Schedule, Truck Management, Employee Directory, and Settings.
- Log in as a Viewer user and confirm create, update, and delete controls are hidden or disabled.
- Check a desktop viewport around `1280px` wide.
- Check a tablet viewport around `768px` wide.
- Verify there are no blank screens, text overlaps, clipped table controls, broken modal scrolling, or unreadable dark/light theme states.
