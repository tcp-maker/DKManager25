# DKManager25

DKManager25 er en dansk React + TypeScript prototype, hvor du vælger en klub og styrer trup, transfers, kampe, stadion og gemt fremdrift i browseren.

## Status før stabiliseringsrunden

Repositoryet er under aktiv oprydning. Den nuværende prototype indeholder de centrale hovedfunktioner, men havde ved start af denne runde flere kendte problemer omkring delt game state, kampafvikling og build/PWA-opsætning.

Denne README bliver opdateret igen, når implementeringen er færdig, så den matcher den endelige funktionalitet.

## Nuværende hovedfunktioner

- Vælg en dansk klub som startpunkt
- Se din trup og spillerfordeling efter position
- Køb, sæt til salg og sælg spillere
- Spil kampe og se kamphistorik i UI
- Udvid stadion og se billetindtægter
- Gem og indlæs spillet via `localStorage`

## Kendte begrænsninger ved start

- TeamView og GameContext bruger ikke helt samme state-kontrakt
- Kommende kampe bliver regenereret for ofte
- Match-resultater vises i UI, men påvirker ikke alle relevante dele af game state konsekvent
- Service worker/PWA-opsætningen er ikke fuldt sammenhængende
- Der er endnu ikke et test-setup i repositoryet

## Gameplay- og state-model

Spillet er bygget omkring én delt game state i `GameContext`, som styrer:

- valgt klub
- budget
- spillertrup
- antal fans
- fan mood
- stadionkapacitet
- aktuel uge

UI'et er opdelt i fire hovedvisninger:

1. **Trup** – overblik over hold og spillere
2. **Transfer** – køb, salg og prisstatus
3. **Kampe** – kommende kampe og historik
4. **Stadion** – kapacitet, fans og udvidelser

## Krav

- Node.js `^20.19.0 || >=22.12.0`
- npm 10+

## Installation

```bash
npm install
```

## Udvikling

Start udviklingsserveren:

```bash
npm run dev
```

Alias:

```bash
npm start
```

## Build

Lav et produktionsbuild:

```bash
npm run build
```

## Lokal preview

```bash
npm run preview
```

## Kvalitetssikring i dette repo

Der er i øjeblikket ingen automatiserede tests eller lint-scripts i `package.json`. Stabiliseringsarbejdet verificeres derfor med:

- `npm run build`
- TypeScript-kompilering via projektets build
- manuel gennemgang af de berørte flows i browseren
