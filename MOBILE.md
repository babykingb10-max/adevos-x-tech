# Kuhost Adevos-X Tech kwa Simu Pekee (Bila Kompyuta)

Mwongozo huu unakuonyesha jinsi ya kuweka mradi huu live ukitumia **simu tu** —
GitHub, Heroku, na Vercel zote zina dashboard za wavuti zinazofanya kazi vizuri
kwenye browser ya simu. Sehemu pekee inayohitaji "terminal" (Heroku Run Console)
pia inapatikana kwenye wavuti — si lazima kompyuta popote.

## Hatua 0 — Pata faili zako tayari

1. Pakua (download) `adevos-x-tech.zip` uliyopewa.
2. Fungua kwa file manager ya simu yako (kama ile uliyotumia kwenye picha) na
   uzi-extract (unzip) mahali unapoweza kuipata tena.

## Hatua 1 — Tengeneza akaunti zote (fanya hizi kwanza, zote ni bure kuanzia)

Fungua kila moja kwenye browser ya simu na fanya sign up:

| Huduma | Kwa ajili ya nini | Link |
|---|---|---|
| **GitHub** | Kutunza code yako | github.com |
| **MongoDB Atlas** | Database | mongodb.com/atlas |
| **Cloudinary** | Kutunza picha zilizopakiwa | cloudinary.com |
| **Heroku** | Ku-host backend | heroku.com |
| **Vercel** | Ku-host frontend | vercel.com |
| **Google Cloud Console** | "Continue with Google" | console.cloud.google.com |

## Hatua 2 — Weka code kwenye GitHub (kwa simu)

**Njia rahisi zaidi (bila app ya ziada):**
1. Fungua github.com kwenye browser, bonyeza **+** → **New repository**. Ipe
   jina `adevos-x-tech`, iwe **Private**, bonyeza Create.
2. Kwenye ukurasa wa repo, bonyeza **Add file → Upload files**.
3. Kutoka kwenye file manager yako, chagua folda ya `backend` (faili zote
   ndani yake — sio zip) na uzipakie. Kisha commit.
4. Rudia hatua hiyo hiyo kwa folda ya `frontend` — lakini kwa sababu GitHub
   web upload haiwezi ku-upload folda nzima ikiwa na sub-folda nyingi kwa
   urahisi kwenye simu ndogo, njia bora zaidi ni:

**Njia bora zaidi kwa simu — tumia "GitHub" app rasmi (Android/iOS):**
- Pakua **GitHub app** kutoka Play Store/App Store.
- App hii haina uwezo wa ku-upload folda za code moja kwa moja (bado
  inahitaji kompyuta au Termux kwa `git push` kamili). Kwa hiyo njia
  ya uhakika zaidi bila kompyuta kabisa ni:

**Njia ya uhakika 100% kwa simu — Termux (Android):**
1. Pakua **Termux** kutoka F-Droid (siyo Play Store — toleo la Play Store
   limepitwa na wakati).
2. Ndani ya Termux:
   ```
   pkg install git -y
   cd storage/downloads/adevos-x-tech   # au path ulipo-extract
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/adevos-x-tech.git
   git push -u origin main
   ```
   (Utaombwa username + Personal Access Token badala ya password — itengeneze
   kwenye GitHub: Settings → Developer settings → Personal access tokens.)
3. Kwa iPhone, tumia app kama **a-Shell** au **iSH** kwa hatua zilezile, au
   muombe rafiki mwenye laptop akusaidie hatua hii MOJA tu (ku-push GitHub) —
   baada ya hapo kila kitu kingine ni dashboard za wavuti tu.

Mara code ikiwa GitHub, huhitaji tena terminal kwa chochote kingine.

## Hatua 3 — MongoDB Atlas (database)

1. Tengeneza **Free Cluster** (M0).
2. **Database Access** → tengeneza user + password.
3. **Network Access** → **Add IP Address** → chagua "Allow access from
   anywhere" (0.0.0.0/0) ili Heroku iweze kuunganika.
4. **Connect** → **Drivers** → nakili connection string (inaanza na
   `mongodb+srv://...`) — hii ndiyo `MONGODB_URI`.

## Hatua 4 — Cloudinary (picha)

Dashboard yao ya kwanza inaonyesha moja kwa moja: **Cloud name**, **API Key**,
**API Secret**. Nakili zote tatu.

## Hatua 5 — Google Cloud Console (kwa "Continue with Google")

1. Tengeneza project mpya.
2. **APIs & Services → OAuth consent screen** → jaza jina la app.
3. **Credentials → Create Credentials → OAuth client ID** → aina: **Web
   application**.
4. Kwenye "Authorized JavaScript origins" ongeza domain zako mbili (Vercel
   URL na custom domain baadaye).
5. Nakili **Client ID** na **Client Secret**.

## Hatua 6 — Deploy Backend kwenye Heroku (dashboard tu, bila CLI)

1. Fungua dashboard.heroku.com → **New → Create new app**. Ipe jina.
2. Tab **Deploy** → Deployment method → **GitHub** → unganisha akaunti yako
   ya GitHub → chagua repo `adevos-x-tech`.
3. Kwa sababu backend iko kwenye folda ndogo (`/backend`) ndani ya repo moja,
   ongeza faili hii kwenye **mzizi wa repo** (siyo ndani ya backend/) ili
   Heroku ijue pa-anzia:
   - Tengeneza faili `app.json` kwenye mzizi (unaweza kuifanya kwa GitHub web
     editor moja kwa moja: fungua repo → Add file → Create new file):
     ```json
     { "buildpacks": [{ "url": "heroku/nodejs" }] }
     ```
   - Kwenye Heroku **Settings → Buildpacks**, ongeza:
     `https://github.com/timanovsky/subdir-heroku-buildpack` KISHA
     `heroku/nodejs` (mpangilio huu ni muhimu — subdir kwanza).
   - **Settings → Config Vars** → ongeza `PROJECT_PATH` = `backend`.
4. **Settings → Config Vars** → bonyeza **Reveal Config Vars** → ongeza KILA
   env variable kutoka `backend/.env.example` (bonyeza "Add" kwa kila moja):
   `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` (tumia
   maneno marefu ya nasibu — unaweza kuunda kwa kutumia
   passwordsgenerator.net), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_ALLOWED_GOOGLE_EMAILS`,
   `CLOUDINARY_*`, na kadhalika — kila kimoja kwenye jedwali la
   `.env.example`. Weka `NODE_ENV=production`.
   - `FRONTEND_URL` na `BACKEND_URL` — jaza baada ya hatua 7 (Vercel URL yako).
5. Tab **Deploy** → chini kabisa bonyeza **Deploy Branch** (chini ya "Manual
   deploy"). Subiri ijenge.
6. **Seed database bila terminal:** kwenye app yako, bonyeza **More** (juu
   kulia) → **Run console**. Andika:
   ```
   npm run seed
   ```
   Hii inafanya kazi sawa na kuiendesha kwenye computer — inatengeneza admin
   account na maudhui ya awali (fake content).

## Hatua 7 — Deploy Frontend kwenye Vercel

1. vercel.com → **Add New → Project** → unganisha GitHub → chagua repo hiyo
   hiyo.
2. Kwenye "Root Directory" bonyeza **Edit** → chagua `frontend`.
3. Kwenye **Environment Variables**, ongeza zote kutoka
   `frontend/.env.example`:
   - `VITE_API_URL` = `https://JINA-LA-APP-YAKO.herokuapp.com/api`
   - `VITE_SOCKET_URL` = `https://JINA-LA-APP-YAKO.herokuapp.com`
   - `VITE_GOOGLE_CLIENT_ID`, `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_PAYPAL_CLIENT_ID`
4. Bonyeza **Deploy**.
5. Baada ya kukamilika, nakili URL ya Vercel (mfano
   `https://adevos-x-tech.vercel.app`).
6. Rudi Heroku Config Vars → weka `FRONTEND_URL` = URL hiyo ya Vercel, kisha
   **Redeploy** (More → Restart all dynos, au deploy tena).

## Hatua 8 — Jaribu

- Fungua URL ya Vercel — homepage inapaswa kuonekana na maudhui ya "fake"
  (bots, services, n.k.).
- Fungua `/admin` (mfano `https://adevos-x-tech.vercel.app/admin`) — ingia
  na `ADMIN_USERNAME`/`ADMIN_PASSWORD` uliyoweka Heroku.
- Anza kubadilisha maudhui halisi kwenye Admin App.

## Hatua 9 — Domain yako (mwisho kabisa)

- Heroku **Settings → Domains** → ongeza custom domain, pata DNS target.
- Vercel **Settings → Domains** → ongeza domain yako, fuata maelekezo ya DNS.
- Kwenye msajili wa domain yako (Namecheap, GoDaddy, n.k.) — kwa kawaida hii
  pia inafanyika kwa dashboard ya wavuti, bila kompyuta.
- Baada ya domain kufanya kazi, sasisha `FRONTEND_URL`/`BACKEND_URL` (Heroku)
  na `VITE_API_URL`/`VITE_SOCKET_URL` (Vercel) kuwa domain mpya, redeploy zote
  mbili.

## Vidokezo vya ziada

- **Webhooks** (Paystack) — baada ya kuwa na Heroku URL, nenda Paystack
  dashboard → Settings → Webhooks → weka
  `https://JINA-LA-APP-YAKO.herokuapp.com/api/payments/webhooks/paystack`.
- Kila mabadiliko yajayo ya code — badilisha faili moja kwa moja kwenye
  GitHub web editor (bonyeza penseli kwenye faili lolote reponi), commit, na
  Heroku/Vercel zitajijenga upya kiotomatiki kwa sababu ya GitHub integration
  (isipokua ukichagua manual deploy kwenye Heroku — wezesha "Automatic
  Deploys" kwenye tab ya Deploy ili isiwe lazima ubofye Deploy kila mara).
