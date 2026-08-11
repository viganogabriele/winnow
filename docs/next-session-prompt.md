# Prompt per la prossima sessione

Copia il blocco qui sotto e incollalo come primo messaggio a un'AI in questo repository.

---

```
Lavoriamo su winnow. Leggi prima AGENTS.md, poi la Fase 1 di ROADMAP.md, poi queste
decisioni: 0008 (perché il progetto è fatto così), 0011 (composite action), 0014
(il workflow è riusabile dalla Fase 1) e 0023 (il write vive solo in publish).

Contesto su di me: sto imparando a programmare. Non faccio merge di codice che non
so spiegare a voce. Tu scrivi la maggior parte del codice, io prendo le decisioni,
e la mia comprensione è parte del risultato — se devi scegliere tra una soluzione
elegante e una che riesco a seguire, scegli la seconda e dimmi perché.

Facciamo la Fase 1. Il risultato: su una PR del repository cavia, `resolve` identifica
base, head e fork; `checks` esegue ESLint con soli permessi di lettura e produce SARIF;
`publish`, senza eseguire codice del repository, pubblica quel file come commento inline
e nella tab Security. Il
workflow vive in QUESTO repository con `on: workflow_call`, e nel cavia c'è un
caller (~20-30 righe: i due trigger, gli input e le permissions; i secret si aggiungono
esplicitamente solo dalla fase che li usa — un reusable workflow non eredita né secret
né permessi).

Prima di scrivere qualunque cosa, voglio da te tre cose:

1. Un piano breve (sotto le 15 righe): quali file crei, in che ordine, e quali
   decisioni servono da parte mia. Poi ASPETTA la mia conferma.

2. La spiegazione dei concetti nuovi di questa fase, prima o mentre li usiamo, in
   linguaggio semplice — tre o quattro frasi ciascuno, con un esempio concreto
   invece di una definizione. Almeno questi: cos'è un workflow di GitHub Actions e
   cosa significa che gira su una macchina effimera; la differenza fra
   `workflow_call`, `pull_request` e `workflow_dispatch`; cos'è SARIF e perché
   usiamo un formato di qualcun altro invece di uno nostro; cosa sono i
   `permissions` di un job; perché si pinna una action per SHA del commit; e
   soprattutto **cos'è una zona di fiducia e in che senso un artefatto è un diodo**
   — `checks` esegue codice non fidato e produce dati, `publish` ha il potere di
   scrivere e legge quei dati senza eseguire niente. È l'idea centrale della fase.

   Spiegami anche perché il gate sui fork deve essere NOSTRO e non di GitHub:
   `workflow_dispatch` gira dal branch di default con i suoi secret, quindi la
   protezione che GitHub dà su `pull_request` lì non c'è.

3. Il passo 1 dell'ordine di lavoro della Fase 1 va fatto DA ME, a mano, prima del
   codice: eseguire ESLint in locale col formatter SARIF e guardare il file che
   produce. Dimmi il comando esatto e cosa devo cercare quando apro quel file.
   Non salterlo e non farlo tu al posto mio.

Regole che non si negoziano in questa fase (Appendice B della roadmap):
- `pull_request`, mai `pull_request_target` con i secret disponibili
- `permissions:` dichiarate esplicite e minime su ogni job
- il codice del repository gira solo in `checks`, con `contents: read`; i permessi
  GitHub di scrittura esistono solo in `publish`, che usa il SARIF come dato
- ogni action di terzi pinnata per SHA del commit
- su una PR da fork, commenti inline e upload SARIF NON funzionano (token in sola
  lettura, nessun secret): è previsto, e il workflow deve dirlo nel riepilogo
  invece di sembrare rotto. Testa quindi con una PR da un branch dello stesso
  repository, non da un fork.

Gli input del workflow sono una superficie di compatibilità dal primo giorno:
rinominarne uno rompe tutti i caller. Pochi e additivi.

In questa fase non c'è codice TypeScript nostro: solo YAML, comandi dichiarati e action di terzi. Se ti viene
voglia di scrivere uno script, fermati — dalla Fase 2 in poi il codice di winnow
viaggia come composite action, non come percorso `src/…` (decisione 0011), e si
installa le dipendenze a runtime dal lockfile (decisione 0016).

Se ti serve una decisione architetturale che non è già scritta nei documenti,
fermati e chiedimela nel formato di AGENTS.md §8 invece di sceglierla tu.

Alla fine, la verifica la eseguo io con le mie mani: dimmi i comandi esatti e cosa
devo vedere. Non dichiarare la fase completa tu.
```

---

## Cosa ti serve avere pronto prima di iniziare

- `gh auth login` fatto
- Un repository GitHub tuo, pubblico, con un progetto Node/TypeScript e ESLint
  configurato — è il fixture #1 di `fixtures.md`
- Il `claude setup-token` **non** serve ancora: arriva alla Fase 5

## Per le fasi successive

Riusa lo stesso prompt cambiando il numero della fase, i concetti da spiegare (li
trovi nella voce **Cosa impari** di ogni fase) e le decisioni da leggere prima. Le
tre richieste — piano prima, concetti spiegati, verifica fatta da te — restano
identiche a ogni fase.

**Prima della Parte B, fai leggere anche `0013`** (l'agente legge le prove, non guida
il browser) e `0015` (l'abbonamento è per l'installazione personale): sono le due
decisioni che danno forma alle Fasi 4–6.
