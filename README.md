# DKManager25

DKManager25 er en dansk React + TypeScript prototype, hvor du vælger en klub og styrer trup, transfermarked, kampe, stadion og gemte fremskridt i både browseren og en Android-wrapper via Capacitor.

## Hvad fungerer nu

- Klubvalg på tværs af Superliga, 1. division, 2. division og 3. division med 12 klubber i hver (48 hold i alt)
- Fælles game state for klub, spillere, økonomi, fans, stadion og ugeforløb
- Holdspecificerede, deterministiske starttrupper med positionsfordeling, ASI, roller, skills og værdi
- Transferflow for køb, sætte til salg, annullere salg og sælge med budgetopdatering
- Stabil dobbelt round-robin ligaplan med 22 spillerunder pr. division, som kun ændres ved ny uge
- Kampsimulering med 45 minutters første halvleg, 15 minutters pause og 45 minutters anden halvleg (kampuret slutter ved 90), konsistente scorelinjer og anvendte konsekvenser i game state
- Stadionudvidelser med kapacitets- og budgetopdatering
- Separate Klub- og Økonomi-sider: klubidentitet og stadionestimater under Klub; bestyrelse, finansiering, sæsonbalance, transaktionslog, lønninger, sponsorindtægter, gæld, renter og egenkapital under Økonomi
- Robust `localStorage`-indlæsning med validering og fallback til standarddata
- Minimal service worker og manifest, så den eksisterende PWA-intention ikke fejler ved registrering
- Android-projekt via Capacitor, så webspillet kan pakkes som mobil-app
- Android-venlig navigation med hardware-tilbageknap mellem faner og native statuslinje-farver
- Native gemning på Android via Capacitor Preferences og mere brandet splash-/ikonoplevelse

## Gameplay- og state-model

Spillet bruger én delt state i `src/context/GameContext.tsx`.

State indeholder:

- valgt klub (`selectedClub`, typen `Club`)
- spillertrup (`squad: { clubId, players }`), hvor `players` er et spillerregister
- tilgængelige transfers (`transferMarket`), gemt som spillerregister; køb/salg flytter samme ID mellem marked og trup
- budget
- økonomi (`economy`) med gæld, transaktioner, stadionværdi, rente og bestyrelsesstatus
- antal fans (`fanCount`)
- fan mood (`fanMood`)
- stadionkapacitet (`stadiumCapacity`)
- sæson (`season`) og uge (`week`)
- historik over ligakampe (`leagueMatches`) for alle sæsoner
- sæsonarkiv (`seasonHistory`) med sluttabel og slutplacering for hver afsluttet sæson
- antal stadionudvidelser (`stadiumUpgrades`)

Topnavigationen er **Trup, Transfer, Kampe, Stadion, Klub, Økonomi og Tabel**. De eksisterende genveje **1–6** bevares (**5** åbner Klub, **6** åbner Tabel); **7** åbner Økonomi. **Trup** viser kun den aktive, gemte spillertrup med positionsantal, ASI, individuelle værdier og spillerdetaljer – ingen bestyrelse, klubøkonomi, samlet trupværdi eller lønmasse. Spillerregister, gemte trupper og transferopdateringer er uændrede.

**Klub** viser klubidentitet, fans og stadionaktivitet. **Økonomi** viser lønmasse, bestyrelsens økonomiske vurdering, finansiering, økonomi/sæsonbalance, indtægts-/udgiftskategorier og seneste transaktioner. Begge sider bruger den samme gemte game state; navigation nulstiller ikke spillet. **Stadion** bruges fortsat til udvidelser. URL-hash og sti understøtter `club`/`klub` til Klub (`#club`) og `economy`/`okonomi`/`økonomi` til Økonomi (`#economy`). Android bruger samme webnavigation.

**Sæsonbalance** er indtægter minus udgifter for den aktuelle sæsons bevarede bogføringer. Lån, transfers og stadioninvesteringer indgår: tallet er pengestrøm, ikke et revideret overskud. Kun de seneste 180 transaktioner bevares, så sæsonbalancen og kategorisummerne kan være ufuldstændige.

**Estimeret gennemsnitligt tilskuertal** beregnes som bevaret billetsalg divideret med den fælles billetpris (150 kr) og antal forskellige bogførte billetuger i sæsonen. Visningen angiver sæson, ugeinterval og antal bevarede perioder. Det er ikke faktiske hjemmekampe eller en fuldstændig sæsonhistorik. Uden billetsalgsperioder vises **Endnu ingen tilskuerhistorik** og et særskilt aktuelt estimat `min(fans, kapacitet)`. Belægning sammenholdes med den nuværende kapacitet og vises som en tilgængelig indikator fra 0–100%; historiske kapaciteter og tilskuertal pr. kamp registreres ikke.

Spilflowet er:

1. Vælg en klub i Superliga, 1. division, 2. division eller 3. division
2. Gennemgå klubbens egen trup og transfermarked
3. Spil den planlagte ligakamp i den aktuelle uge
4. Få kampens fanpåvirkning registreret og bogfør derefter billetindtægter, sponsorindtægter, løn, drift og renter ved ugefremskridt
5. Brug Økonomi-fanen til at følge pengestrøm, transaktioner, gæld, egenkapital og bestyrelsens vurdering
6. Udvid stadion, når budgettet tillader det

Økonomimodellen bruger fortsat `budget` som kassebeholdning og beregner egenkapital som:

```text
budget + samlet trupværdi + stadionets bogførte værdi - gæld
```

Ved hver uge bogføres:

- billetsalg ud fra `min(fans, stadionkapacitet) * 150`
- deterministisk sponsorindtægt baseret på klubniveau, fans, fan mood og kampresultat
- ugentlige lønninger ud fra truppens spillerlønninger
- klub-/stadiondrift og eventuelle renter på gæld

### Spilleridentitet og migrering af saves

Optælling før og efter identitetsrettelsen: **869 unikke spilbare spiller-ID'er** = 48 klubber × 18 spillere (864) + 5 transferfrø. Det er ikke en komplet database med 1.000 spillere. `STARTER_PLAYERS` har yderligere 18 separate prototype-ID'er uden for de spilbare ligaer (887 inklusive fallback). FC Københavns 18 eksisterende frø og deres genererede ID'er er bevaret; ingen trupdata er hentet eller tilføjet.

`getTeamSquad` er en deterministisk startskabelon, ikke et ekstra ejerskab. Den valgte klub bruger kun den gemte trup, også efter salg. `getCurrentTeamSquad` viser øvrige klubbers skabeloner uden spillere, som nu findes i den aktive trup eller på det gemte marked, så flyttede spillere ikke genopstår hos deres tidligere klub. Markedet viser kun tilgængelige spillere. State-laget afgør køb ud fra det aktuelle marked og budget (ikke UI-kopiens pris), og opdaterer ejerskab, budget og bogføring samlet; gentagne/forældede køb afvises uden betaling.

Ved indlæsning bliver kendte gamle kopier (`own_buy1`, `own_buy1_1_2_1` osv.) til deres oprindelige `buy1`-ID. Registerets nøgle bliver altid spillerens indre ID. Dubletter afgøres deterministisk: først en kanonisk indre ID med matchende nøgle, derefter andre kanoniske poster, derefter gamle kopier med matchende nøgle, og til sidst øvrige kopier. Ved lige prioritet vinder leksikografisk første kildenøgle; det er ikke en vurdering af nyeste eller bedste progression. Vinderens attributter bevares gennem den eksisterende feltvalidering; dubletternes progression sammenlægges ikke. Navne bruges aldrig til identitetsdeduplikering.

Den ejede trup har forrang over eventuelle markedskopier. Ældre saves uden marked får de fem oprindelige transfer-ID'er minus allerede ejede spillere; tidligere solgte poster kan ikke genskabes, da gamle saves ikke gemte dem. Nye salg bevarer spiller og progression på markedet med samme ID. Budget, sæson, gæld og historiske betalinger nulstilles ikke, og der gives ingen retroaktive refusioner. Migreringen er idempotent. Der er ingen gemte lineup-/spillerudvalgsreferencer at omskrive; spillerudvalg i UI er lokal, ikke-persistent state.

Kampresultater påvirker nu state sådan:

- **Sejr:** +50 fans, +5 mood og bedre sponsorindtægt i ugeafslutningen
- **Uafgjort:** +10 fans, +1 mood og stabil sponsorindtægt
- **Nederlag:** -20 fans, -5 mood og svagere sponsorindtægt
- **Transfers/stadion/lån:** bogføres som egne transaktioner, så saves fortsat bruger samme `budget`, men med mere gennemsigtig økonomi

## Kendte begrænsninger

- Der er endnu ingen lint-scripts; datatests (`src/data/*.test.ts`) køres med `npx tsx --test src/data/*.test.ts`
- Klubrækkerne er baseret på aktuelle/relevante DBU-/Divisionsforeningen-referencer, men `baseRating` og spillerdata er stadig spilbalancerede prototypeværdier
- Klubspecifikke spillerfrø er implementeret, men kun et udsnit er verificeret mod eksterne trupkilder; resterende hold bruger tydelige `[fallback]`-navne pr. klub
- Ligaforløbet er stadig en prototype uden op-/nedrykning
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

Android-builds kræver Node.js `>=22.12.0` (`@capacitor/cli` 8 kræver Node 22+), JDK 21 (den genererede `android/app/capacitor.build.gradle` sætter Java 21) samt Android SDK `platforms;android-36` og `build-tools;36.0.0`.

### Android CI (GitHub Actions)

`.github/workflows/android-debug-apk.yml` kører på push/pull request mod `main` og manuelt via `workflow_dispatch` (Actions → "Build Android Debug APK" → "Run workflow"). Workflowet:

- bruger det forudinstallerede Android SDK på `ubuntu-24.04`-runneren (ikke `android-actions/setup-android`) og installerer/verificerer de nødvendige SDK-pakker eksplicit med `sdkmanager --sdk_root`
- kører `npm ci`, `npx --no-install tsc --noEmit`, `npm run build:mobile` og `./gradlew assembleDebug testDebugUnitTest lintDebug` med Node 22 og Temurin JDK 21
- uploader `android-reports` (lint-/testrapporter, 7 dage) og ved succes `android-debug-apk` (`app-debug.apk`, 14 dage)

Bemærk: GitHub opdaterer stadig de hostede runner-images, så buildet er ikke fuldt hermetisk. Instrumenterede tests (`androidTest`) køres ikke i CI, da de kræver emulator/enhed.

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
- Når alle 22 kampe er spillet, arkiveres sæsonen: kampene bevares, og sluttabellen gemmes i `seasonHistory`, så tidligere sæsoner kan ses under **Kampe** (Kamp Historie) og **Tabel**
- Ældre saves uden `seasonHistory` får automatisk genopbygget arkivet for de afsluttede sæsoner, der stadig findes kampe for
- Når du vælger en klub, får du netop denne klubs deterministiske 18-mandstrup med stabile spiller-id'er
- Eksisterende saves med `selectedTeam` og `players` migreres automatisk til `selectedClub` og `squad` uden at nulstille økonomi eller sæson. Manglende spillerdata udfyldes med klubbens starttrup; en gemt tom trup bevares. Nye saves bruger kun de nye felter, og `leagueMatches` normaliseres fortsat.

### Kilder til klubvalg

- DBU / Divisionsforeningen blev brugt som primære referencepunkter for divisionsstrukturen
- Officielle/nær-officielle oversigter over 2026/27-felterne blev krydstjekket via søgninger mod Superliga, worldfootball.net, 2-division.dk og 3-division.dk, da direkte fetch mod DBU-domænet var blokeret i denne sandbox
- Klubberne er placeret i divisioner efter disse aktuelle/relevante kilder, mens ratings fortsat er gameplay-balancerede prototyper

### Kilder til spillertrupper (snapshot: 2026-09-19)

- Primære referencesider: Transfermarkt 2026/27-holdtrupper (bruges for seedede klubber i `src/data/players.ts`)
- Verificerede klubspecifikke navne i kode: `fckoebenhavn`, `broendby`, `midtjylland`
- Øvrige klubber i `LEAGUES` bruger deterministiske, klubbundne fallback-navne markeret med `[fallback]`, så ingen trup får spillere fra andre klubber

## Repository-struktur

- `src/App.tsx` – hovednavigation mellem visninger
- `src/context/GameContext.tsx` – delt game state, persistence og økonomiopdateringer
- `src/data/leagues.ts` – 4x12 ligadata, kampprogram, simulering og stillingsberegning
- `src/data/players.ts` – deterministiske holdspecifikke trupper, spillerattributter og normalisering af gamle saves
- `src/components/` – UI for holdvalg, trup, transfermarked, kampe og stadion
- `public/manifest.webmanifest` og `public/sw.js` – minimal PWA-understøttelse
- `android/` og `capacitor.config.ts` – Android-wrapper for mobil-app
