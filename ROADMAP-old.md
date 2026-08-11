# winnow — Roadmap di sviluppo (v2 — SUPERATA, tenuta per memoria storica)

> ## ⚠️ Questo era il piano iniziale. Non si lavora più da qui.
>
> Inizialmente winnow doveva essere costruito **da zero**: un worker, una coda su Postgres, una
> sandbox Podman, fingerprint semantici propri, un aggregatore e un contratto di plugin OCI. Circa
> **due anni** di lavoro part-time.
>
> Il piano attuale usa **GitHub Actions come motore** e **aggrega strumenti open source esistenti**
> (`reviewdog`, GitHub code scanning, Playwright, Semgrep, `claude-code-action`), ottenendo circa il
> 90% dello stesso prodotto in **~3 mesi**. Il perché, e cosa si perde, sono scritti in
> `docs/decisions/0008-github-actions-as-the-engine.md`.
>
> **→ La roadmap da seguire è `ROADMAP.md`.** Questo file resta solo per capire da dove si è partiti
> e perché si è cambiato: è il ragionamento, non le istruzioni.

---

> **winnow** — *reports only what your PR broke.*
>
> **Fonte di verità:** `docs/spec-v2.md` (la specifica, ex `qaforge-v2.md`). Questa roadmap non
> sostituisce la specifica: la traduce in fasi eseguibili. Dove i due documenti sembrano in
> conflitto, **vince la specifica** e la roadmap va corretta.
>
> **Per chi è scritta:** una persona che sta imparando a programmare e costruisce il progetto
> insieme a un'AI. L'AI scrive la maggior parte del codice; tu prendi le decisioni e capisci cosa
> sta succedendo. Le regole di collaborazione sono in `AGENTS.md`.

---

## Indice

**Prima delle fasi:** [Come leggere questo documento](#0-come-leggere-questo-documento) ·
[Decisioni chiuse (D1–D6)](#1-decisioni-chiuse) ·
[Cosa serve prima di iniziare](#2-cosa-serve-prima-di-iniziare) ·
[Dividere il lavoro con un'altra persona](#3-dividere-il-lavoro-con-unaltra-persona)

> **Questo documento non si legge tutto.** Per lavorare si apre **una fase sola**: quella corrente.
> Le [regole che non si negoziano in nessuna fase](#appendice-b--le-regole-che-non-si-negoziano-in-nessuna-fase)
> valgono sempre e sono l'unica parte da conoscere a memoria.

**[Parte A — v0.1](#parte-a--v01-una-cli-che-verifica-senza-ai-e-senza-server) · una CLI che verifica, senza AI e senza server**

- [Fase 0 — Fondamenta del repository](#fase-0--fondamenta-del-repository) — un progetto TypeScript vuoto ma corretto, che si esegue
- [Fase 1 — Eseguire un comando dentro un container](#fase-1--eseguire-un-comando-dentro-un-container) — `winnow run .` monta la cartella e lancia un comando isolato
- [Fase 2 — Configurazione e `winnow init`](#fase-2--configurazione-e-winnow-init) — `.winnow/config.yml`, il suo parsing validato, e il comando che lo scrive
- [Fase 3 — La pipeline a stadi, con gating](#fase-3--la-pipeline-a-stadi-con-gating) — gli stadi deterministici in sequenza, e cosa ferma la corsa
- [Fase 4 — Output SARIF e report leggibile](#fase-4--output-sarif-e-report-leggibile) — un `findings.sarif` valido e un report Markdown

*Chiude con la verifica di uscita della Parte A (§24).*

**[Parte B — v0.2](#parte-b--v02-fingerprint-e-diff) · fingerprint e diff**

- [Fase 5 — Fingerprint stabili](#fase-5--fingerprint-stabili) — un identificatore stabile per finding, più il test che lo dimostra
- [Fase 6 — Baseline e diff](#fase-6--baseline-e-diff) — la corsa sul merge-base, la sua cache, e il report `new`/`resolved`/`unchanged`
- [Fase 7 — Soppressione](#fase-7--soppressione) — `.winnow/ignore.yml` e lo stato `ignored`

*Chiude con la verifica di uscita della Parte B (§24).*

**[Parte C — v0.3](#parte-c--v03-avviare-lapplicazione-e-guidare-un-browser) · avviare l'applicazione e guidare un browser**

- [Fase 8 — Il contratto di ambiente](#fase-8--il-contratto-di-ambiente-servizi-migrazioni-seed) — far partire davvero l'app: servizi, migrazioni, dati di seed
- [Fase 9 — Playwright: le specifiche del repository](#fase-9--playwright-le-specifiche-del-repository) — eseguire i test che il repository ha già
- [Fase 10 — Smoke generato e accessibilità](#fase-10--smoke-generato-e-accessibilità) — per i repository senza test: crawl, screenshot, axe
- [Fase 11 — Ritenzione e `winnow gc`](#fase-11--ritenzione-e-winnow-gc) — le politiche di §17.2, prima che il disco si riempia

*Chiude con la verifica di uscita della Parte C (§24). Da qui in poi il progetto è annunciabile.*

**[Parte D — v0.4](#parte-d--v04-un-solo-reviewer-ai) · un solo reviewer AI**

- [Fase 12 — Separazione dei container e perimetro di sicurezza](#fase-12--la-separazione-dei-container-e-il-perimetro-di-sicurezza) — exec container senza credenziale, agent container in sola lettura
- [Fase 13 — L'adapter `claude-code`](#fase-13--ladapter-claude-code-e-il-contratto-agent-runner) — il contratto agent-runner di §12.1 e la sua prima implementazione
- [Fase 14 — Evidence tier, aggregazione, flake](#fase-14--evidence-tier-aggregazione-flake) — i cinque tier di §9.4, la dedup ordinata, la politica di ripetizione

*Chiude con la verifica di uscita della Parte D (§24).*

**[Parte E — v0.5](#parte-e--v05-il-server) · il server**

- [Fase 15 — Postgres, coda, worker, API](#fase-15--postgres-coda-worker-api) — la modalità server
- [Fase 16 — GitHub App in modalità report](#fase-16--github-app-in-modalità-report) — webhook, check run, un solo commento aggiornato in place
- [Fase 17 — Dashboard, quattro schermate](#fase-17--dashboard-quattro-schermate) — Runs, Run, Repositories, Settings
- [Fase 18 — Deploy e hardening](#fase-18--deploy-e-hardening) — VPS privato via Tailscale, gVisor come default

*All'inizio di questa parte si riapre la decisione [D2](#d2--linguaggio-typescript--deviazione-esplicita-da-54): è il suo trigger principale.*

**[Parte F — v0.6 e v1.0](#parte-f--v06-e-v10)**

- [Fase 19 — Promozione delle riproduzioni e test generati](#fase-19--promozione-delle-riproduzioni-e-test-generati-v06) — salire la scala di evidenza di §4.2
- [Fase 20 — Fix mode](#fase-20--fix-mode-v10) — un tentativo, dietro approvazione, output a patch

**In coda:** [Dopo la v1.0](#dopo-la-v10) ·
[Appendice A — Quanto tempo, onestamente](#appendice-a--quanto-tempo-onestamente) ·
[Appendice B — Le regole che non si negoziano](#appendice-b--le-regole-che-non-si-negoziano-in-nessuna-fase)

---

## 0. Come leggere questo documento

Il progetto è diviso in **6 parti** (A–F), che corrispondono alle milestone `v0.1 … v1.0` della
specifica (§24). Ogni parte contiene **fasi** piccole: una fase è un pezzo di lavoro che sta in poche
sessioni e che si può **verificare**.

Ogni fase ha sempre queste otto voci:

| Voce | Significato |
|---|---|
| **Cosa costruiamo** | il risultato concreto, in una frase |
| **Perché serve** | quale problema della specifica risolve |
| **Tecnologie** | cosa usiamo, e cosa *non* usiamo ancora |
| **File / componenti** | i file che nascono o cambiano |
| **Ordine di lavoro** | i passi, in sequenza |
| **Come verifichiamo** | il test che dice "fatto". Se non passa, la fase non è finita |
| **Cosa impari** | i concetti da capire mentre la fase viene costruita |
| **Non fare adesso** | le tentazioni da rimandare — la voce più importante di tutte |

### Tre regole di processo

1. **Non si passa alla fase successiva prima che la verifica passi.** La specifica lo dice per le
   milestone (§24: *"Do not start the next one before it passes"*); qui vale anche per le fasi.
2. **Ogni fase produce qualcosa di usabile.** Anche la Fase 1 deve poter essere lanciata dal
   terminale e mostrare un risultato.
3. **La lista "Explicitly deferred" della specifica (§24) è vincolante.** Kubernetes, testing mobile,
   fuzzing API, analytics storiche: non si toccano, nemmeno "solo per provare".

### Come lavoriamo con l'AI, in pratica

Il ciclo per ogni fase:

1. **Tu** apri la fase e dici all'AI: *"facciamo la Fase N della roadmap"*.
2. **L'AI** rilegge la fase e le sezioni della specifica citate, e ti espone un piano breve (file da
   creare, ordine, decisioni aperte) **prima** di scrivere codice.
3. **Tu** approvi o correggi. Se c'è una decisione architetturale non già scritta nei documenti,
   l'AI deve fermarsi e chiedere (vedi `AGENTS.md` §8).
4. **L'AI** implementa a piccoli passi e spiega cosa ha cambiato.
5. **Tu** esegui la verifica della fase con le tue mani. Non delegare questo passaggio: è il momento
   in cui impari davvero.
6. Si aggiorna `docs/decisions/` se sono state prese decisioni, e si fa commit.

### La regola che vale più di tutte le altre

> **Non fare merge di codice che non sai spiegare a voce.**

Se l'AI produce qualcosa che non capisci, la fase non è finita: chiedi la spiegazione, o chiedi una
versione più semplice. È l'unica difesa contro il fallimento tipico di questo modo di lavorare — un
repository che funziona e che il suo autore non sa leggere.

---

## 1. Decisioni chiuse

Tutte scritte in `docs/decisions/`, e non più riaperte se non con il trigger indicato.

### D1 — Nome: **winnow**

*Winnow*: vagliare, separare il grano dalla pula. È letteralmente `new = H \ B` (§4.1). Tagline:
*"reports only what your PR broke."*

Stato dei namespace, verificato:

| Dove | Stato |
|---|---|
| GitHub `<tuo-utente>/winnow` | **libero** (il namespace è tuo) |
| npm `winnow` | occupato (libreria GeoJSON, ferma al 2023) → si pubblica come **`@winnow/cli`** |
| Collisione nota | `winnow-rs/winnow`, 937 ⭐, parser combinator **Rust** |

La collisione è accettata consapevolmente: è una *libreria* per un pubblico diverso, non un prodotto
concorrente. Costo reale: per un paio d'anni le ricerche generiche trovano prima quello. Si compensa
con la tagline, che è ciò che le persone leggono davvero. Il nome del comando che si digita (`winnow
run .`) non è registrato da nessuna parte: è il campo `bin` di `package.json`.

### D2 — Linguaggio: **TypeScript** — deviazione esplicita da §5.4

**La specifica sceglie Go** per binario e worker, TypeScript/React per la dashboard (§5.4). Questo
progetto **devia**, e la deviazione va capita, non subita.

**Cosa dice la specifica.** Go perché tutta la superficie di dipendenze (BuildKit, Dagger, Railpack,
containerd, gVisor, tooling OCI) è in Go, e un singolo binario statico + Postgres è la storia di
self-hosting più semplice possibile. La specifica dichiara anche il costo di quella scelta: *"two
languages, and Go is a harder first language for the browser/agent glue than TypeScript would be"*.
E offre la via di fuga, con un avvertimento: *"do a v0.1 in TypeScript deliberately as a throwaway
spike, and port. **Do not drift into keeping the spike.**"*

**Perché deviamo comunque.**

1. Il vantaggio di Go **non si applica nelle fasi che farai davvero**. La decisione D4 rimanda
   Dagger: fino alla Fase 11 lanciamo `podman` come **processo esterno**, e un processo esterno lo
   lanci da Node esattamente come da Go. Le librerie Go che giustificano §5.4 entrano in gioco nella
   Parte E, tra molti mesi.
2. **Il costo dichiarato da §5.4 — due linguaggi — sparisce.** Uno solo: CLI, glue Playwright,
   dashboard React.
3. **Playwright è nativamente TypeScript**, e §26 dice che la Parte C è dove imparerai più che in
   tutto il resto del progetto.
4. **TypeScript ti serve comunque**, per React e per PoliNetwork. Go servirebbe solo qui. A parità di
   ore di studio il ritorno non è confrontabile.
5. Il rischio dominante di questo progetto **non è il debito architetturale: è che tu smetta.**
   Ottimizzare per "quale stack è migliore alla v0.5" quando la domanda vera è "ci stai ancora
   lavorando fra tre mesi" significa ottimizzare la variabile sbagliata.

**Cosa costa, detto chiaro.** Si perde il binario statico singolo, che §5.3 considera *"a large part
of the self-host value proposition"*. L'unità di distribuzione diventa un'**immagine Docker**
(`docker run winnow`) più il pacchetto `@winnow/cli` per l'uso locale: uno standard accettabile per
il self-hosting, ma è una perdita, non un pari. Secondo costo: se un giorno lavorerai seriamente su
Dagger o su gVisor programmaticamente, avrai attrito. Entrambe le cose colpiscono nella **Parte E**,
non prima.

**I tre guardrail contro la deriva.** §5.4 mette in guardia contro il *drift*, non contro la scelta.
Perché questa non sia deriva:

1. **Il layer sandbox resta sottile.** `src/sandbox/` espone `create` / `exec` / `destroy` e non fa
   altro che comporre comandi `podman`. Nessuna logica di dominio dentro. È il pezzo che si riscrive
   in un'altra lingua in due giorni.
2. **I finding restano canonici come SARIF su disco** (§17.1), non come strutture TypeScript in
   memoria. Il formato dati sopravvive al linguaggio.
3. **La rivalutazione ha un trigger scritto**, non una data vaga. Si riapre D2 quando si verifica
   **una** di queste condizioni:
   - inizio della **Parte E** (server), oppure
   - Dagger diventa necessario per davvero (D4), oppure
   - la distribuzione o il tempo di avvio della CLI diventano un problema segnalato da un **utente
     reale**, non ipotizzato.

   Fino ad allora la decisione è chiusa e non si ridiscute a ogni fase.

Questa decisione è registrata anche in inglese, nel formato richiesto da `AGENTS.md` §8, in
`docs/decisions/0002-typescript-instead-of-go.md`; la specifica §5.4 rimanda a quel file.

### D3 — Container runtime: **Podman rootless**

§15.2 impone come tier minimo *"rootless OCI, no docker socket, seccomp, dropped caps, read-only
root"*, e vieta in grassetto di montare il socket Docker in una sandbox: *"the single most common
self-hosted CI vulnerability; don't inherit it."*

Podman è rootless per default e non ha un demone con socket privilegiato da esporre per sbaglio.
Costo: parte della documentazione online assume Docker, e qualche comando va tradotto.

### D4 — Dagger: **dopo, non subito**

§5.2 sceglie Dagger e dichiara nella stessa tabella un fallback esplicito: *"plain OCI + `docker run`
if Dagger proves too heavy"*.

Fasi 1–11 con container "a mano"; **Dagger si rivaluta all'inizio della Parte C**. Motivo: nella Fase
1 devi capire cosa fa un container. Se il primo strato che incontri astrae i container, non impari il
livello sotto, e quando si rompe non sai dove guardare. Non è un cambio di architettura, è l'ordine
in cui la costruiamo, dentro un fallback che la specifica prevede.

### D5 — Licenza: **Apache-2.0**, dal primo commit pubblico

Con **DCO** (`git commit -s`) e **nessun CLA** (§27). Ri-licenziare dopo richiede il consenso di ogni
contributore, quindi si decide adesso.

Insieme: **telemetria assente** — non opt-out, assente — e `SECURITY.md` dal primo giorno, con la
posizione dichiarata di §27: *sandbox escape e credential leakage sono le uniche classi P0*.

### D6 — Repository **pubblica dal primo commit**

Perché la licenza va scelta prima del primo commit pubblico (§27), e perché sapere che è pubblica
impedisce di prendere l'abitudine di committare credenziali.

Vincoli, non negoziabili:

- Nel README, dalla prima riga: **"early development — do not run this on untrusted repositories
  yet."**
- **Nessun tag, nessuna release, nessun annuncio prima della Parte C.** È uno strumento di sicurezza:
  una sandbox a metà su cui qualcuno si fida davvero è l'unico modo in cui questo progetto può fare
  male a qualcuno.

---

## 2. Cosa serve prima di iniziare

Su Arch/Omarchy:

```bash
sudo pacman -S nodejs npm podman podman-compose git jq
sudo npm install -g pnpm      # oppure: corepack enable
node --version                # serve >= 22
```

Le dipendenze del progetto, tenute deliberatamente poche (§25: *one-person maintenance load*):

| Dipendenza | A cosa serve | Da che fase |
|---|---|---|
| `typescript`, `tsx` | linguaggio + esecuzione in sviluppo senza build | 0 |
| `vitest` | test | 0 |
| `commander` | sottocomandi della CLI | 2 |
| `yaml` | lettura di `.winnow/config.yml` | 2 |
| `zod` | validazione degli schemi | 2 |
| `fastify` | server HTTP | 15 |
| `pg` | Postgres | 15 |
| `react`, `vite` | dashboard | 17 |

Niente altro senza una decisione scritta. Ogni dipendenza è qualcosa che dovrai mantenere e capire.

### I repository cavia

winnow analizza altri progetti: senza materiale di prova non puoi verificare nulla. Prepara una
cartella `fixtures/` **accanto** al repo (non dentro):

- 2 progetti tuoi o di PoliNetwork in Node/TypeScript;
- 3 progetti open source piccoli **non scritti da te** — §24 lo richiede letteralmente nel criterio
  di uscita della v0.1: *"including 2 not written by the author"*;
- 1 progetto **volutamente rotto**, che scrivi tu, con bug piantati a mano (un 500 su una route, un
  errore di tipo, una sovrapposizione su mobile). Serve dalla Parte C.

Nel repo tieni solo `fixtures.md`: quali sono, dove stanno, a cosa servono.

---

## 3. Dividere il lavoro con un'altra persona

Se lavori con la tua amica, la divisione conta: alcune fasi le **devi** fare tu, perché sono il
sistema.

| Chi | Cosa |
|---|---|
| **Solo tu** | Parti A e B (Fasi 0–7): container, pipeline, fingerprint, diff. Sono il cuore. Se non le costruisci tu, non capirai il resto e non saprai rispondere a una domanda su di esse |
| **Lei, benissimo** | dashboard React (Fase 17), repository fixture, documentazione di deploy (Fase 18), e — la cosa più utile di tutte — **rivedere le tue PR** |
| **Insieme** | la revisione manuale dei 10 PR della Fase 13, che è lavoro di giudizio e non di codice |

Spiegare il tuo codice a una persona è il modo più veloce che esista per scoprire che non lo capivi.
Vale più di qualunque test.

---

# PARTE A — v0.1: una CLI che verifica, senza AI e senza server

**Obiettivo** (§24, v0.1): `winnow run .` funziona su 5 repository reali, di cui 2 non scritti da te,
e produce SARIF valido. Nessuna AI, nessun database, nessuna dashboard, solo Node/pnpm come
ecosistema supportato.

---

## Fase 0 — Fondamenta del repository

**Cosa costruiamo.** Un progetto TypeScript vuoto ma corretto: si esegue, ha un comando che stampa
la versione, ha licenza, e ha i documenti al posto giusto.

**Perché serve.** Perché tutte le fasi successive assumano la stessa base, e perché le decisioni di
§27 (licenza, telemetria, security policy) siano prese **prima** del primo commit pubblico.

**Tecnologie.** Node 22, pnpm, TypeScript, `tsx`, `vitest`. Per ora il parsing degli argomenti si fa
con `process.argv` a mano: `commander` arriva alla Fase 2, quando i sottocomandi saranno più di uno.
Così vedi *perché* esiste una libreria di CLI, invece di subirla.

**File / componenti.**

```
winnow/
├── package.json              # bin: { "winnow": "./dist/cli.js" }
├── tsconfig.json             # strict: true, non negoziabile
├── pnpm-lock.yaml
├── src/
│   └── cli.ts                # per ora: solo `winnow version`
├── LICENSE                   # Apache-2.0 (D5)
├── README.md                 # 10 righe + l'avviso di D6
├── SECURITY.md               # posizione P0 di §27
├── AGENTS.md
├── CLAUDE.md
├── ROADMAP.md
├── fixtures.md
├── .gitignore
└── docs/
    ├── spec-v2.md            # la specifica, dentro il repo
    └── decisions/            # un file per decisione (AGENTS.md §8), non un solo file con D1-D6
        ├── 0001-nome-winnow.md
        ├── 0002-typescript-instead-of-go.md   # già scritto — D2
        ├── 0003-podman-rootless.md
        ├── 0004-dagger-dopo.md
        ├── 0005-licenza-apache-2.0.md
        └── 0006-repository-pubblica-dal-primo-commit.md
```

**Ordine di lavoro.**

1. `pnpm init`, poi `tsconfig.json` con **`"strict": true`**. Se lo attivi dopo, la migrazione è
   dolorosa; se lo attivi adesso, TypeScript ti insegna man mano.
2. `src/cli.ts` con un solo comando: `winnow version`.
3. Script in `package.json`: `dev` (tsx), `build` (tsc), `test` (vitest).
4. `docs/spec-v2.md`: la specifica entra nel repo, versionata insieme al codice.
5. `docs/decisions/`: scrivi D1, D3, D4, D5, D6 con le motivazioni, un file ciascuna (formato
   in `AGENTS.md` §8). D2 esiste già in `0002-typescript-instead-of-go.md`.
6. `LICENSE`, `SECURITY.md`, `README.md` (con l'avviso di D6), `.gitignore`.
7. Primo commit, con `-s` (DCO). Repo pubblica.

**Come verifichiamo.** `pnpm dev version` stampa la versione. `pnpm build && node dist/cli.js
version` fa lo stesso. `pnpm test` esegue zero test senza errori. `docs/decisions/0001` risponde a
tutte e sei le domande.

**Cosa impari.** Cos'è `package.json` e cosa fa `pnpm`. Differenza fra dipendenze e devDependencies.
Cosa fa il compilatore TypeScript e perché esiste `dist/`. Perché `strict: true` è un favore che fai
a te stesso. Perché le decisioni si scrivono invece di ricordarle.

**Non fare adesso.** CI, Docker, ESLint con quaranta regole, monorepo, struttura a dieci cartelle
vuote. Un `cli.ts` va benissimo.

---

## Fase 1 — Eseguire un comando dentro un container

**Cosa costruiamo.** `winnow run .` che: prende la cartella corrente, la monta in un container Node,
esegue `pnpm install` e poi `pnpm lint`, mostra l'output e i codici di uscita, e distrugge il
container.

**Perché serve.** È il cuore meccanico di tutto il sistema. §26 lo dice esplicitamente: *"Weekend 1:
`winnow run .` in one language, one container, no fingerprints. **Prove the loop.**"* Se questo non
funziona, niente altro conta.

**Tecnologie.** Node `child_process.spawn` che invoca `podman` come processo esterno. Immagine
`node:22` con **digest fissato**, non tag (§16).

Sì: invocare il binario di podman è meno elegante di una libreria client. È anche molto più facile da
capire e da debuggare, perché ogni operazione corrisponde a un comando che puoi incollare nel
terminale a mano. È anche il guardrail 1 di D2: questo layer resta sottile.

**File / componenti.**

```
src/cli.ts
src/sandbox/sandbox.ts      # interfaccia: create / exec / destroy
src/sandbox/podman.ts       # traduzione in comandi podman concreti
src/sandbox/images.ts       # digest fissati
```

**Ordine di lavoro.**

1. **A mano, nel terminale**, esegui il container e i comandi con podman, senza scrivere codice.
   Salva i comandi funzionanti in un file di appunti. **Questo passaggio non si salta.**
2. `src/sandbox/`: `create`, `exec`, `destroy`, che eseguono esattamente quei comandi.
3. `exec` restituisce stdout, stderr ed exit code **separati**, e fa **streaming** dell'output mentre
   gira, non alla fine.
4. `destroy` garantito anche in caso di errore o `Ctrl+C`: `try/finally` più un handler su `SIGINT`.
5. Cabla `winnow run .` sulla sequenza, con i comandi ancora scritti nel codice.

**Come verifichiamo.** Su un fixture Node: `winnow run .` mostra l'output di install e lint e chiude
con un riepilogo degli exit code. Dopo l'esecuzione `podman ps -a` **non** mostra container residui.
Interrompendo con `Ctrl+C` a metà: ugualmente nessun residuo.

**Cosa impari.** Cos'è un container e in che senso è usa-e-getta. Differenza fra immagine e
container, e perché si fissa un digest invece di un tag. Cosa significa montare una cartella dentro
un container, e perché il codice del repository non deve poter toccare il tuo sistema. Cos'è un exit
code. Come si lancia un processo esterno da Node e come si legge il suo output mentre gira (stream).

**Non fare adesso.** Cache, parallelismo, Dagger, rete, configurazione, più linguaggi. Solo:
container → comando → output → distruzione.

---

## Fase 2 — Configurazione e `winnow init`

**Cosa costruiamo.** Il file `.winnow/config.yml` (§7.2), il suo parsing validato, e il comando
`winnow init` che rileva com'è fatto il progetto, ti **mostra** il piano e lo **scrive** nel
repository.

**Perché serve.** Perché i comandi non possono stare nel codice di winnow: ogni progetto ha i suoi. E
perché §7.1 punto 5 prende una posizione precisa: non si indovina per sempre in silenzio — si rileva
**una volta**, si mostra, si committa. La configurazione vive nel repository: revisionabile, viaggia
con i fork, e non si perde se il server viene ricostruito.

**Tecnologie.** `yaml` per il parsing, **`zod`** per la validazione, `commander` per i sottocomandi.
Rilevazione minima a mano: `package.json` + lockfile → gestore di pacchetti e script disponibili.

Attenzione: §7.1 delega la rilevazione a **Railpack** e a `devcontainer.json` / `compose.yml`, e §1.2
taglia esplicitamente la "matrice di rilevazione a 40 file" scritta a mano. Non lo stiamo
contraddicendo: in v0.1 l'unico ecosistema è Node/pnpm, e leggere `package.json` è una decina di
righe. La catena di precedenza completa arriva alla Fase 8, dove serve. **Se la rilevazione a mano
inizia a crescere oltre Node, quello è il segnale che è ora di Railpack** — non prima.

**File / componenti.**

```
src/config/schema.ts        # lo schema zod, che è anche la documentazione
src/config/load.ts          # lettura + validazione + errori chiari
src/detect/node.ts          # package.json → comandi proposti
src/commands/init.ts
src/commands/run.ts
src/cli.ts                  # passa a commander
```

**Ordine di lavoro.**

1. Schema `zod` che segue §7.2 **esattamente**, inclusi i campi che non useremo per mesi (`services`,
   `browser`, `budgets`, `review`). Metterli adesso significa non rifare i file di configurazione
   degli utenti dopo.
2. Loader con validazione: `version` obbligatoria; comando mancante = errore comprensibile che dice
   **quale campo** manca e **cosa scriverci**.
3. Rilevatore Node: legge gli script da `package.json`, riconosce il lockfile, propone i comandi.
4. `winnow init`: rileva → stampa il piano → chiede conferma → scrive `.winnow/config.yml`.
5. `winnow run` usa la configurazione. Se manca, dice di eseguire `winnow init`.

**Come verifichiamo.** Su tutti e 5 i fixture: `winnow init` produce un file plausibile e `winnow run
.` usa quei comandi. Corrompi il YAML a mano: l'errore dice *dove* e *cosa*, non un dump di zod. Su
un progetto senza `package.json`: messaggio onesto, non crash.

**Cosa impari.** Cos'è la serializzazione e perché YAML per la configurazione. Cos'è uno schema e
perché validare l'input al confine del sistema. Come `zod` deriva un tipo TypeScript da uno schema
runtime — è uno dei concetti più utili di tutto l'ecosistema. Come si scrive un messaggio di errore
utile: §22 ha un'opinione forte (*"names the likeliest cause and the concrete next action"*).

**Non fare adesso.** Railpack, devcontainer, compose, modalità interattiva completa, secret.

---

## Fase 3 — La pipeline a stadi, con gating

**Cosa costruiamo.** L'esecuzione strutturata degli stadi deterministici: `install` →
(`lint` | `typecheck` | `test` in parallelo) → `build`, con le regole di interruzione di §8.

**Perché serve.** Perché ordine e regole di interruzione sono una scelta di prodotto, non un
dettaglio. Le regole, dalla specifica:

- **install fallisce → stop.** Non è un finding: è un fallimento di ambiente.
- **build fallisce → stop prima dell'avvio dell'app**, e l'errore del compilatore diventa **un solo**
  finding critico. Non si eseguono altri cinque stadi che falliranno per lo stesso motivo.
- **lint / typecheck / test che falliscono non fermano la run** (sono informativi), salvo
  `require_deterministic_pass: true`.
- L'uscita anticipata **è una feature**: la run risulta `completed_early`, non "degradata".

**Tecnologie.** `Promise.all` per gli stadi paralleli, **`AbortSignal`** per timeout e cancellazione
propagata. `AbortSignal` è l'equivalente Node del `context` di Go, ed è il concetto centrale di
questa fase.

**File / componenti.**

```
src/pipeline/pipeline.ts     # orchestrazione e gating
src/pipeline/stage.ts        # tipi Stage e StageResult
src/failure/kind.ts          # la tassonomia di §22
```

La tassonomia di §22 va messa **adesso**, anche se all'inizio usiamo 4 dei suoi 11 valori
(`environment`, `dependency`, `build`, `internal`). Il punto della specifica è che **i fallimenti
infrastrutturali producono zero finding** e non devono mai somigliare a un difetto nel codice
dell'utente: se il tipo esiste dal principio, la regola è strutturale invece di essere una
convenzione da ricordare.

**Ordine di lavoro.**

1. Tipi `Stage` e `StageResult`: nome, stato, durata, exit code, log, `failureKind`.
2. Esecuzione **sequenziale** di tutti gli stadi. Prima far funzionare la sequenza.
3. Aggiungi il gating: install e build fermano, gli altri no.
4. Solo ora: parallelizza lint/typecheck/test con `Promise.all`.
5. `AbortSignal` con il timeout complessivo di `budgets.wall_clock`; alla scadenza, sandbox
   distrutta.
6. Riepilogo a schermo: uno stadio per riga, stato e durata.

**Come verifichiamo.** Rompi un fixture in tre modi e controlla il comportamento: dipendenza
inesistente in `package.json` → stop a install, `failureKind: dependency`, **zero finding**; errore
di sintassi → stop a build, **un solo** finding critico; un test che fallisce → la run arriva in
fondo. Metti `wall_clock: 10s` su un progetto lento → la run termina e non resta nessun container.

**Cosa impari.** Come funziona davvero `Promise.all` e perché serve un limite alla concorrenza. Cos'è
`AbortSignal` e perché la cancellazione deve propagarsi invece di essere gestita a mano in ogni
punto. Perché "fallimento dello strumento" e "difetto trovato" sono due cose che non vanno mai
confuse.

**Non fare adesso.** Cache tra run, retry, flake handling, stadi AI.

---

## Fase 4 — Output SARIF e report leggibile

**Cosa costruiamo.** Gli output dello strumento: un `findings.sarif` valido, e un report Markdown che
una persona legge volentieri.

**Perché serve.** SARIF 2.1.0 è il formato di interscambio (§9.1): lo emettono già nativamente
ESLint, Semgrep, CodeQL e altri, e lo consumano GitHub code scanning, SonarQube e gli IDE. Un formato
proprio costerebbe lavoro *e* perderebbe l'interoperabilità (§1.2). I dati specifici di winnow vanno
in un property bag con namespace, così il file resta SARIF valido.

Questo è anche il **guardrail 2 di D2**: i finding sono canonici come SARIF **su disco**, non come
oggetti TypeScript. Il formato dati sopravvive al linguaggio.

E il report Markdown non è cosmetica: §26 dice che se la motivazione dipende dal vedere progressi,
**il renderer va costruito presto**, perché costa poco e fa sembrare reale ogni passo successivo.

**Tecnologie.** TypeScript, JSON. Per ESLint: il suo **formatter SARIF nativo** (costo zero). Per
`tsc` e per i test runner: un piccolo convertitore scritto da noi.

**File / componenti.**

```
src/sarif/types.ts          # il minimo di SARIF 2.1.0 che ci serve
src/sarif/write.ts
src/convert/eslint.ts       # SARIF nativo → il nostro modello
src/convert/tsc.ts          # output testuale → SARIF
src/convert/build.ts        # errore di build → un finding critico
src/report/markdown.ts
src/commands/report.ts
```

**Ordine di lavoro.**

1. Leggi la struttura SARIF di §9.1 e riproducila come tipi TypeScript. **Solo** i campi che usiamo.
2. Fai emettere a ESLint direttamente SARIF e leggilo. È il percorso a costo zero.
3. Convertitore per `tsc`: output testuale → risultati SARIF.
4. Unisci in un unico `findings.sarif` per run, salvato nel layout di §17.1.
5. Renderer Markdown sul modello di §21 ("The report, concretely"): severità, messaggio, posizione.
   Righe brevi.
6. `winnow report <run-id> [--json|--sarif]` (§20).

**Come verifichiamo.** Il file passa la validazione contro lo schema SARIF 2.1.0 (`ajv` con lo schema
di schemastore, o un validatore online). Il report Markdown di un fixture rotto si legge in dieci
secondi e si capisce cosa è rotto. La cartella della run rispetta il layout di §17.1.

**Cosa impari.** Perché i formati condivisi valgono più dei formati propri. Come si fa parsing di
output testuale in modo robusto. Come si progetta un output leggibile da una persona di corsa.

**Non fare adesso.** Fingerprint (Fase 5), diff (Fase 6), evidence tier (Fase 14), HTML.

---

### ✅ Verifica di uscita della Parte A (v0.1, §24)

`winnow run .` funziona su **5 repository reali**, di cui **2 non scritti da te**, e produce **SARIF
valido**. Nessun crash inspiegabile; ogni fallimento ha un messaggio che dice cosa fare.

Da qui hai già uno strumento con un valore reale — senza AI, senza dashboard, senza database.
Fermati un momento a usarlo su qualcosa di vero prima di continuare.

---

# PARTE B — v0.2: fingerprint e diff

**Obiettivo** (§24, v0.2): su un repository con 40+ finding di lint preesistenti, una PR di una riga
riporta **esattamente 1 nuovo finding**.

Avviso dalla specifica (§26): *"Weeks 2–4: fingerprints and the diff. Hardest and highest-value part.
**Do not skip ahead to AI.**"* Questa è la parte difficile e la parte che rende il prodotto utile. La
tentazione di saltarla per collegare un'AI e vedere qualcosa di spettacolare è la tentazione che
uccide il progetto.

---

## Fase 5 — Fingerprint stabili

**Cosa costruiamo.** Un identificatore stabile per ogni finding, e un test automatico che dimostra
che è stabile.

**Perché serve.** Perché tutto il resto ne dipende: il diff, la soppressione, la risposta a "questo è
stato risolto?" (§1.4, §9.3). **Un finding il cui fingerprint è instabile non può essere diffato
mai.**

La formula (§9.3):

```
fingerprint = H( source_kind , rule_id , normalized_location , semantic_key )
```

Le due sottigliezze che decidono tutto:

- `normalized_location` è il percorso **più un hash del contesto sintattico circostante**, **non** il
  numero di riga. I numeri di riga si spostano a ogni modifica non correlata, e farebbero sembrare
  nuovo tutto.
- `semantic_key` cambia per tipo di sorgente: per i finding runtime è
  `metodo + template-della-route + status + classe-di-errore`; per quelli visivi
  `pagina + ruolo-del-componente + classe-di-difetto`; per quelli AI una chiave derivata dal titolo,
  minuscola e senza stopword — **deliberatamente grossolana**, perché fingerprint troppo precisi sui
  finding AI rompono il diff.

E la regola di onestà: se una sorgente non riesce a produrre fingerprint stabili, i suoi finding
vengono marcati `undiffable` e raggruppati a parte. **Degradare in modo onesto è meglio di un diff
sbagliato.**

**Tecnologie.** `node:crypto` per SHA-256. Per il contesto sintattico basta una normalizzazione
testuale (N righe attorno, spazi collassati, letterali normalizzati): un parser vero non serve
ancora.

**File / componenti.**

```
src/fingerprint/fingerprint.ts
src/fingerprint/location.ts
src/fingerprint/fingerprint.test.ts
test/fixtures/…              # repository minimo per i test di stabilità
```

**Ordine di lavoro.**

1. **Prima i test, poi il codice.** È l'unica fase in cui vale davvero la pena: i casi di test *sono*
   la specifica del comportamento.
2. Casi che devono dare lo **stesso** fingerprint: righe aggiunte sopra il problema; rinomina di una
   variabile lontana; riformattazione del file; aggiornamento di versione dello strumento a problema
   invariato (§9.3 lo richiede: *"stable across tool version bumps"*).
3. Casi che devono dare fingerprint **diverso**: problema diverso; stesso problema in un altro file;
   regola diversa.
4. Implementa fino a far passare i test.
5. Aggiungi il flag `undiffable` per le sorgenti che non garantiscono stabilità.
6. CI: il test di stabilità gira contro il fixture con **due digest di strumento diversi** (N-1 e N)
   e asserisce l'uguaglianza dei fingerprint (§9.3).

**Come verifichiamo.** I test passano. Poi il test manuale, che è quello che conta: esegui winnow su
un fixture, aggiungi 20 righe di commento in cima a un file, esegui di nuovo. **Tutti** i fingerprint
devono essere identici. Se anche uno cambia, la fase non è finita.

**Cosa impari.** Cos'è una funzione di hash e cosa significa "stabile" per un identificatore. Come si
scrivono test che descrivono un comportamento invece di ricopiare l'implementazione. Perché
l'identità di un oggetto è un problema di progettazione e non un dettaglio.

**Non fare adesso.** Fingerprint per i finding runtime e AI (arrivano quando quelle sorgenti
esisteranno). Clustering. Database.

---

## Fase 6 — Baseline e diff

**Cosa costruiamo.** L'esecuzione sul merge-base, la cache di quel risultato, e il report che
distingue `new` / `resolved` / `unchanged`.

**Perché serve.** È il cambiamento più importante di tutto il documento (§1.3): *"Report = **diff** of
findings vs the merge base."* Senza questo ogni report di PR è sepolto dal rumore preesistente e
nessuno lo legge (§4.1).

```
new       = H \ B      ← questo è il report
resolved  = B \ H      ← mostralo come una vittoria
unchanged = H ∩ B      ← collassato, una riga, espandibile
```

Note di implementazione dalla specifica:

- La baseline è **in cache per SHA del commit + profilo + digest del lockfile degli strumenti**. Un
  repository con un `main` attivo colpisce la cache quasi sempre; solo la baseline a freddo costa 2×.
- Se la baseline **fallisce** per motivi infrastrutturali, il report della head viene pubblicato
  **senza** il diff e **segnalato come tale**. Mai presentare in silenzio finding non diffati come se
  fossero nuovi.

**Tecnologie.** `git merge-base` via `spawn`, cache su filesystem. Niente database ancora.

**File / componenti.**

```
src/git/mergeBase.ts
src/baseline/cache.ts        # chiave = sha + profilo + digest lockfile
src/diff/diff.ts             # insiemi: new / resolved / unchanged
src/report/markdown.ts       # aggiornato: sopra la piega solo new e resolved
```

**Ordine di lavoro.**

1. `winnow run . --base main`: calcola il merge-base, esegue due run, confronta gli insiemi.
2. Report aggiornato: `NEW 2 · RESOLVED 1 · UNCHANGED 34 ▸`, come in §21.
3. Cache su disco con la chiave a tre componenti. Alla seconda esecuzione la baseline non si
   ricalcola.
4. Gestione del fallimento della baseline: report pubblicato, diff assente, avviso in testa.
5. Invalidazione: cambia il lockfile degli strumenti → la baseline si ricalcola.

**Come verifichiamo.** Il criterio di §24, verificabile alla lettera: su un repository con 40+
finding di lint preesistenti, una PR di una riga che introduce **un** problema riporta **esattamente
1** nuovo finding. Poi: due esecuzioni di fila → la seconda molto più veloce (cache). Poi: sabota la
baseline (comando install rotto sul commit base) → il report esce con l'avviso, **non** con 40 falsi
"nuovi".

**Cosa impari.** Cos'è un merge-base e perché non è "il branch main di adesso". Operazioni fra insiemi
(`Set` in JavaScript). Cache: chiave, invalidazione, e perché la chiave sbagliata è peggio di nessuna
cache.

**Non fare adesso.** Baseline nel database, baseline condivise fra macchine, diff dei finding AI.

---

## Fase 7 — Soppressione

**Cosa costruiamo.** Il file `.winnow/ignore.yml` (§9.5) e lo stato `ignored`.

**Perché serve.** §1.4 punto 3 è secco: senza soppressione, *"users abandon the tool at the first
40-finding report."* Regole: la **ragione è obbligatoria**; la scadenza è opzionale ma incoraggiata e
viene segnalata quando scade. Le soppressioni **vivono nel repository**, non nel database:
revisionabili, forkabili, e non si perdono se ricostruisci la VPS.

**Tecnologie.** `yaml`, `zod`, glob per i path.

**File / componenti.**

```
src/suppress/suppress.ts
src/suppress/suppress.test.ts
```

**Ordine di lavoro.**

1. Parsing del formato di §9.5: per `fingerprint`, oppure per `rule` + `paths`.
2. Ragione mancante → **errore di validazione**, non un avviso.
3. Applicazione **dopo** il diff: uno stato `ignored`, non una cancellazione — il finding resta
   contabilizzato.
4. Scadenza superata → la soppressione decade e viene segnalata nel report.
5. Riga di riepilogo: quanti soppressi, quanti in scadenza.

**Come verifichiamo.** Sopprimi un fingerprint: scompare dal corpo del report e appare nel conteggio.
Ometti la ragione: errore chiaro. Metti una scadenza nel passato: il finding ricompare con la nota.

**Cosa impari.** Perché uno stato è meglio di una cancellazione. Perché una configurazione che
richiede una motivazione produce comportamenti diversi da una che non la richiede.

**Non fare adesso.** UI di soppressione, soppressione automatica, soppressione nel database.

---

### ✅ Verifica di uscita della Parte B (v0.2, §24)

Su un repository con 40+ finding di lint preesistenti, una PR di una riga riporta esattamente 1 nuovo
finding.

**Questo è il punto in cui winnow diventa un prodotto** e non un aggregatore di linter. Se hai tempo
per una cosa sola in tutto il progetto, che sia questa.

---

# PARTE C — v0.3: avviare l'applicazione e guidare un browser

**Obiettivo** (§24, v0.3): una PR volutamente rotta (un 5xx all'invio di un form, una sovrapposizione
su mobile) viene catturata su un progetto reale, con una trace allegata, **due volte di fila**.

§26: *"Month 2: app boot + Playwright. **This is where you'll learn the most.**"*

**Da rivalutare all'inizio di questa parte:** la decisione **D4** su Dagger. Adesso la pipeline ha
stadi paralleli, servizi, cache e più container: è il momento in cui Dagger inizia a ripagare. L'AI
deve presentarti il confronto (cosa si guadagna, cosa si riscrive, e che una libreria Dagger per Node
esiste ma è meno matura di quella Go) e la decisione va scritta. Se la risposta è "sì, Dagger", si
riapre anche **D2**, perché è uno dei suoi trigger.

---

## Fase 8 — Il contratto di ambiente (servizi, migrazioni, seed)

**Cosa costruiamo.** La capacità di far partire davvero l'applicazione: database, migrazioni, dati di
seed, variabili d'ambiente, healthcheck, teardown.

**Perché serve.** È l'omissione più grave della v1 secondo la specifica stessa (§7.3). Una vera
applicazione web non parte con `pnpm dev` e nulla altro: *"In practice it is where most runs will
die."* La v1 trattava l'avvio come una freccia in un diagramma; la v2 lo rende un contratto di prima
classe (§1.3).

Le regole (§7.3):

- **Se il repository ha già un compose file o un devcontainer, si usa quello.** Non si ri-deriva la
  sua topologia.
- Se non ha nessuno dei due, winnow fornisce i servizi da `services:` ed esegue i passi `setup:` in
  ordine, ciascuno con il proprio timeout e la propria cattura dei log.
- **I dati di seed sono responsabilità del repository, e winnow lo dice ad alta voce.** Il messaggio
  di fallimento onesto di §7.3 è molto meglio di un tentativo euristico di indovinare.
- **Un repository senza un'app web avviabile riceve semplicemente il profilo `quick`.** Degradare con
  grazia batte fallire in modo misterioso. Il downgrade va dichiarato nell'intestazione della run.
- Volumi dei servizi **sempre effimeri**, distrutti con la sandbox. Mai un volume persistente
  condiviso fra run.

**Tecnologie.** Podman con una rete dedicata per run, Postgres come primo servizio, healthcheck HTTP.
Qui entra la catena di precedenza completa di §7.1 (config → devcontainer → compose → Railpack →
interattivo).

**File / componenti.**

```
src/env/resolve.ts           # precedenza di §7.1
src/env/services.ts          # avvio servizi, attesa healthy, teardown
src/env/setup.ts             # passi setup:, timeout e log per passo
src/env/boot.ts              # avvio app + healthcheck + bootTimeout
src/env/failure.ts           # i messaggi di §7.3
src/profile/profile.ts       # quick | web | deep (§6) + downgrade
```

**Ordine di lavoro.**

1. Rete per-run e avvio di **un solo** servizio (Postgres), attesa "healthy", teardown.
2. Passi `setup:` in sequenza, con timeout e log separati per passo.
3. Avvio app + polling dell'healthcheck fino a `bootTimeout`.
4. I messaggi di fallimento. **Copia la forma esatta di §7.3**: causa probabile, log allegati, e la
   frase *"This is an execution failure. No findings were produced."*
5. Downgrade automatico a `quick` quando non c'è un'app avviabile, dichiarato nell'intestazione.
6. Solo ora: precedenza `devcontainer` / `compose` / Railpack.

**Come verifichiamo.** Su un progetto reale con Postgres: l'app diventa healthy e i servizi
scompaiono dopo la run. Rimuovi il passo di migrazione: il messaggio spiega esattamente cosa
aggiungere. Punta winnow su una libreria senza app web: downgrade a `quick`, nessun errore. E la
verifica che §25 considera **fatale**: **10 repository diversi**, e per ognuno o l'app parte, o il
messaggio di errore è utile.

**Cosa impari.** Come parlano fra loro i container su una rete. Cosa sono migrazioni e dati di seed.
Perché l'idempotenza conta (§7.2: il seed *"MUST be idempotent and non-destructive"*). Come si scrive
un fallimento che insegna qualcosa a chi lo legge.

**Non fare adesso.** Browser, secret sigillati (Fase 16), object storage, mail catcher.

---

## Fase 9 — Playwright: le specifiche del repository

**Cosa costruiamo.** Lo stadio browser: se il repository ha già test Playwright, li eseguiamo, e
catturiamo tutto ciò che va storto durante l'esecuzione.

**Perché serve.** I test del repository sono il segnale più affidabile disponibile (§13, preferenza
1). E la cattura del contorno — errori di console, eccezioni non gestite, richieste fallite, 5xx,
HAR, trace, screenshot — è ciò che produce finding di tier `reproduced`, il più alto della scala di
evidenza (§9.4).

**Tecnologie.** Playwright nella sua immagine ufficiale con **digest fissato**. winnow lo lancia come
container e legge i suoi artefatti. Qui il tuo TypeScript passa da "un pochino" a reale, perché è la
prima volta che leggi codice Playwright vero (quello dei repository fixture).

**File / componenti.**

```
src/browser/playwright.ts    # esecuzione container, raccolta artefatti
src/browser/capture.ts       # console, network, 5xx, eccezioni
src/convert/playwright.ts    # risultati + cattura → SARIF
src/artifacts/store.ts       # layout di §17.1
```

**Ordine di lavoro.**

1. Rileva la presenza di specifiche Playwright nel repository.
2. Esegui nel container, con l'app raggiungibile sulla rete della run.
3. Raccogli gli artefatti: trace zip, screenshot, HAR, video se prodotti.
4. Cattura console / eccezioni / richieste fallite / 5xx **in una sessione sola** dove possibile (§8).
5. Converti in SARIF, con `reproduction` e `artifacts` nel property bag di §9.1.
6. Screenshot a due viewport: `1280x800` e `390x844` (§7.2).

**Come verifichiamo.** Su un progetto con test Playwright: i test girano dentro winnow e i fallimenti
diventano finding con la trace allegata. Apri la trace con `npx playwright show-trace`: si vede
l'esecuzione. Un 500 provocato a mano compare come finding con la richiesta esatta.

**Cosa impari.** Cosa fa un browser headless. Cos'è una trace e perché vale più di uno screenshot.
Come si collegano container diversi che devono parlarsi. Perché un artefatto è parte del prodotto e
non un file di scarto.

**Non fare adesso.** Smoke generato (Fase 10), esplorazione con agente (Parte F), pixel diff,
ispezione visiva semantica.

---

## Fase 10 — Smoke generato e accessibilità

**Cosa costruiamo.** Per i repository **senza** test Playwright: una suite di smoke generata — crawl
delle route raggiungibili da `/` con limite di profondità, asserzione 2xx, nessuna eccezione non
gestita, screenshot di ognuna. Più un passaggio `axe-core`.

**Perché serve.** È la preferenza 2 di §13, e riguarda la maggioranza dei repository reali.
L'accessibilità con axe è indicata dalla specifica come *"cheap, deterministic, high signal"*, e come
la cosa che rende lo strumento utile anche sui repository dove non è rotto niente (§13).

**Tecnologie.** Playwright, `axe-core` nella stessa sessione. Il crawl è deterministico con seed
fissato, registrato nel manifest (§16: `seeds: { browser_crawl: 42 }`).

**File / componenti.**

```
src/browser/smoke.ts
src/browser/crawl.ts
src/browser/axe.ts
src/convert/axe.ts
```

**Ordine di lavoro.**

1. Crawl con limite di profondità e di numero di route, deterministico.
2. Per ogni route: status, eccezioni, screenshot ai due viewport.
3. axe nella stessa sessione, risultati → SARIF.
4. Fingerprint per i finding di browser e a11y, seguendo `semantic_key` di §9.3.
5. Verifica che i fingerprint siano stabili fra due esecuzioni identiche.

**Come verifichiamo.** Su un'app senza test: lo smoke trova le route principali e produce screenshot.
Due esecuzioni di fila producono gli **stessi** fingerprint (se no, il diff è inutile per questa
sorgente e va marcata `undiffable`). Un problema di a11y introdotto a mano compare come nuovo.

**Cosa impari.** Cos'è un crawl e perché serve un limite. Cos'è l'albero di accessibilità. Perché un
output non deterministico rompe il diff, e cosa si può fare al riguardo.

**Non fare adesso.** Baseline di pixel diff — §1.2 taglia il workflow di approvazione, e §13 vieta di
generare baseline automaticamente: *"a first-run baseline is meaningless."*

---

## Fase 11 — Ritenzione e `winnow gc`

**Cosa costruiamo.** Le politiche di ritenzione di §17.2 e il comando `winnow gc`.

**Perché serve.** Non è opzionale: le trace e i video di Playwright pesano da decine a centinaia di MB
per run, e *"a single VPS fills in days"* (§1.4 punto 7, §17.2). La specifica impone anche il
**quando**: il pannello di uso disco e `winnow gc` escono **nella stessa release dello stadio
browser**, non dopo.

Le regole (§17.2): SARIF e manifest sono piccoli e si conservano per l'intera finestra della run; i
blob pesanti scadono presto. `default: 14d`, `failed_runs: 60d`, gli artefatti referenziati da una PR
aperta si tengono, `max_disk: 40GB` con eviction dai più vecchi.

**File / componenti.**

```
src/retention/policy.ts
src/retention/gc.ts
src/commands/gc.ts
```

**Ordine di lavoro.**

1. Politica dalla configurazione, con i default di §17.2.
2. **`winnow gc --dry-run` prima**: stampa cosa cancellerebbe. Il dry-run esiste sempre prima
   dell'operazione distruttiva.
3. Eviction per età, poi per tetto di disco.
4. SARIF e manifest esclusi dall'eviction.
5. Riepilogo di uso disco nell'output della CLI.

**Come verifichiamo.** Genera una ventina di run: `gc --dry-run` elenca i candidati corretti, `gc`
libera spazio e i SARIF restano. Abbassa `max_disk` a un valore piccolo: l'eviction parte dai più
vecchi.

**Cosa impari.** Perché un sistema che scrive su disco senza politica di cancellazione è un sistema
rotto. Perché un `--dry-run` esiste prima dell'operazione distruttiva.

**Non fare adesso.** S3, ritenzione nel database, UI.

---

### ✅ Verifica di uscita della Parte C (v0.3, §24)

Una PR volutamente rotta (5xx all'invio, sovrapposizione su mobile) viene catturata su un progetto
reale, con trace allegata, **due volte di fila**. E il controllo di rischio di §25: validata contro
**10 repository diversi**.

Da qui winnow fa una cosa che pochi strumenti fanno: avvia l'applicazione, la guida, e riporta solo
ciò che il tuo branch ha cambiato. Ancora zero AI.

**Questo è anche il punto in cui il progetto può avere un tag `v0.3.0` e un annuncio** (vedi D6).

---

# PARTE D — v0.4: un solo reviewer AI

**Obiettivo** (§24, v0.4): su 10 PR, i finding di origine AI mostrati per default (cioè non
speculativi) sono **almeno il 50% veri positivi** alla revisione manuale, con **zero API key
configurate**. Se il tasso non ci arriva, il prompt o il gating sono sbagliati: si correggono
**prima** di aggiungere un secondo provider.

§26: *"Month 3+: server, or one AI reviewer. **Not both.**"* Questa roadmap mette prima l'AI, perché
il criterio di uscita v0.4 non richiede il server, mentre il server senza reviewer è infrastruttura
senza contenuto.

---

## Fase 12 — La separazione dei container e il perimetro di sicurezza

**Cosa costruiamo.** La divisione fra **exec container** (esegue codice, **nessuna** credenziale
dell'agente) e **agent container** (ha la credenziale, workspace in **sola lettura**, egress verso il
solo endpoint del modello), più il proxy di egress con allowlist e lo stripping dei file di
configurazione per agenti presenti nel repository.

**Perché serve.** Perché questo *è* il progetto di sicurezza (§5.1, §12.3). Una credenziale da
abbonamento è **peggiore di una API key da perdere**: non è limitata a un progetto, non ha tetto di
spesa, revocarla interrompe il lavoro quotidiano del proprietario, e dà accesso a un account intero,
non a una riga di fatturazione.

Il riassunto onesto di §12.3: *la modalità abbonamento è sicura quando la credenziale vive in un
container che solo legge. Non è sicura se prendi la scorciatoia di montare `~/.claude` in un container
che esegue `npm install` sul repository di qualcun altro.*

Le sei regole di §12.3 **non sono opzionali**. In particolare:

- L'agent container **non esegue mai gli script del repository**. Se serve eseguire qualcosa, il
  comando torna all'orchestratore, viene confrontato con una allowlist, ed eseguito nell'exec
  container — che non ha credenziali.
- I file di configurazione per agenti presenti nel repository (`CLAUDE.md`, `AGENTS.md`,
  `.claude/settings.json` con hook, `.mcp.json`, `.codex/config.toml`, regole execpolicy) vengono
  **rimossi dalla vista dell'agente**: sono configurazione che un repository ostile sarebbe felice di
  controllare. winnow fornisce il proprio file di settings e usa i flag dei CLI per imporlo. Se
  servono all'analisi, vengono mostrati come **evidenza inerte fra virgolette**, mai come istruzioni.
- L'**egress durante lo stadio agente è un solo host**. Ogni byte è loggato. È questo che trasforma
  "un'istruzione iniettata ha detto all'agente di fare POST del token altrove" da violazione a
  richiesta bloccata in `egress.log`.

**Tecnologie.** Podman con rete separata per container, un proxy HTTP con allowlist, bind mount in
sola lettura, filtro di redazione sui log.

**File / componenti.**

```
src/sandbox/planes.ts        # exec vs agent
src/sandbox/egress.ts        # proxy + allowlist + egress.log
src/sandbox/strip.ts         # rimozione config per agenti
src/secrets/redact.ts        # redazione dei valori nei log
src/secrets/planes.ts        # i 4 piani di §15.4
docs/security/threat-model.md
```

**Ordine di lavoro.**

1. **Scrivi prima il documento**: threat model di §15.1 e i quattro piani di secret di §15.4. Serve a
   te per capire *cosa* stai costruendo.
2. Due container distinti nella stessa run, con permessi diversi. Verifica **a mano** che l'agent
   container non possa scrivere nel workspace.
3. Proxy di egress in default-deny, con `egress.log` come artefatto.
4. Stripping dei file di configurazione per agenti, con test.
5. Filtro di redazione applicato a tutti i flussi di log della run.
6. **Test negativi:** un fixture ostile che *tenta* di leggere la credenziale e di fare una richiesta
   esterna. Entrambi i tentativi devono comparire nei log come bloccati.

**Come verifichiamo.** Il fixture ostile fallisce in modo visibile. `egress.log` esiste e contiene i
tentativi. Un `CLAUDE.md` piantato nel fixture non arriva all'agente come istruzione. Cercando la
credenziale in **tutti** gli artefatti e i log della run: nessun risultato.

**Cosa impari.** Cos'è un threat model. Cosa significa "privilegio minimo" in concreto. Cos'è la
prompt injection e perché la difesa è architetturale, non testuale (§3.6: *"Model output is data,
never control flow"*). Perché il default-deny in rete copre due rischi contemporaneamente.

**Non fare adesso.** gVisor (Fase 18), microVM, multi-tenancy.

---

## Fase 13 — L'adapter `claude-code` e il contratto agent-runner

**Cosa costruiamo.** Il contratto agent-runner di §12.1 e la sua prima implementazione: Claude Code
in modalità non interattiva, con autenticazione da abbonamento.

**Perché serve.** §12 fa una scelta di prodotto precisa: *"Primary mode: the subscriptions you
already pay for."* Uno strumento QA self-hosted che funziona solo dopo aver collegato un account di
fatturazione a consumo è uno strumento che la maggior parte degli sviluppatori individuali non
accenderà mai. E un contratto solo, invece di una matrice Provider × Model × Role, tiene gli adapter
a ~200 righe ciascuno.

Il contratto (§12.1):

```
agent-runner (immagine OCI)
  stdin:  { task, workspace_path, diff, prior_findings, instructions, budgets, allowed_tools }
  stdout: SARIF (findings) | patch | test files
  effetti collaterali: solo dentro la sandbox
```

**La forma del prompt conta** e §12.8 la detta: prima l'evidenza, poi la domanda. Diff, output dei
test falliti, errori di console, richieste fallite e risultati degli analizzatori sono **allegati**;
la richiesta è di riportare solo i difetti che *non* sono già negli allegati, con la riproduzione
minima. E la frase che la specifica dice riduce in modo misurabile i finding inventati: **"Empty
output is a valid answer."**

Autenticazione (§12.2): `claude setup-token` genera un token OAuth valido un anno, pensato per CI e
script, richiede un piano Pro/Max/Team/Enterprise, e può solo fare richieste al modello. Due dettagli
reali: `ANTHROPIC_API_KEY` ha precedenza più alta e va **disattivata**; e `--bare` sarebbe il modo più
pulito di ignorare hook e `CLAUDE.md` locali ma **non legge** il token OAuth — quindi in modalità
abbonamento si usa un file di settings esplicito (§12.3, nota alla regola 2).

Degradazione (§12.4, §22): su una risposta di quota la run **non fallisce**. I finding deterministici
e di browser vengono pubblicati, lo stadio è marcato `skipped: agent_quota`, la run è ritentabile. Una
corsia sola per account (`agent_lanes: { claude-code: 1 }`), perché un abbonamento è di fatto a corsia
unica. `agent_quota` è **atteso** in modalità abbonamento e non deve mai somigliare a un difetto nel
codice dell'utente.

**File / componenti.**

```
src/agent/contract.ts        # input/output di §12.1 (schema zod)
src/agent/runner.ts
src/agent/claudeCode.ts      # l'adapter
src/agent/prompt.ts          # la forma di §12.8
src/agent/budget.ts          # §23
src/agent/lanes.ts           # §12.4
src/commands/agents.ts       # `winnow agents login` / `status`
```

**Ordine di lavoro.**

1. Contratto come schema `zod`, **prima** di qualunque adapter.
2. Un adapter **finto** che restituisce SARIF fisso, per collaudare il resto della pipeline.
3. Adapter reale: `claude -p` con `--output-format json`, `--max-turns`, `--allowedTools`,
   `--disallowedTools "Write,Edit"`, `--settings`, `--strict-mcp-config`.
4. Validazione dello schema **prima** che l'output tocchi il control plane (§12.7): ciò che non si
   parsifica è un **fallimento di stadio**, non un finding.
5. Budget di §23 imposti da noi (turni, wall clock, token), perché un abbonamento non ha un tetto di
   spesa proprio.
6. Corsia singola, degradazione su quota, `agent_auth` come avviso in Settings e non come fallimento
   della run.
7. Registra ciò che il CLI riporta (`num_turns`, `duration_ms`, `total_cost_usd`) come **consumo**,
   mai come "il tuo costo" (§12.4).

**Come verifichiamo.** Il criterio di §24, che richiede lavoro manuale e non si può automatizzare: **10
PR reali**, revisione a mano dei finding AI non speculativi, tasso di veri positivi **≥50%**, con
**zero API key configurate**. Tieni il conteggio in un file nel repo. Se il tasso manca, si sistema il
prompt o il gating — non si aggiunge un altro provider.

Test aggiuntivi: esaurisci la quota di proposito → i risultati deterministici escono comunque, stadio
`skipped: agent_quota`. Fai restituire all'agente spazzatura non parsificabile → fallimento di stadio,
zero finding.

**Cosa impari.** Cosa significa "modalità non interattiva" e perché un output strutturato vale più di
testo libero. Perché si valida l'output di un modello prima di usarlo. Cos'è un budget e perché lo
impone il chiamante. Perché "output vuoto è una risposta valida" cambia il comportamento del modello.

**Non fare adesso.** Adapter `codex-cli` (subito dopo, ma è la fase successiva), adapter API key,
secondo reviewer, cross-corroborazione (§1.2: differita a post-1.0), fix mode.

---

## Fase 14 — Evidence tier, aggregazione, flake

**Cosa costruiamo.** I cinque tier di evidenza (§9.4), la deduplicazione ordinata (§10) e la politica
sui flake (§11).

**Perché serve.** Perché è ciò che tiene lo strumento credibile alla terza esecuzione. §9.4 è
esplicito: il collasso per default dei finding `speculative` **è una decisione di prodotto, non un
dettaglio di presentazione**. E la confidenza non è mai autodichiarata da un modello: i modelli
propongono, **l'aggregatore assegna** (§9.2, §1.3).

I tier: `reproduced` → `deterministic` → `analyzer` → `corroborated` → `speculative`. Solo l'ultimo è
collassato per default.

La deduplicazione, dal più economico (§10):

1. fingerprint identico → unisci, unisci le evidenze, tieni il tier più alto;
2. stessa posizione + stessa famiglia di regole → unisci;
3. **finding runtime + finding di analizzatore o AI sullo stesso simbolo o sulla stessa route →
   unisci, e l'evidenza runtime promuove tutto il gruppo a `reproduced`.** Qui il progetto
   multi-sorgente ripaga;
4. clustering con LLM **solo** per i residui di origine AI, solo sopra i ~5, con un tetto e con cache
   per hash del contenuto. **Mai** sul percorso di merge dei finding deterministici.

I flake (§11): un finding di browser o di agente proposto a tier `reproduced` deve riprodursi **almeno
2 volte su 3**. 1 su 3 → scende a `speculative`, etichettato `flaky`, e **non blocca mai** un check. I
test esistenti che falliscono e poi passano al retry sono segnalati come test flaky, non come bug del
prodotto. Il tasso di flake per fingerprint si traccia fra le run, e sopra soglia scatta la quarantena
visibile.

**File / componenti.**

```
src/evidence/tier.ts
src/aggregate/dedup.ts
src/aggregate/promote.ts     # la promozione di §10 punto 3
src/flake/policy.ts
src/flake/history.ts
src/report/markdown.ts       # aggiornato: tier e collasso
```

**Ordine di lavoro.**

1. Tier come tipo, assegnato **solo** dall'aggregatore.
2. Dedup nell'ordine di §10, primi tre passi. Un test per ciascuno.
3. Promozione a `reproduced` quando l'evidenza runtime incontra un finding statico o AI.
4. Politica 2-su-3, configurabile fino a 1 per chi preferisce la velocità.
5. Storico dei flake per fingerprint su file, quarantena sopra soglia.
6. Clustering LLM **per ultimo**, e solo per i residui AI.
7. Report aggiornato secondo §21, `speculative` collassato.

**Come verifichiamo.** Un bug reale trovato **sia** dal browser **sia** dall'AI compare come **un
solo** finding a tier `reproduced`, non come due voci. Un finding che si riproduce 1 volta su 3
finisce in `speculative` con etichetta `flaky`. Il report ha `speculative` collassato per default.
Nessun finding porta una severità decisa dal modello.

**Cosa impari.** Perché l'identità e la fusione degli oggetti è un problema di progetto. Perché
"quanto ci credo" deve derivare dal metodo e non dall'opinione. Cos'è il non determinismo e come si
gestisce senza mentire all'utente.

---

### ✅ Verifica di uscita della Parte D (v0.4, §24)

Su 10 PR, i finding AI mostrati per default sono ≥50% veri positivi alla revisione manuale, con zero
API key configurate.

Subito dopo, nell'ordine di spedizione di §12.1: adapter **`codex-cli`**, poi gli adapter API key come
semplice interruttore di configurazione sullo stesso contratto.

---

# PARTE E — v0.5: il server

**Obiettivo** (§24, v0.5): gira **non presidiato per 2 settimane** sui tuoi repository, senza
interventi manuali e senza un solo incidente di disco pieno.

§26: *"Resist the dashboard until v0.5; a web UI over a system with no stable data model is rework."*
Il modello dati adesso è stabile, quindi si può.

**Da rivalutare all'inizio di questa parte:** la decisione **D2**. È il suo trigger principale. Le
domande concrete: la distribuzione via immagine Docker è accettabile per gli utenti reali che hai? Il
worker in Node regge quello che gli chiedi? Se entrambe le risposte sono sì, D2 resta chiusa —
scrivendolo.

---

## Fase 15 — Postgres, coda, worker, API

**Cosa costruiamo.** La modalità server: API HTTP, scheduler, aggregatore, Postgres, coda; e la
modalità `--worker` che rivendica i job (§5.3).

**Perché serve.** È la parte che rende il sistema utilizzabile senza il tuo terminale aperto.

Persistenza noiosa (§3.9): **Postgres e un filesystem**. Niente Redis, niente Kafka, niente service
mesh, niente Kubernetes nell'installazione di default.

Coda (§18.1): Postgres con `SELECT … FOR UPDATE SKIP LOCKED`, lease del worker con heartbeat, requeue
alla scadenza del lease, così un worker che va in crash non perde i job.

Stati, **sei** (§18): `queued → running → completed | failed | cancelled | budget_exhausted`. Il
progresso per stadio vive nelle righe degli stadi, non nella macchina a stati del job — i 13 stati
della v1 erano progresso di stadio che tracimava nello stato del job (§1.2).

**Tecnologie.** `fastify` per HTTP, `pg` per Postgres, migrazioni come **file SQL numerati** con un
piccolo runner scritto da noi (così impari SQL invece di subire un ORM), SSE per gli eventi.

**File / componenti.**

```
src/store/…                  # query
migrations/0001_init.sql     # SQL a mano, numerato
src/queue/queue.ts           # SKIP LOCKED, lease, heartbeat
src/api/…                    # gli endpoint di §20
src/worker/worker.ts
src/commands/serve.ts
```

**Ordine di lavoro.**

1. Schema: `run`, `stage`, `finding`, `fingerprint`, `artifact`. I finding restano **canonici in SARIF
   su disco**; Postgres tiene i metadati (§17.1, guardrail 2 di D2).
2. Coda con `SKIP LOCKED`, lease, heartbeat, requeue.
3. Endpoint di §20, uno per volta, con bearer token e scope (`runs:read`, `runs:write`, `fix:write`).
4. `--worker`: rivendica, esegue, riporta gli eventi in streaming.
5. **Supersede-on-push** (§18.2): nuovo push su una PR → cancella la run in volo per la head vecchia e
   accoda la nuova. Senza questo, una PR attiva accoda cinque run e l'utente legge un report scaduto.
6. Cancellazione con **un solo** percorso (§18.3): **distruggi la sandbox**. Poiché ogni processo (app,
   browser, agente, servizi) vive dentro, la pulizia è garantita per costruzione invece di essere una
   lista di cose da ricordarsi di uccidere. Reaper degli orfani all'avvio del worker.
7. `/healthz` e `/metrics`.

**Come verifichiamo.** Due run concorrenti non si pestano. Termina un worker a metà run: il job torna
in coda e riparte. Push su una PR con una run in volo: la vecchia viene cancellata, la nuova parte, e
non resta nessuna sandbox orfana.

**Cosa impari.** SQL, per davvero. Cos'è una coda di lavoro e perché il locking è difficile. Cos'è un
lease e a cosa serve un heartbeat. Perché una macchina a stati piccola è meglio di una grande.
Progettazione di una API REST, e differenza fra autenticazione e autorizzazione.

---

## Fase 16 — GitHub App in modalità report

**Cosa costruiamo.** L'integrazione con GitHub: webhook, checkout in sola lettura dello SHA esatto, un
check run, un commento appiccicoso, il comando `/winnow run web`, e i secret sigillati per repository.

**Perché serve.** È il punto di ingresso reale del prodotto (§20). E la modalità in sola lettura
**deve essere davvero in sola lettura** (§15.5): report mode legge contenuti e PR e scrive i check;
**nessuna scrittura di codice**. È il default e copre la maggior parte dell'uso.

Le regole (§20):

- **Un** check run il cui riepilogo è il **diff**: nuovi finding in cima, conteggio dei risolti,
  invariati collassati.
- **Un** commento appiccicoso, modificato in loco. Mai un commento nuovo a ogni run.
- Conclusione del check configurabile: fallisce solo su nuovi `critical|high` con tier
  `reproduced|deterministic`. **I finding speculativi non fanno mai fallire un check.** È questa
  regola che rende il check abbastanza affidabile da lasciarlo attivo.
- Sanitizzazione di ogni stringa derivata dal repository o dal modello prima di renderizzarla o
  pubblicarla (§15.1: injection ANSI/markdown).

**File / componenti.**

```
src/forge/forge.ts           # l'interfaccia di §20: resolveRef, mergeBase,
                             # checkoutToken, postCheck, postComment, openPr
src/forge/github/…
src/secrets/sealed.ts        # §15.4, piano "repo test secrets"
src/sanitize/text.ts
```

**Ordine di lavoro.**

1. Definisci **prima** l'interfaccia forge a sei metodi di §20. Il secondo provider (GitLab o Forgejo)
   arriva solo dopo che GitHub è stabile, e l'interfaccia è ciò che lo rende possibile.
2. GitHub App in report mode, con i permessi minimi.
3. Webhook con verifica HMAC, merge-base risolto lato server.
4. Check run con il riepilogo-diff; commento appiccicoso modificato in loco.
5. Secret sigillati per repository: cifrati a riposo con una chiave che vive **solo** nel control
   plane, redatti da ogni flusso di log, ruotabili. E l'avviso all'utente, in chiaro: **qui vanno solo
   credenziali usa-e-getta** (§15.4).
6. Sanitizzazione, con test che includono sequenze ANSI e markdown ostile.
7. `/winnow run web` come comando da commento, gated sul permesso di scrittura al repository.

**Come verifichiamo.** Una PR reale su un repository di PoliNetwork produce un check e un commento
appiccicoso. Tre push di fila producono **un** commento, aggiornato. Un finding speculativo non fa mai
fallire il check. Un titolo di PR con sequenze ANSI non rompe il rendering.

**Cosa impari.** Cos'è un webhook e perché va verificato. Differenza fra una GitHub App e un token
personale. Cosa significa cifrare a riposo. Perché ogni testo proveniente dall'esterno è ostile fino a
prova contraria.

---

## Fase 17 — Dashboard, quattro schermate

**Cosa costruiamo.** La SPA servita dal server: **Runs**, **Run**, **Repositories**, **Settings**
(§21). Quattro, non nove.

**Perché serve.** Perché adesso il modello dati è stabile. Le nove sezioni della v1 collassano in
quattro (§1.2), e il report **è una vista di una run**, non una sezione a sé (§21).

**Tecnologie.** **Vite + React + TypeScript**, come da §5.4. Il build di Vite finisce in `web/dist/` e
`fastify` lo serve come file statici. Nessun `embed` come in Go: la conseguenza di D2 sulla
distribuzione si vede qui.

Questa è la fase in cui arriva ciò per cui volevi imparare TypeScript. Ed è la fase più adatta da
condividere con un'altra persona.

**File / componenti.**

```
web/                         # progetto Vite separato, stesso repo
web/src/screens/Runs.tsx
web/src/screens/Run.tsx
web/src/screens/Repositories.tsx
web/src/screens/Settings.tsx
src/api/static.ts            # fastify serve web/dist
```

**Ordine di lavoro.**

1. Solo la schermata **Runs**, che legge dall'API. Nient'altro.
2. **Run**: stadi con stato live via SSE, elapsed, bottone di cancellazione, diff dei finding,
   artefatti; log dietro una disclosure e i transcript dell'agente dietro una seconda.
3. **Repositories**: profilo di default, sorgente della configurazione (committata / rilevata /
   interattiva), secret sigillati, run recenti, fingerprint ricorrenti, durata mediana.
4. **Settings**: provider di agenti, vista del lockfile degli strumenti, worker e salute, ritenzione e
   uso disco, token, webhook. Più l'avviso proattivo di scadenza della credenziale (§12.5).
5. `fastify` serve `web/dist`.

**Come verifichiamo.** Una run in corso si vede aggiornarsi in tempo reale. La schermata Run mostra
sopra la piega **solo** `new` e `resolved` — §21: *"That is the whole UX thesis."* Il server serve la
dashboard senza processi esterni.

**Cosa impari.** React: componenti, stato, effetti. Come una SPA parla con una API. Cos'è SSE e perché
qui non serve WebSocket. Come si progetta un'interfaccia in cui la cosa importante è sopra la piega.

---

## Fase 18 — Deploy e hardening

**Cosa costruiamo.** Il deploy reale su VPS, privato via Tailscale, con gVisor come tier di default
per tutto ciò che non è tuo.

**Perché serve.** Il criterio di uscita è "2 settimane non presidiato", e questo richiede un deploy
vero. E §15.2 fissa **`hardened` (con gVisor) come default per qualunque cosa non appartenga a chi ha
installato** lo strumento.

**Tecnologie.** VPS, Tailscale, gVisor (`runsc`), systemd o Podman Quadlet, immagine Docker come unità
di distribuzione (conseguenza di D2), **Renovate** sul repository di winnow (§5.2, che sostituisce del
tutto la dashboard di aggiornamento degli strumenti).

**File / componenti.**

```
Dockerfile                   # l'unità di distribuzione
docs/deploy/vps.md
docs/deploy/tailscale.md
deploy/winnow.container      # Podman Quadlet, o unit systemd
deploy/tool-lock.yml         # digest fissati (§16)
renovate.json
src/commands/diagnose.ts     # §27: bundle locale redatto, mai telemetria
```

**Ordine di lavoro.**

1. `Dockerfile` multi-stage: build TS, `pnpm install --prod`, immagine finale piccola.
2. Deploy manuale, **documentando ogni passo mentre lo fai**. La documentazione nasce qui, non dopo.
3. Tailscale: il servizio non è esposto sull'internet pubblico.
4. gVisor come default per i repository non tuoi.
5. `tool-lock.yml` con i digest, e Renovate che apre le PR di aggiornamento.
6. `winnow diagnose`: bundle locale redatto che l'utente allega a un issue **se vuole**. Nessuna
   telemetria, né opt-out né opt-in: assente (§27).
7. Monitoraggio del disco e `gc` schedulato.

**Come verifichiamo.** Il criterio di §24: **2 settimane non presidiato**, senza interventi manuali e
senza disco pieno. Tieni un diario degli incidenti: **ogni intervento manuale è un bug da
sistemare**, non un'eccezione da accettare.

**Cosa impari.** Cos'è un'immagine Docker multi-stage e perché la dimensione conta. Cos'è un servizio
systemd. Come si mette un servizio in una rete privata. Cosa fa un runtime di container hardened.
Perché la riproducibilità richiede digest fissati e non tag.

---

# PARTE F — v0.6 e v1.0

Da qui i criteri di uscita sono espressi in bug reali e fix reali, quindi il ritmo dipende da quanto
usi lo strumento. Le fasi restano piccole; la descrizione è più breve perché queste decisioni le
prenderai con molta più esperienza di adesso.

---

## Fase 19 — Promozione delle riproduzioni e test generati (v0.6)

**Cosa costruiamo.** Il tentativo attivo di **promuovere** un finding lungo la scala di evidenza di
§4.2, e la generazione di test di regressione verificati.

**Perché serve.** §1.1 dice che questo è l'output di valore più alto di tutto il sistema: la v1 lo
aveva archiviato come "idea futura" e la v2 lo **promuove**. Un test committato che riproduce il bug
sopravvive per sempre e funziona nella CI dell'utente.

La scala di §4.2, dal più al meno prezioso: test che fallisce → script di riproduzione eseguibile →
screenshot con passi esatti → posizione nel codice con spiegazione → opinione di un modello. La
pipeline prova attivamente a **salire** questa scala, con un tentativo limitato. Se la promozione
fallisce, il finding resta visibile ma etichettato speculativo.

È anche il modo in cui il sistema si misura: *"the system is judged on promotions"*, ed è una metrica
che può tracciare su di sé.

**Verifica di uscita (§24):** 3 bug reali producono ciascuno un test che fallisce e che una persona
**accetta**.

---

## Fase 20 — Fix mode (v1.0)

**Cosa costruiamo.** Il tentativo singolo di fix, dietro approvazione, con output a patch.

**Perché serve.** Era giusto nella v1 come job isolato (§1.1), ma richiede la precondizione che lo
rende sicuro: **un test che fallisce deve esistere prima**.

Le precondizioni, tutte obbligatorie (§14): il finding è di tier `reproduced` o `deterministic`;
esiste un check che fallisce e che il fix deve invertire, **verificato come fallito prima che una riga
di codice venga modificata**; l'utente ha selezionato quel finding esplicitamente.

Il flusso di §14 va seguito alla lettera, incluso il passo che dice: se il test di riproduzione
**passa** prima del fix, si **interrompe** — l'evidenza era sbagliata.

L'output è **una patch e un report**. Creare un branch o una PR è un'azione separata ed esplicita dal
control plane. Mai un push sul branch di default o su un branch protetto. Mai un force-push. Il token
del forge usato per le scritture **non entra mai nella sandbox** (§12.3 regola 6: le due credenziali
non coesistono mai nello stesso processo).

**Iterazioni: 1.** §14 è esplicito: il loop a 3 iterazioni della v1 moltiplica costo e modi di fallire
per un guadagno non misurato. L'iterazione 2 si aggiunge **solo** quando ci sono dati che mostrano che
il tentativo 1 fallisce spesso *e* che il tentativo 2 riesce spesso.

**Verifica di uscita (§24):** 5 fix reali mergiati da una persona **senza rilavorazione**.

---

## Dopo la v1.0

Ordine di priorità da §24, da non anticipare: secondo forge · secondo reviewer con
cross-corroborazione · QA visiva semantica con conferma DOM · run di regressione schedulate · worker
remoti · autenticazione multi-utente · registro dei plugin · rilevatori Python/Go oltre i default di
Railpack.

**Differite a tempo indeterminato, e questa lista è vincolante:** worker Kubernetes · testing di app
mobile · fuzzing di API · suite di benchmark · analytics storiche sulla qualità · preset di pipeline
della community · benchmarking di modelli · ruoli organizzativi.

---

## Appendice A — Quanto tempo, onestamente

§26 dice che la v2 è **circa un anno-persona per una persona esperta a tempo pieno**. Tu sei
all'inizio, part-time, con studio e PoliNetwork. Stimando ~8 ore a settimana, con buchi:

| Parte | Tempo realistico | Nota |
|---|---|---|
| A — v0.1 | **6–10 settimane** | la Fase 1 in un weekend, il resto è il vero apprendistato |
| B — v0.2 | **6–10 settimane** | la più difficile, e quella che conta |
| C — v0.3 | **3–4 mesi** | dipende dai repository reali, non da te |
| D — v0.4 | **4–6 settimane** | + la revisione manuale di 10 PR, tempo di calendario |
| E — v0.5 | **4–5 mesi** | + 2 settimane non presidiato che non si comprimono |
| F — v1.0 | aperto | dipende da quanti bug reali incontri |

→ **v0.5 in 12–18 mesi. v1.0 in circa 2 anni.**

E la parte che nessuno dice: **la probabilità più alta è che ti fermi nella Parte C.** Non è un
fallimento. §26 ha strutturato le milestone esattamente per questo: *"v0.1 through v0.3 are
individually useful"*. Una CLI che avvia un repo in un container, esegue i suoi check e riporta solo
ciò che il tuo branch ha cambiato **è già uno strumento che vale usare**.

Quindi non impegnarti sulla v1.0. **Impegnati sulla Parte A: due mesi.** Alla fine avrai uno strumento
che funziona, saprai TypeScript per davvero, e potrai decidere se continuare con dati reali invece che
con entusiasmo.

---

## Appendice B — Le regole che non si negoziano in nessuna fase

Da rileggere quando l'AI propone una scorciatoia.

1. **Il repository è ostile.** Nessuna eccezione, nessuna modalità "è un repo interno quindi va bene"
   (§3.5).
2. **Il socket Docker non entra mai in una sandbox** (§15.2). Se i test di un repository hanno bisogno
   di Docker: demone rootless annidato, oppure si rifiuta e si spiega perché.
3. **La credenziale dell'agente non sta mai nel container che esegue codice del repository** (§12.3).
4. **L'output di un modello è dato, mai flusso di controllo** (§3.6). Niente di ciò che un agente
   emette viene eseguito sull'host o riceve credenziali.
5. **I fallimenti infrastrutturali producono zero finding** e non fanno mai fallire un check in modo
   che somigli a un difetto del prodotto (§22).
6. **La severità e il tier di evidenza li assegna l'aggregatore, mai il modello** (§9.2, §9.4).
7. **I finding speculativi non fanno mai fallire un check** (§20).
8. **Niente telemetria.** Non opt-out: assente (§27).
9. **Ogni messaggio di fallimento nomina la causa probabile e l'azione concreta successiva** (§22).
10. **La lista delle cose differite è vincolante** (§24).
11. **Non fare merge di codice che non sai spiegare a voce.** Questa non viene dalla specifica: viene
    dal fatto che il progetto serve anche a farti imparare.
