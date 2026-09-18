# DKManager25

DKManager25 er en dansk React + TypeScript prototype, hvor du vælger en klub og styrer trup, transfermarked, kampe, stadion og gemte fremskridt i både browseren og en Android-wrapper via Capacitor.

## Hvad fungerer nu

- Klubbvalg på tværs af 4 danske divisioner med 12 klubber i hver (48 hold i alt)
- Fælles game state for klub, spillere, økonomi, fans, stadion og ugeforløb
- Holdspecificerede, deterministiske starttrupper med positionsfordeling, ASI, roller, skills og værdi
- Transferflow for køb, sætte til salg, annullere salg og sælge med budgetopdatering
- Stabil dobbelt round-robin ligaplan med 22 spillerunder pr. division, som kun ændres ved ny uge
- Kampsimulering med begrænsede sandsynligheder, konsistente scorelinjer og anvendte konsekvenser i game state
- Stadionudvidelser med kapacitets- og budgetopdatering
- Robust `localStorage`-indlæsning med validering og fallback til standarddata
- Minimal service worker og manifest, så den eksisterende PWA-intention ikke fejler ved registrering
- Android-projekt via Capacitor, så webspillet kan pakkes som mobil-app
- Android-venlig navigation med hardware-tilbageknap mellem faner og native statuslinje-farver
- Native gemning på Android via Capacitor Preferences og mere brandet splash-/ikonoplevelse

## Gameplay- og state-model

Spillet bruger én delt state i `src/context/GameContext.tsx`.

State indeholder:

- valgt klub (`selectedTeam`)
- spillertrup (`players`)
- budget
- antal fans (`fanCount`)
- fan mood (`fanMood`)
- stadionkapacitet (`stadiumCapacity`)
- sæson (`season`) og uge (`week`)
- historik over ligakampe (`leagueMatches`)
- antal stadionudvidelser (`stadiumUpgrades`)

Spilflowet er:

1. Vælg en klub i en af de fire 12-holds divisioner
2. Gennemgå klubbens egen trup og transfermarked
3. Spil den planlagte ligakamp i den aktuelle uge
4. Få billetindtægter og kampbonus/-tab anvendt direkte på økonomi og fans
5. Gå videre til næste uge, eller start næste sæson når kampprogrammet er færdigspillet
6. Udvid stadion, når budgettet tillader det

Kampresultater påvirker nu faktisk state:

- **Sejr:** +50 fans, +8 mood, +100.000 kr sponsorbonus
- **Uafgjort:** +10 fans, +2 mood, +25.000 kr sponsorbonus
- **Nederlag:** -20 fans, -7 mood, -30.000 kr sponsorpåvirkning
- **Alle kampe:** ugens billetindtægt lægges til budgettet ud fra `min(fans, stadionkapacitet) * 150`

## Kendte begrænsninger

- Der er stadig ingen automatiserede tests eller lint-scripts i repoet
- Klubrækkerne er baseret på aktuelle/relevante DBU-/Divisionsforeningen-referencer, men `baseRating` og spillerdata er stadig spilbalancerede prototypeværdier
- Holdsquad-navne genereres deterministisk pr. klub og er ikke tænkt som 1:1 gengivelser af virkelige spillertrupper
- Ligaforløbet er stadig en prototype med begrænset sæsonhistorik og uden op-/nedrykning
- Facilities i stadionvisningen er stadig præsentationsfelter og ikke gameplay-systemer

## Teknologi

- React 18
- TypeScript 5
- Vite
- Tailwind CSS

## Krav

- Node.js `^20.19.0 || >=22.12.0`
- npm 10+

## Installation

```bash
npm install
```

## Udvikling

```bash
npm run dev
```

Alias:

```bash
npm start
```

## Build

```bash
npm run build
```

## Browser + Android

Browser:

```bash
npm run dev
```

Android build/sync:

```bash
npm run build:mobile
```

Åbn Android-projektet i Android Studio:

```bash
npm run mobile:android
```

Når webkoden ændres, skal Android-projektet synkroniseres igen med `npm run mobile:sync` eller `npm run build:mobile`.

Byg lokal debug-APK:

```bash
npm run mobile:apk
```

Byg release-APK:

```bash
npm run mobile:apk:release
```

Byg release App Bundle (AAB):

```bash
npm run mobile:bundle
```

Bemærk: `mobile:apk:release` og `mobile:bundle` er klar til rigtig release-signering, men du skal først konfigurere en keystore.

1. Kopiér eksempel-filen:

```bash
cp android/keystore.properties.example android/keystore.properties
```

2. Udfyld din egen release-keystore i `android/keystore.properties`

Alternativt kan du sætte disse miljøvariabler i stedet:

- `DKMANAGER25_STORE_FILE`
- `DKMANAGER25_STORE_PASSWORD`
- `DKMANAGER25_KEY_ALIAS`
- `DKMANAGER25_KEY_PASSWORD`

Når signing er sat op, vil release-builds automatisk bruge den. Selve Play Store-udgivelsen kræver stadig endelig signering/keystore-håndtering og gennemgang i Android Studio eller CI.

Første Android-build kræver også adgang til Gradle/Google Maven for at hente Android build-afhængigheder, hvis de ikke allerede findes lokalt i cachen.

Android-wrapperen bruger nu en mere app-venlig opsætning med:

- native statuslinje i appens farver
- Android-tilbageknap, der går tilbage mellem faner før appen lukkes
- native persistence-spejling via Capacitor Preferences
- splash screen baseret på appens farver og launcher-ikon
- justeret layout til smallere mobilskærme

## Preview af produktionsbuild

```bash
npm run preview
```

## Manuelt verificeret i stabiliseringsrunden

- `npm install`
- `npx tsc --noEmit`
- `npm run build`
- `npm run build:mobile`
- `npm run mobile:apk`
- `npm run mobile:apk:release` er klargjort, men kræver lokal adgang til Android/Google build-afhængigheder og release-keystore
- stabil kampgenerering og build for 12-holds divisioner blev kontrolleret via TypeScript/build-verifikation
- dev-server svarede korrekt på `/`, `/manifest.webmanifest`, `/sw.js` og `/icon.svg`
- Android CLI-build blev forberedt, men fuld `assembleDebug` i denne sandbox blev stoppet af netværksadgang til `dl.google.com`

## Klubbaser og prototypedata

- Divisionerne er nu modelleret som `Superliga`, `1. division`, `2. division` og `3. division`
- Hver division har 12 klubber og et komplet hjemme/ude-program, så hvert hold spiller 22 ligakampe pr. sæson
- Når du vælger en klub, får du netop denne klubs deterministiske 18-mandstrup med stabile spiller-id'er
- Eksisterende saves indlæses fortsat via normalisering af `selectedTeam`, `players` og `leagueMatches`

### Kilder til klubvalg

- DBU / Divisionsforeningen blev brugt som primære referencepunkter for divisionsstrukturen
- Officielle/nær-officielle oversigter over 2026/27-felterne blev krydstjekket via søgninger mod Superliga, worldfootball.net, 2-division.dk og 3-division.dk, da direkte fetch mod DBU-domænet var blokeret i denne sandbox
- Klubberne er placeret i divisioner efter disse aktuelle/relevante kilder, mens ratings fortsat er gameplay-balancerede prototyper

## Repository-struktur

- `src/App.tsx` – hovednavigation mellem visninger
- `src/context/GameContext.tsx` – delt game state, persistence og økonomiopdateringer
- `src/data/leagues.ts` – 4x12 ligadata, kampprogram, simulering og stillingsberegning
- `src/data/players.ts` – deterministiske holdspecifikke trupper, spillerattributter og normalisering af gamle saves
- `src/components/` – UI for holdvalg, trup, transfermarked, kampe og stadion
- `public/manifest.webmanifest` og `public/sw.js` – minimal PWA-understøttelse
- `android/` og `capacitor.config.ts` – Android-wrapper for mobil-app
