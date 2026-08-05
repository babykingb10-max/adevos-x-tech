# Adevos-X Tech — Monorepo

Full project structure for the Adevos-X Tech platform: public website, user
dashboard (bot deployment, AV Coins, payments), and Admin App — built to run
on **MongoDB Atlas + Heroku (backend) + Vercel (frontend)**.

Everything here is wired end-to-end with **placeholder/fake content** (seeded
into the database) so the site is never empty on first launch. Nothing about
the code depends on that content being fake — replace it from the Admin App
(`/admin`) whenever you're ready, and real data flows through the same models
and routes without any code changes.

## Structure

```
adevos-x-tech/
├── backend/     Express API + MongoDB (Mongoose) — deploy to Heroku
└── frontend/    React + Vite + Tailwind — deploy to Vercel
```

## 1. What YOU need to fill in

Everything code-related is done. To go from "cloned repo" to "fully working
site," you only need to:

1. Create a **MongoDB Atlas** cluster → copy the connection string.
2. Create a **Cloudinary** account (free tier is fine) → copy cloud name/key/secret.
3. Create **Google OAuth credentials** (Google Cloud Console) for "Continue with Google".
4. Get API keys for **Paystack** and/or **PayPal** (or leave blank and only use AV Coins + Manual payment to start).
5. Get an **SMTP** login (e.g. a Gmail App Password) for email sending — optional at first.
6. Get API tokens for whichever **deployment platform(s)** you'll automate (Heroku/Railway/Render) — optional at first, deployments can be created manually until this is wired up.
7. Decide your **admin username/password** and your **Google admin email(s)**.
8. Paste all of the above into `backend/.env` (local) or Heroku Config Vars (production). See `backend/.env.example` — every required key is documented there with a comment.
9. Paste the matching public keys into `frontend/.env` (local) or Vercel Environment Variables. See `frontend/.env.example`.

That's it — no other code changes are required to have a fully functional,
non-fake site once real content is entered through `/admin`.

## 2. Local development

```bash
# Backend
cd backend
cp .env.example .env      # fill in MONGODB_URI at minimum to start
npm install
npm run seed               # populates placeholder content + creates the admin account
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Visit `http://localhost:5173/admin` and log in with the `ADMIN_USERNAME` /
`ADMIN_PASSWORD` you set in `backend/.env` (defaults to `admin` / whatever you
set — check `.env.example`).

## 3. Deploying

**Backend → Heroku**
```bash
cd backend
heroku create your-app-name
heroku config:set MONGODB_URI=... JWT_SECRET=... # etc — every key from .env.example
git subtree push --prefix backend heroku main
# or connect the Heroku app to this repo's /backend folder via the Heroku dashboard
heroku run npm run seed
```

**Frontend → Vercel**
- Import the repo in Vercel, set **Root Directory** to `frontend`.
- Add all `VITE_*` variables from `frontend/.env.example` under Project Settings → Environment Variables.
- Set `VITE_API_URL` to your deployed Heroku URL + `/api`.

**Domain** — connect your custom domain last, once both are deployed and
talking to each other correctly (update `FRONTEND_URL`/`BACKEND_URL` on the
backend and `VITE_API_URL`/`VITE_SOCKET_URL` on the frontend to the final
domain before going live).

## 4. What's fully built vs. what's a scaffold

**Fully wired (as of this update):** every content model + admin CRUD section
described in the spec, auth (email/password + Google + admin), hero
slider/services/in-touch/support/testimonials/stay-connected/footer,
hamburger menu (dynamic, with a full nested sub-item Admin builder), popups
for Updates/Tutorials/Feedback/Plan-selection wired everywhere they're
referenced (menu, footer, hero slides, in-touch cards), bots catalogue +
rating, AV Coins + referrals, newsletter subscribe, real **Heroku deployment
API** integration (create app, set config vars, build from GitHub tarball,
poll status, stream build logs live over Socket.IO, restart/stop/delete),
real **Paystack** (initialize + webhook signature verification) and **PayPal**
(create order + capture) integration, **WhatsApp Cloud API** admin
notifications for manual payment proof, **live FX rates** with caching,
email confirmations (Nodemailer), admin dashboard with a live activity feed,
and Admin sections for absolutely every area from the spec: Hero Slider,
Services, InTouch, Support (single-document form), Client Feedback,
StayConnected, Footer, Menu (with nested sub-item editor), Plans, Bots,
Payment (pending review + methods + packages), Deployment (live list +
platforms + music), AV Coins overview, Updates, Users, Responses.

**Left as a documented `TODO`** (one item — everything else is done): full
verification of PayPal's webhook signature (the primary payment-confirmation
path already works via the client-side capture call; the webhook is just a
redundant safety net you can harden later using PayPal's
`verify-webhook-signature` endpoint).

**Business decisions still yours to make** (not code gaps, just choices only
you can finalize): whether to enable Railway/Render in addition to Heroku
(the `runHerokuDeployment` pattern in `deployment.routes.js` is there to
copy for another provider), which bots' GitHub repos to point at (the seeded
ones are placeholders), and your real pricing/package numbers (editable
anytime from Admin → Payment → Packages).

## 5. Design system

- **Heading / Brand / Title** — always `Rajdhani`, always one color per theme
  (`#00E68C` dark / `#00A86B` light). Enforced via the single `.heading`
  CSS class (`frontend/src/index.css`) and the `<Heading>` component
  (`frontend/src/components/ui/Heading.jsx`) — never style a heading by hand.
- **Body / buttons** — always `Inter`.
- Colors, fonts, and spacing are all defined as Tailwind tokens in
  `frontend/tailwind.config.js` — change them once, they apply everywhere.

## 6. Hosting from a phone only

If you don't have a computer, see **`HOSTING-MOBILE.md`** in this same
folder — it walks through GitHub, MongoDB Atlas, Cloudinary, Heroku, and
Vercel entirely through their mobile-web dashboards, including how to seed
the database without a terminal (Heroku's built-in "Run console").
