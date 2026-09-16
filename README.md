# DKManager25

DKManager25 er en dansk React + TypeScript prototype, hvor du vælger en klub og styrer trup, transfermarked, kampe, stadion og gemte fremskridt i både browseren og en Android-wrapper via Capacitor.

## Hvad fungerer nu

- Klubbvalg på tværs af fire danske ligaer
- Fælles game state for klub, spillere, økonomi, fans, stadion og ugeforløb
- Trupvisning med positionsfordeling og spilleroversigt
- Transferflow for køb, sætte til salg, annullere salg og sælge med budgetopdatering
- Stabil ugentlig kampplan, som kun ændres ved ny uge
- Kampsimulering med begrænsede sandsynligheder, konsistente scorelinjer og anvendte konsekvenser i game state
- Stadionudvidelser med kapacitets- og budgetopdatering
- Robust `localStorage`-indlæsning med validering og fallback til standarddata
- Minimal service worker og manifest, så den eksisterende PWA-intention ikke fejler ved registrering
- Android-projekt via Capacitor, så webspillet kan pakkes som mobil-app

## Gameplay- og state-model

Spillet bruger én delt state i `src/context/GameContext.tsx`.

State indeholder:

- valgt klub (`selectedTeam`)
- spillertrup (`players`)
- budget
- antal fans (`fanCount`)
- fan mood (`fanMood`)
- stadionkapacitet (`stadiumCapacity`)
- uge (`week`)
- seneste spillede kampe (`playedMatches`)
- antal stadionudvidelser (`stadiumUpgrades`)

Spilflowet er:

1. Vælg en klub
2. Gennemgå trup og transfermarked
3. Spil én kamp i den aktuelle uge
4. Få billetindtægter og kampbonus/-tab anvendt direkte på økonomi og fans
5. Gå videre til næste uge via den anvendte kampopdatering
6. Udvid stadion, når budgettet tillader det

Kampresultater påvirker nu faktisk state:

- **Sejr:** +50 fans, +8 mood, +100.000 kr sponsorbonus
- **Uafgjort:** +10 fans, +2 mood, +25.000 kr sponsorbonus
- **Nederlag:** -20 fans, -7 mood, -30.000 kr sponsorpåvirkning
- **Alle kampe:** ugens billetindtægt lægges til budgettet ud fra `min(fans, stadionkapacitet) * 150`

## Kendte begrænsninger

- Der er stadig ingen automatiserede tests eller lint-scripts i repoet
- Trupper, modstandere og købsspillere er stadig statiske prototype-data
- Der spilles kun én valgt kamp pr. uge, selv om UI viser tre mulige modstandere
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

## Preview af produktionsbuild

```bash
npm run preview
```

## Manuelt verificeret i stabiliseringsrunden

- `npm install`
- `npx tsc --noEmit`
- `npm run build`
- `npm run build:mobile`
- stabil ugentlig kampgenerering blev kontrolleret via målrettet TypeScript-kørsel
- dev-server svarede korrekt på `/`, `/manifest.webmanifest`, `/sw.js` og `/icon.svg`

## Repository-struktur

- `src/App.tsx` – hovednavigation mellem visninger
- `src/context/GameContext.tsx` – delt game state, persistence og økonomiopdateringer
- `src/game/matches.ts` – kampplan og simulationslogik
- `src/components/` – UI for holdvalg, trup, transfermarked, kampe og stadion
- `public/manifest.webmanifest` og `public/sw.js` – minimal PWA-understøttelse
- `android/` og `capacitor.config.ts` – Android-wrapper for mobil-app
