# Personalized onboarding

A long clinical intake — the kind that runs thirty steps before it shows you anything —
turned into a short conversation that adapts to what the person actually says.

The demo brand is **Hairo**, a men's hair-loss company. Nothing about the flow is
specific to hair loss; the brand lives in one file.

## Run it

```bash
npm install
cp .env.example .env    # add your OpenRouter key
npm run dev
```

Then open http://localhost:3000.

Two useful scripts:

- `npm run llm:check` — asserts the model actually extracts stated facts.
- `npm run sim` — walks both personas through the API and prints every turn.

## What to show in a demo

Two paths, both under a minute:

1. **"Ready to start ASAP"** → three questions, records import, one follow-up written
   from the imported chart, then the plan. Pick **Liver condition** at the health
   question to watch a rule hold finasteride for provider review.
2. **"Exploring options"** → an education card first, then more questions. At any
   question, type instead of clicking:

   > *It started about two years ago, mostly at the crown, and my dad went bald in his
   > thirties too*

   One sentence fills three answers, and the header jumps from 1 of 5 to 4 of 5.

Picking **Heart condition** on either path removes oral minoxidil from the plan and
says why.

## How it works

Two layers, and the split is the whole point:

**The rules decide what may happen.** `lib/flow/rules.js` computes the legal next
moves from the profile — which questions remain, which clinical flags fire, whether
a hard stop applies. No model runs here.

**The model picks one and words it.** `lib/flow/engine.js` hands the model that list
and it chooses a move and writes one acknowledging sentence. Anything not on the list
is discarded. If the model is slow, wrong or down, the first move is used with
scripted copy and the onboarding continues — no screen depends on a model call.

So a model can never invent a question, put something in a plan, or clear a clinical
flag. It decides *what to say next*, not *what is true*.

Two details worth knowing if you extend it:

- **Extraction carries evidence.** Every extracted fact is `{quote, value}`, and a
  value without a quote from the message is dropped. As bare enums the model invented
  facts — including worries the person never raised, which the UI then repeated back
  to them as if they had.
- **State lives in the client.** Each turn posts the whole state to `/api/turn`, so
  there is no session store to keep warm and a refresh is a clean start.

## Rebranding it

Edit `lib/brand.js` — name, wordmark style, category, product line, social proof,
disclaimer. If the palette changes too, the tokens are at the top of
`app/globals.css`; `DESIGN.md` explains what each one does.

For a different vertical, `lib/flow/questions.js` is the question bank and
`lib/flow/rules.js` the clinical rules. In a real deployment a clinical team owns
both files, and the model still may only choose from what they contain.

## Where things are

| Path | What it holds |
| --- | --- |
| `lib/brand.js` | The only company-specific file |
| `lib/flow/questions.js` | Question bank and education cards |
| `lib/flow/rules.js` | Routing, required slots, clinical flags, progress |
| `lib/flow/engine.js` | The model calls, each with a deterministic fallback |
| `lib/flow/plan.js` | Plan, projection, pricing, timeline |
| `lib/flow/records.js` | The imported-records fixture |
| `app/api/turn/route.js` | One turn, end to end |
| `components/` | The patient-facing UI |
| `DESIGN.md` | Colours, type and layout, with sources |
| `docs/` | Requirements transcript and reference frames |

## Caveats

It is a demo. The records import is a fixture, the projection is illustrative and
labelled as such, and the plan says *ready for provider review* rather than
*approved* — nothing is approved until a clinician looks at it. The connect sheet is
deliberately generic rather than reproducing a real portal's branding.
