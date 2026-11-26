import './style.css'
import { incidents, risks, type IncidentChoice, type OperationalMetrics, type RiskScenario, type SimulationIncident } from './game-data'

type Phase = 'intro' | 'risk' | 'measures' | 'briefing' | 'simulation' | 'results'
type Assessment = {
  probability: number
  impact: number
}
type IncidentResult = {
  incidentId: string
  choiceLabel: string
  feedback: string
  preparedMeasures: { title: string; reason: string }[]
  metricsBefore: OperationalMetrics
  metricsAfter: OperationalMetrics
}
type FeedEntry = {
  kind: 'alarm' | 'update' | 'decision'
  text: string
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Fant ikke app-elementet.')

const budget = 7
const state: {
  phase: Phase
  riskIndex: number
  draft: { probability: number | null; impact: number | null }
  assessments: Record<string, Assessment>
  measureSelections: Record<string, string>
  incidentDeck: SimulationIncident[]
  choiceOrders: Record<string, number[]>
  incidentIndex: number
  awaitingNext: boolean
  secondsElapsed: number
  escalationStage: number
  metrics: OperationalMetrics
  incidentStartMetrics: OperationalMetrics
  results: IncidentResult[]
  feed: FeedEntry[]
  latestUpdate: string
} = {
  phase: 'intro',
  riskIndex: 0,
  draft: { probability: null, impact: null },
  assessments: {},
  measureSelections: {},
  incidentDeck: [],
  choiceOrders: {},
  incidentIndex: 0,
  awaitingNext: false,
  secondsElapsed: 0,
  escalationStage: 0,
  metrics: { network: 100, service: 100, trust: 100, capacity: 100 },
  incidentStartMetrics: { network: 100, service: 100, trust: 100, capacity: 100 },
  results: [],
  feed: [],
  latestUpdate: '',
}

let timer: number | undefined

function riskLevel(score: number): { label: string; tone: string } {
  if (score >= 17) return { label: 'Kritisk', tone: 'critical' }
  if (score >= 10) return { label: 'Høy', tone: 'high' }
  if (score >= 5) return { label: 'Middels', tone: 'medium' }
  return { label: 'Lav', tone: 'low' }
}

function usedBudget(excludeRiskId?: string): number {
  return Object.entries(state.measureSelections).reduce(
    (sum, [riskId, measureId]) =>
      riskId === excludeRiskId
        ? sum
        : sum + (risks.find((risk) => risk.id === riskId)?.measures.find((measure) => measure.id === measureId)?.cost ?? 0),
    0,
  )
}

function selectedMeasure(risk: RiskScenario): string | null {
  return state.measureSelections[risk.id] ?? null
}

function renderHeader(step: number, label: string): string {
  const stages = ['Oppdrag', 'Risikoanalyse', 'Tiltak', 'Beredskap', 'Simulering']
  return `
    <header class="topbar">
      <a class="brand" href="#" data-action="home" aria-label="Gå til startsiden">
        <span class="brand-mark">N</span><span>NORD<span class="brand-muted">SIKKER</span></span>
      </a>
      <div class="topbar-meta"><span class="live-dot"></span> ØVINGSMILJØ <span class="topbar-divider"></span> VG2 IT</div>
      <div class="topbar-time">${label}</div>
    </header>
    <nav class="step-nav" aria-label="Spillfaser">
      ${stages.map((stage, index) => `
        <div class="step ${index < step ? 'step-done' : ''} ${index === step ? 'step-active' : ''}">
          <span class="step-number">${index < step ? '✓' : `0${index + 1}`}</span><span>${stage}</span>
        </div>`).join('')}
    </nav>
  `
}

function renderIntro(): string {
  return `${renderHeader(0, 'SCENARIO 01 / 01')}
    <main class="intro-layout">
      <section class="intro-copy">
        <div class="eyebrow"><span class="eyebrow-line"></span> BEREDSKAPSØVELSE · 2026</div>
        <h1>Hold driften.<br><span>Beskytt tilliten.</span></h1>
        <p class="intro-lead">En uforutsigbar vakt hos Nordlys IT. Vurder brede risikoområder, prioriter tiltak med knappe ressurser, og håndter hendelser som ikke følger risikoregisteret punkt for punkt.</p>
        <button class="button button-primary button-large" data-action="start">
          Start oppdraget <span class="button-arrow">→</span>
        </button>
        <div class="intro-note"><span class="note-icon">i</span> Individuell øvelse · ca. 15–20 min · 7 tiltakspoeng totalt</div>
      </section>
      <aside class="mission-card">
        <div class="mission-card-top"><span class="status-pill"><span class="live-dot"></span> AKTIVT OPPDRAG</span><span class="mission-id">NS–001</span></div>
        <div class="network-art" aria-hidden="true">
          <div class="network-ring ring-one"></div><div class="network-ring ring-two"></div>
          <div class="network-center"><span>N</span><i></i></div>
          <span class="node node-one"></span><span class="node node-two"></span><span class="node node-three"></span><span class="node node-four"></span>
          <span class="network-label label-one">DRIFT</span><span class="network-label label-two">DATA</span><span class="network-label label-three">NETT</span>
        </div>
        <div class="mission-info">
          <div><span class="meta-label">BEDRIFT</span><strong>Nordlys IT</strong></div>
          <div><span class="meta-label">DIN ROLLE</span><strong>Driftstekniker på vakt</strong></div>
          <div><span class="meta-label">MÅL</span><strong>Hold kritiske tjenester i gang</strong></div>
        </div>
        <div class="mission-footer"><span>FYSISKE OG DIGITALE HENDELSER</span><span>● ● ● ● ● ● ●</span></div>
      </aside>
    </main>
    <section class="intro-bottom">
      <div><span class="bottom-index">01</span><strong>Vurder risiko</strong><span>Sett skår på tvers av fagområder</span></div>
      <div><span class="bottom-index">02</span><strong>Fordel knappe poeng</strong><span>Du har ikke råd til å sikre alt</span></div>
      <div><span class="bottom-index">03</span><strong>Håndter det uventede</strong><span>Hendelsene kommer i tilfeldig rekkefølge</span></div>
    </section>
  `
}

function renderScale(name: 'probability' | 'impact', selected: number | null, question: string): string {
  const title = name === 'probability' ? 'Sannsynlighet' : 'Konsekvens'
  const descriptions = name === 'probability'
    ? ['Svært lav', 'Lav', 'Mulig', 'Sannsynlig', 'Svært sannsynlig']
    : ['Ubetydelig', 'Liten', 'Moderat', 'Alvorlig', 'Kritisk']
  const definition = name === 'probability'
    ? 'Vurder om hendelsen skjer minst én gang de neste 12 månedene: 1 = under 5 %, 2 = 5–20 %, 3 = 21–50 %, 4 = 51–80 %, 5 = over 80 %. Bruk opplysningene i scenarioet, ikke en generell magefølelse om cybersikkerhet.'
    : 'Vurder det mest alvorlige troverdige utfallet: 1 = kort intern forstyrrelse uten kundepåvirkning, 2 = én tjeneste rammes kort og kan omgås, 3 = flere kunder eller én kritisk tjeneste rammes i noen timer, 4 = langvarig avbrudd eller alvorlig personvernkonsekvens, 5 = flere kritiske tjenester eller mange kunder rammes over lang tid.'
  return `
    <fieldset class="rating-field">
      <legend>${title}<span>Velg 1–5</span></legend>
      <p class="scale-question">${question}</p>
      <p class="scale-definition">${definition}</p>
      <div class="rating-options">
        ${descriptions.map((description, index) => {
          const value = index + 1
          return `<button type="button" class="rating-option ${selected === value ? 'selected' : ''}" data-action="set-${name}" data-value="${value}" aria-pressed="${selected === value}">
            <span>${value}</span><small>${description}</small>
          </button>`
        }).join('')}
      </div>
    </fieldset>
  `
}

function renderRisk(): string {
  const risk = risks[state.riskIndex]
  const score = state.draft.probability !== null && state.draft.impact !== null
    ? state.draft.probability * state.draft.impact
    : null
  const level = score ? riskLevel(score) : null

  return `${renderHeader(1, `RISIKOVURDERING / 0${state.riskIndex + 1}`)}
    <main class="workspace">
      <div class="page-heading">
        <div><div class="eyebrow"><span class="eyebrow-line"></span> FASE 01 / RISIKOANALYSE</div><h1>Kartlegg risikoen.</h1>
          <p>Vurder alle risikoområdene først. Tiltak og budsjett kommer i neste fase.</p></div>
      </div>
      <div class="risk-method-card"><strong>Hva skal du vurdere?</strong><p><b>Sannsynlighet:</b> Hvor stor er sjansen for at hendelsen skjer minst én gang i løpet av de neste 12 månedene?</p><p><b>Konsekvens:</b> Hvis hendelsen skjer, hvor alvorlig blir det mest troverdige utfallet for kunder, tjenester og data?</p><p>Velg begge nivåene fra 1 til 5. Skåren regnes ut som <b>sannsynlighet × konsekvens</b>. Bruk faktaene i hvert scenario, og fullfør alle seks vurderingene før du ser tiltakene.</p></div>
      <div class="risk-progress">${risks.map((item, index) => `<span class="${index < state.riskIndex ? 'complete' : ''} ${index === state.riskIndex ? 'current' : ''}" title="Risiko ${index + 1}: ${item.shortTitle}"></span>`).join('')}</div>
      <div class="risk-layout">
        <section class="scenario-card">
          <div class="scenario-meta"><span class="category-tag">${risk.category}</span><span>RISIKO 0${state.riskIndex + 1} / 0${risks.length}</span></div>
          <div class="scenario-icon">${risk.icon}</div>
          <h2>${risk.title}</h2><p>${risk.description}</p>
          <div class="scenario-evidence"><div class="evidence-heading"><span class="question-mark">i</span><strong>Opplysninger fra Nordlys IT</strong></div><ul>${risk.evidence.map((fact) => `<li>${fact}</li>`).join('')}</ul></div>
          <div class="risk-score-box">
            <span class="meta-label">RISIKOSKÅR · SANNSYNLIGHET × KONSEKVENS</span>
            <div class="risk-score-content">${score
              ? `<strong>${score}<small> / 25</small></strong><span class="risk-badge ${level?.tone}">${level?.label} risiko</span>`
              : '<strong class="score-placeholder">—<small> / 25</small></strong><span class="muted">Velg begge vurderingene</span>'}</div>
          </div>
        </section>
        <section class="assessment-card">
          <div class="assessment-title"><span class="card-number">01</span><div><h2>Risikovurdering</h2><p>Vurder sannsynlighet og konsekvens før du går videre.</p></div></div>
          ${renderScale('probability', state.draft.probability, risk.probabilityQuestion)}
          ${renderScale('impact', state.draft.impact, risk.impactQuestion)}
          <div class="risk-phase-note"><span class="note-icon">i</span><p>Ikke velg tiltak ennå. Når alle risikoene er vurdert, får du se hele risikobildet før du fordeler poengene.</p></div>
          <div class="assessment-footer risk-footer"><span>Risiko ${state.riskIndex + 1} av ${risks.length}</span>
            <button type="button" class="button button-primary" data-action="confirm-risk" ${score === null ? 'disabled' : ''}>
              ${state.riskIndex === risks.length - 1 ? 'Fullfør risikovurderingen' : 'Lagre og neste risiko'} <span>→</span>
            </button>
          </div>
        </section>
      </div>
    </main>`
}

function renderMeasures(): string {
  const spent = usedBudget()
  const remaining = budget - spent
  const selectedCount = Object.keys(state.measureSelections).length
  return `${renderHeader(2, `TILTAKSPLAN / ${budget - spent} POENG IGJEN`)}
    <main class="measure-phase">
      <div class="page-heading">
        <div><div class="eyebrow"><span class="eyebrow-line"></span> FASE 02 / TILTAKSPLAN</div><h1>Nå prioriterer du.</h1>
          <p>Risikovurderingen er ferdig. Se alle skårene samlet, og bestem hvilke risikoer som får tiltakspoeng.</p></div>
        <div class="budget-card budget-card-strong">
          <div class="budget-numbers"><span class="meta-label">POENG IGJEN</span><strong>${remaining}<small> / ${budget}</small></strong></div>
          <div class="budget-track"><i style="width:${(spent / budget) * 100}%"></i></div>
          <p><b>${budget} poeng totalt</b> for alle ${risks.length} risikoer.</p>
        </div>
      </div>
      <div class="budget-explainer"><span class="budget-explainer-icon">!</span><p><strong>Dette er hele tiltaksbudsjettet.</strong> Tiltak koster 2–4 poeng. Velg for hver risiko, eller la den stå uten finansiering. Valgene påvirker hvor godt planen dekker hendelser på tvers av områdene.</p><span class="budget-spent">${spent} / ${budget} brukt</span></div>
      <section class="analysis-summary">
        <div class="analysis-summary-heading"><div><span class="meta-label">FASE 01 FULLFØRT</span><h2>Hele risikobildet</h2></div><span>${risks.length} RISIKOER VURDERT</span></div>
        <div class="analysis-matrix">${risks.map((risk) => {
          const assessment = state.assessments[risk.id]
          const score = assessment.probability * assessment.impact
          const level = riskLevel(score)
          return `<div class="analysis-matrix-row"><span>${risk.shortTitle}</span><span class="matrix-values">S ${assessment.probability} × K ${assessment.impact}</span><strong>${score}</strong><span class="risk-badge ${level.tone}">${level.label}</span></div>`
        }).join('')}</div>
      </section>
      <div class="measure-phase-heading"><div><span class="eyebrow"><span class="eyebrow-line"></span> FASE 02 / FORDEL POENGENE</span><p>Alle seks valgene er synlige samtidig. Prioriter ut fra risikoskårene — du kan ikke finansiere alt.</p></div><span class="selection-count">${selectedCount} / ${risks.length} VALG</span></div>
      <section class="measure-risk-grid">
        ${risks.map((risk) => {
          const assessment = state.assessments[risk.id]
          const score = assessment.probability * assessment.impact
          const level = riskLevel(score)
          const currentMeasureId = selectedMeasure(risk)
          const availableForRisk = budget - usedBudget(risk.id)
          const measureOptions = risk.measures.map((measure) => {
            const overBudget = measure.cost > availableForRisk
            return `<button type="button" class="measure-option ${currentMeasureId === measure.id ? 'selected' : ''} ${overBudget ? 'unavailable' : ''}" data-action="set-measure" data-risk="${risk.id}" data-value="${measure.id}" ${overBudget ? 'disabled' : ''}>
              <span class="measure-radio"></span><span class="measure-copy"><strong>${measure.title}</strong><small>${measure.description}</small></span><span class="measure-cost ${measure.cost ? 'paid-cost' : ''}">${measure.cost ? `${measure.cost} P` : '0 P'}</span>
            </button>`
          }).join('')
          return `<article class="measure-risk-card">
            <div class="measure-risk-heading"><div><span class="meta-label">${risk.category}</span><h2>${risk.shortTitle}</h2></div><div class="measure-risk-score"><strong>${score}</strong><span class="risk-badge ${level.tone}">${level.label}</span></div></div>
            <p class="measure-risk-description">${risk.description}</p>
            <div class="measure-options">${measureOptions}</div>
            <div class="measure-available">${availableForRisk} poeng tilgjengelig før dette valget</div>
          </article>`
        }).join('')}
      </section>
      <div class="measure-phase-footer">
        <p>${selectedCount < risks.length ? `Velg et tiltak eller «Ikke finansier nå» for ${risks.length - selectedCount} risiko(er) til.` : `${spent} av ${budget} poeng brukt. ${remaining} poeng gjenstår.`}</p>
        <button class="button button-primary button-large" data-action="confirm-measures" ${selectedCount !== risks.length ? 'disabled' : ''}>Lås tiltak og fortsett <span>→</span></button>
      </div>
    </main>`
}

function renderBriefing(): string {
  const planned = Object.values(state.measureSelections).filter((measureId) => measureId !== 'none').length
  const spent = usedBudget()
  return `${renderHeader(3, 'PLAN KLAR / VENT PÅ HENDELSE')}
    <main class="briefing-layout">
      <div class="eyebrow"><span class="eyebrow-line"></span> FASE 03 / BEREDSKAP</div>
      <div class="briefing-grid">
        <section class="briefing-copy"><h1>Du valgte hva du<br><span>ikke skulle sikre.</span></h1>
          <p>Risikoene du vurderte er brede fagområder. Hendelsene i vakta kan krysse flere områder, komme i en annen rekkefølge eller treffe noe du ikke valgte å prioritere.</p>
          <p>Du har <strong>ingen tidsfrist</strong>. Hendelsen kan utvikle seg mens du vurderer: nye driftsmeldinger kommer etter 15 og 30 sekunder. Du kan svare når du er klar, og lese konsekvensene før du starter neste hendelse.</p>
          <section class="briefing-equipment">
            <h2>Dette har du på vakt</h2>
            <ul>
              <li>Du er én driftstekniker med tilgang til overvåking, logger og administrasjonskonsoller.</li>
              <li>Du kan bruke brannmur, nettverkssvitsjer, identitetskonsoll, kundekø og statusside.</li>
              <li>Du kan kontakte leverandør og byggets driftsvakt via kontaktlisten.</li>
              <li>Det finnes nattlige sikkerhetskopier, men ikke en separat, beskyttet kopi med mindre du finansierte tiltaket.</li>
              <li>Ingen ekstra serverpark, reservekjøling eller ekstra vaktpersonell er tilgjengelig med mindre en hendelse sier noe annet.</li>
            </ul>
          </section>
          <button class="button button-primary button-large" data-action="begin-simulation">Start simuleringen <span class="button-arrow">→</span></button>
        </section>
        <aside class="plan-summary">
          <div class="summary-header"><span>RESSURSPLAN</span><span class="status-pill status-ready">LÅST VED START</span></div>
          <div class="summary-stat"><span>Risikoer vurdert</span><strong>${risks.length} / ${risks.length}</strong></div>
          <div class="summary-stat"><span>Tiltak finansiert</span><strong>${planned} / ${risks.length}</strong></div>
          <div class="summary-stat"><span>Poeng brukt</span><strong>${spent} / ${budget}</strong></div>
          <div class="summary-measures">${risks.map((risk) => {
            const assessment = state.assessments[risk.id]
            const measure = risk.measures.find((item) => item.id === state.measureSelections[risk.id])
            const score = assessment.probability * assessment.impact
            return `<div><span class="risk-badge ${riskLevel(score).tone}">${riskLevel(score).label}</span><span>${risk.shortTitle}</span><strong>${measure?.cost ? `${measure.cost} POENG` : 'UFUNANSIERT'}</strong></div>`
          }).join('')}</div>
          <div class="budget-explainer summary-budget"><span class="budget-explainer-icon">!</span><p><strong>${budget - spent} poeng er ubrukt.</strong> Tiltakene dekker ikke nødvendigvis hendelsene som oppstår.</p></div>
        </aside>
      </div>
      <section class="simulation-rules">
        <strong>Slik virker tiltak og poeng i simuleringen</strong>
        <p>Hvis du finansierte et tiltak som er oppført som relevant for en hendelse, reduseres hvert negativt driftsutslag i den hendelsen med 20 %, avrundet til hele prosentpoeng. Flere relevante tiltak gir ikke ekstra reduksjon.</p>
        <p>Proaktivitet teller hvor mange av de sju hendelsestypene som har et direkte relevant, finansiert tiltak. Med sju tiltakspoeng kan planen dekke maksimalt seks av sju; én type må stå uten direkte dekning. Du får også se gjennomsnittlig driftsnivå og hele regnestykket for totalskåren.</p>
      </section>
    </main>`
}

function renderIncidentLog(): string {
  if (state.feed.length === 0) return '<div class="empty-log"><span class="live-dot"></span> Venter på første hendelse…</div>'
  return state.feed.slice(-7).map((entry, index) => `
    <div class="feed-row feed-${entry.kind}">
      <span class="feed-dot"></span><span class="feed-sequence">${String(Math.max(1, state.feed.length - 6 + index)).padStart(2, '0')}</span>
      <p>${entry.text}</p>
    </div>`).join('')
}

function renderMetric(key: keyof OperationalMetrics, label: string, initial: string): string {
  const value = state.metrics[key]
  return `<div class="status-metric">
    <span class="metric-icon">${initial}</span>
    <div class="metric-copy"><span>${label}</span><strong>${value}%</strong></div>
    <div class="metric-bar"><i class="${value < 35 ? 'bar-danger' : value < 60 ? 'bar-warning' : ''}" style="width:${value}%"></i></div>
  </div>`
}

function renderQueue(): string {
  const nextEvents = state.incidentDeck.slice(state.incidentIndex + 1, state.incidentIndex + 4)
  if (nextEvents.length === 0) return '<p class="queue-empty">Ingen flere varsler i køen.</p>'
  return nextEvents.map((incident, index) => `
    <div class="queue-item"><span>${String(index + 1).padStart(2, '0')}</span><strong>${incident.shortTitle}</strong></div>`).join('')
}

function renderIncidentDebrief(result: IncidentResult): string {
  const metricNames: Record<keyof OperationalMetrics, string> = {
    network: 'Nettverk',
    service: 'Tjenester',
    trust: 'Kundetillit',
    capacity: 'Vaktlag',
  }
  const metricChanges = (Object.keys(metricNames) as (keyof OperationalMetrics)[]).map((key) => {
    const change = result.metricsAfter[key] - result.metricsBefore[key]
    return `<div><span>${metricNames[key]}</span><strong class="${change < 0 ? 'impact-down' : change > 0 ? 'impact-up' : ''}">${result.metricsBefore[key]}% → ${result.metricsAfter[key]}% <small>(${change > 0 ? '+' : ''}${change})</small></strong></div>`
  }).join('')
  const preparedText = result.preparedMeasures.length
    ? `<div class="debrief-preparation"><strong>Planen din bidro</strong>${result.preparedMeasures.map((measure) => `<p><b>${measure.title}:</b> ${measure.reason}</p>`).join('')}</div>`
    : '<div class="debrief-preparation debrief-unprepared"><strong>Ingen finansiert plan traff denne hendelsen direkte.</strong><p>Det viser en begrensning i prioriteringen, ikke at risikovurderingen din var feil.</p></div>'
  return `<section class="response-debrief">
    <div class="debrief-kicker">HENDELSE AVKLART</div>
    <h3>Konsekvens av valget</h3>
    <p>${result.feedback}</p>
    <div class="debrief-metrics">${metricChanges}</div>
    ${preparedText}
    <button class="button button-primary" data-action="continue-simulation">Fortsett til neste hendelse <span>→</span></button>
  </section>`
}

function renderSimulation(): string {
  const incident = state.incidentDeck[state.incidentIndex]
  if (!incident) throw new Error('Fant ikke aktiv hendelse i simuleringen.')
  const choiceOrder = state.choiceOrders[incident.id] ?? incident.choices.map((_, index) => index)
  const preparedMeasures = preparedMeasuresFor(incident)
  const nextUpdateAt = (state.escalationStage + 1) * 15
  const secondsToNextUpdate = Math.max(0, nextUpdateAt - state.secondsElapsed)
  const choiceButtons = choiceOrder.map((choiceIndex, position) => {
    const choice = incident.choices[choiceIndex]
    return `<button class="response-option" data-action="respond" data-value="${choiceIndex}">
      <span class="response-index">0${position + 1}</span><span class="response-text"><strong>${choice.label}</strong><small><b>Verktøy:</b> ${choice.tool}</small><small><b>Ulempe/risiko:</b> ${choice.tradeoff}</small></span><span class="response-arrow">→</span>
    </button>`
  }).join('')
  const planImpact = preparedMeasures.length
    ? `<div class="plan-alert plan-alert-good"><span>✓</span><div><strong>Planen din støtter denne hendelsen</strong>${preparedMeasures.map((measure) => `<small><b>${measure.title}:</b> ${measure.reason}</small>`).join('')}</div></div>`
    : '<div class="plan-alert"><span>!</span><div><strong>Ingen finansiert tiltak treffer direkte</strong><small>Du må håndtere denne hendelsen med ressursene som er oppført nedenfor.</small></div></div>'
  let responseContent: string
  if (state.awaitingNext) {
    const result = state.results[state.results.length - 1]
    if (!result) throw new Error('Fant ikke resultatet for hendelsen som nettopp ble avklart.')
    responseContent = renderIncidentDebrief(result)
  } else {
    responseContent = `<div class="response-header"><div><span class="card-number">?</span><div><h3>Hva prioriterer du?</h3><p>Ingen respons er uten kostnad. Bruk beslutningspunktet, tilgjengelige verktøy og konsekvensene for å begrunne valget.</p></div></div><span class="choices-label">VELG RESPONS</span></div>
        <div class="response-options">${choiceButtons}</div>`
  }
  return `${renderHeader(4, `LIVE / HENDELSE 0${state.incidentIndex + 1} AV 0${state.incidentDeck.length}`)}
    <main class="sim-layout">
      <div class="sim-topline"><div><div class="eyebrow"><span class="eyebrow-line"></span> FASE 04 / LIVE DRIFTSSIMULERING</div><h1>Vakta er i gang.</h1></div>
        <div class="timer-card ${state.awaitingNext ? 'timer-paused' : ''} ${!state.awaitingNext && state.escalationStage >= incident.escalations.length ? 'timer-no-deadline' : ''}">
          <span class="meta-label">${state.awaitingNext ? 'TIDEN ER PAUSET' : state.escalationStage < incident.escalations.length ? 'NESTE STATUSMELDING' : 'INGEN SVARFRIST'}</span>
          <strong>${state.awaitingNext ? 'PAUSE' : state.escalationStage < incident.escalations.length ? `OM 00:${String(secondsToNextUpdate).padStart(2, '0')}` : 'Klar når du er'}</strong>
          <small>${state.awaitingNext ? 'Fortsett når du er klar.' : state.escalationStage < incident.escalations.length ? 'Hendelsen kan eskalere; du kan svare når som helst.' : 'Automatiske oppdateringer er ferdige.'}</small>
        </div>
      </div>
      <div class="sim-status">
        ${renderMetric('network', 'NETTVERK', 'N')}
        ${renderMetric('service', 'TJENESTER', 'T')}
        ${renderMetric('trust', 'KUNDETILLIT', 'K')}
        ${renderMetric('capacity', 'VAKTLAG', 'V')}
        <div class="incident-count"><span>HENDELSE</span><strong>0${state.incidentIndex + 1}<small> / 0${state.incidentDeck.length}</small></strong></div>
      </div>
      <div class="sim-grid">
        <section class="incident-card">
          <div class="incident-label"><span class="alert-icon">!</span><span>${incident.category}</span><span class="incident-time">${incident.severity}</span></div>
          <div class="incident-heading"><div><span class="meta-label">NYTT VARSEL · 0${state.incidentIndex + 1}</span><h2>${incident.title}</h2></div></div>
          <p class="incident-description">${incident.description}</p>
          <div class="incident-context"><span class="meta-label">DETTE VET DU NÅ</span><p>${incident.context}</p></div>
          <div class="incident-decision-point"><span class="meta-label">BESLUTNINGSPUNKT</span><p>${incident.decisionPoint}</p></div>
          <div class="incident-resources"><span class="meta-label">TILGJENGELIGE RESSURSER OG BEGRENSNINGER</span><ul>${incident.availableResources.map((resource) => `<li>${resource}</li>`).join('')}</ul></div>
          ${planImpact}
          ${state.latestUpdate && !state.awaitingNext ? `<div class="latest-update"><span class="update-pulse"></span><p>${state.latestUpdate}</p></div>` : ''}
          ${responseContent}
        </section>
        <aside class="ops-panel">
          <div class="ops-panel-title"><span>DRIFTSFEED</span><span class="live-label"><i></i> LIVE</span></div>
          <div class="ops-panel-footer ops-live-state"><span>VAKTSTATUS</span><strong><i class="live-dot"></i> ${state.awaitingNext ? 'VALG REGISTRERT' : 'HENDELSE PÅGÅR'}</strong></div>
          <div class="incident-log">${renderIncidentLog()}</div>
          <div class="queue-panel"><div class="queue-heading"><span>NESTE I VARSELKØEN</span><span>${state.incidentDeck.length - state.incidentIndex - 1} VENTER</span></div>${renderQueue()}</div>
        </aside>
      </div>
      <div class="sim-footnote"><span>ØVELSESMILJØ — INGEN EKTE SYSTEMER ER PÅVIRKET</span><span>Hendelsesrekkefølgen endres for hver øvelse</span></div>
    </main>`
}

function measureFor(risk: RiskScenario, measureId: string | undefined) {
  return risk.measures.find((measure) => measure.id === measureId)
}

function preparedMeasuresFor(incident: SimulationIncident): { title: string; reason: string }[] {
  return incident.mitigatedBy.flatMap(({ measureId, reason }) => {
    const risk = risks.find((item) => item.measures.some((measure) => measure.id === measureId))
    const measure = risk?.measures.find((item) => item.id === measureId)
    return risk && measure && state.measureSelections[risk.id] === measureId
      ? [{ title: measure.title, reason }]
      : []
  })
}

function preparedIncidentCount(): number {
  return state.results.filter((result) => result.preparedMeasures.length > 0).length
}

function planningScore(): number {
  return state.incidentDeck.length === 0
    ? 0
    : Math.round((preparedIncidentCount() / state.incidentDeck.length) * 100)
}

function operationalScore(): number {
  const metrics = Object.values(state.metrics)
  return Math.round(metrics.reduce((sum, value) => sum + value, 0) / metrics.length)
}

function renderResults(): string {
  const proactive = planningScore()
  const operations = operationalScore()
  const total = Math.round((proactive + operations) / 2)
  const preparedCount = preparedIncidentCount()
  const incidentCount = state.incidentDeck.length
  const weakest = Object.entries(state.metrics).sort((a, b) => a[1] - b[1])[0]
  const metricNames: Record<keyof OperationalMetrics, string> = {
    network: 'nettverket',
    service: 'tjenestene',
    trust: 'kundetilliten',
    capacity: 'vaktlagets kapasitet',
  }
  const weakestName = weakest ? metricNames[weakest[0] as keyof OperationalMetrics] : 'driften'
  const learningSummary = `${preparedCount} av ${incidentCount} hendelser hadde et finansiert tiltak som var oppført som direkte relevant. Ved hendelser uten slik dekning måtte du støtte deg på valgene og ressursene du faktisk hadde.`
  return `${renderHeader(5, 'OPPDRAG AVSLUTTET')}
    <main class="results-layout">
      <div class="eyebrow"><span class="eyebrow-line"></span> ETTEREVALUERING / OPPDRAG NS–001</div>
      <div class="results-heading"><div><h1>Vakta er avsluttet.<br><span>Se hva valgene førte til.</span></h1><p>Skårene under viser både hvor planen ga direkte støtte, og hvilken tilstand driften endte i.</p></div>
        <div class="total-score"><span>SAMLET RESULTAT</span><strong>${total}</strong><small>AV 100</small></div>
      </div>
      <div class="score-cards">
        <article class="score-card"><div class="score-card-title"><span class="score-icon proactive-icon">P</span><span>PROAKTIVITET</span></div><strong>${proactive}<small> / 100</small></strong><p>${preparedCount} av ${incidentCount} hendelser hadde minst ett direkte relevant, finansiert tiltak.</p><div class="score-track"><i style="width:${proactive}%"></i></div></article>
        <article class="score-card"><div class="score-card-title"><span class="score-icon operation-icon">D</span><span>DRIFT VED VAKTSLUTT</span></div><strong>${operations}<small> / 100</small></strong><p>Gjennomsnitt av sluttverdiene for nettverk, tjenester, kundetillit og vaktlag.</p><div class="score-track"><i style="width:${operations}%"></i></div></article>
      </div>
      <section class="score-method">
        <h2>Slik regnes resultatet ut</h2>
        <div><strong>Proaktivitet</strong><span>${preparedCount} ÷ ${incidentCount} × 100 = ${proactive} (avrundet)</span></div>
        <div><strong>Drift</strong><span>(${state.metrics.network} + ${state.metrics.service} + ${state.metrics.trust} + ${state.metrics.capacity}) ÷ 4 = ${operations} (avrundet)</span></div>
        <div><strong>Samlet</strong><span>(${proactive} + ${operations}) ÷ 2 = ${total} (avrundet)</span></div>
        <p>Proaktivitet teller hendelser med direkte relevant, finansiert tiltak; den vurderer ikke om du valgte et «riktig» risikonivå. Hver hendelse teller likt. Med sju tiltakspoeng er høyeste mulige dekning seks av sju (86). Drift starter på 100 for alle målinger. Et relevant tiltak reduserer hvert negativt utslag i hendelsen med 20 %, avrundet til hele prosentpoeng; tiltakene stables ikke. Dette er en forenklet spillmodell, ikke en faktisk risikoberegning.</p>
      </section>
      <div class="results-grid">
        <section class="review-card"><div class="review-heading"><div><span class="meta-label">HENDELSESFORLØP</span><h2>Valg og konsekvenser</h2></div><span>${state.results.length} HENDELSER</span></div>
          ${state.results.map((result, index) => {
            const incident = state.incidentDeck.find((item) => item.id === result.incidentId)
            const preparation = result.preparedMeasures.length
              ? result.preparedMeasures.map((measure) => `<p><b>${measure.title}:</b> ${measure.reason}</p>`).join('')
              : '<p>Ingen finansiert tiltak var oppført som direkte relevant for denne hendelsen.</p>'
            return `<div class="review-row"><span class="review-number">0${index + 1}</span><div class="review-copy"><strong>${incident?.shortTitle}</strong><small>${result.choiceLabel}</small><p>${result.feedback}</p><small class="review-metrics">Før → etter: nettverk ${result.metricsBefore.network}→${result.metricsAfter.network} · tjenester ${result.metricsBefore.service}→${result.metricsAfter.service} · tillit ${result.metricsBefore.trust}→${result.metricsAfter.trust} · vaktlag ${result.metricsBefore.capacity}→${result.metricsAfter.capacity}</small><div class="review-preparation"><b>Forberedelse:</b>${preparation}</div></div><span class="review-tag ${result.preparedMeasures.length ? 'tag-good' : ''}">${result.preparedMeasures.length ? 'TILTAK TRAFF' : 'IKKE DEKKET'}</span></div>`
          }).join('')}
        </section>
        <aside class="learning-card"><span class="meta-label">LÆRINGSPUNKT</span><div class="learning-icon">↗</div><h2>Hva resultatet viser</h2><p>${learningSummary}</p><p>Ved vaktslutt var ${weakestName} den laveste driftsmålingen (${weakest?.[1] ?? 0} av 100). Se hendelsesforløpet for å finne hvilke avgjørelser og eskaleringer som påvirket den.</p>
          <div class="final-metrics">${Object.entries(state.metrics).map(([key, value]) => {
            const labels: Record<keyof OperationalMetrics, string> = {
              network: 'Nettverk',
              service: 'Tjenester',
              trust: 'Kundetillit',
              capacity: 'Vaktlag',
            }
            return `<div><span>${labels[key as keyof OperationalMetrics]}</span><strong>${value}%</strong></div>`
          }).join('')}</div>
          <div class="learning-matrix"><strong>RISIKOER OG FINANSIERTE TILTAK</strong>${risks.map((risk) => {
              const assessment = state.assessments[risk.id]
              const score = assessment.probability * assessment.impact
              const level = riskLevel(score)
              const measure = measureFor(risk, state.measureSelections[risk.id])
              return `<div><span>${risk.shortTitle}</span><span class="risk-badge ${level.tone}">${score} · ${measure?.cost ? `${measure.cost} P` : '0 P'}</span></div>`
            }).join('')}</div>
        </aside>
      </div>
      <div class="results-footer"><span>Resultatet er en læringsindikator — ikke en fasit på reell sikkerhet.</span><button class="button button-primary" data-action="replay">Spill på nytt <span>↻</span></button></div>
    </main>`
}

function render(): void {
  const content = {
    intro: renderIntro,
    risk: renderRisk,
    measures: renderMeasures,
    briefing: renderBriefing,
    simulation: renderSimulation,
    results: renderResults,
  }[state.phase]()
  app!.innerHTML = content
}

function clearTimer(): void {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
}

function shuffle<T>(values: T[]): T[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[values[index], values[swapIndex]] = [values[swapIndex], values[index]]
  }
  return values
}

function addFeed(kind: FeedEntry['kind'], text: string): void {
  state.feed.push({ kind, text })
  if (state.feed.length > 12) state.feed.shift()
}

function applyEffects(effects: OperationalMetrics, prepared: boolean): void {
  for (const key of Object.keys(state.metrics) as (keyof OperationalMetrics)[]) {
    const change = effects[key]
    const adjusted = change < 0 && prepared ? Math.round(change * 0.8) : change
    state.metrics[key] = Math.max(0, Math.min(100, state.metrics[key] + adjusted))
  }
}

function activeIncident(): SimulationIncident {
  const incident = state.incidentDeck[state.incidentIndex]
  if (!incident) throw new Error('Fant ikke aktiv hendelse i simuleringen.')
  return incident
}

function startIncidentTimer(): void {
  clearTimer()
  timer = window.setInterval(() => {
    state.secondsElapsed += 1
    const incident = activeIncident()
    const nextEscalation = incident.escalations[state.escalationStage]
    const threshold = (state.escalationStage + 1) * 15
    if (nextEscalation && state.secondsElapsed >= threshold) {
      applyEffects(nextEscalation.effects, preparedMeasuresFor(incident).length > 0)
      state.latestUpdate = nextEscalation.message
      addFeed('update', nextEscalation.message)
      state.escalationStage += 1
    }
    if (state.escalationStage >= incident.escalations.length) {
      clearTimer()
    }
    render()
  }, 1000)
}

function startSimulation(): void {
  state.phase = 'simulation'
  state.incidentDeck = shuffle([...incidents])
  state.choiceOrders = Object.fromEntries(
    state.incidentDeck.map((incident) => [incident.id, shuffle(incident.choices.map((_, index) => index))]),
  )
  state.incidentIndex = 0
  state.awaitingNext = false
  state.secondsElapsed = 0
  state.escalationStage = 0
  state.metrics = { network: 100, service: 100, trust: 100, capacity: 100 }
  state.incidentStartMetrics = { ...state.metrics }
  state.results = []
  state.feed = []
  state.latestUpdate = ''
  addFeed('update', 'Vakt startet. Overvåker tjenester og innkommende varsler.')
  addFeed('alarm', activeIncident().title)
  startIncidentTimer()
  render()
}

function resolveIncident(choiceIndex: number): void {
  const incident = activeIncident()
  const choice: IncidentChoice | undefined = incident.choices[choiceIndex]
  if (!choice) throw new Error(`Ugyldig responsvalg for hendelsen ${incident.id}.`)

  const preparedMeasures = preparedMeasuresFor(incident)
  applyEffects(choice.effects, preparedMeasures.length > 0)
  const feedback = choice.feedback
  const choiceLabel = choice.label
  state.results.push({
    incidentId: incident.id,
    choiceLabel,
    feedback,
    preparedMeasures,
    metricsBefore: { ...state.incidentStartMetrics },
    metricsAfter: { ...state.metrics },
  })
  addFeed('decision', `Valg registrert: ${choiceLabel}`)
  state.latestUpdate = feedback
  clearTimer()

  if (state.incidentIndex === state.incidentDeck.length - 1) {
    state.phase = 'results'
  } else {
    state.awaitingNext = true
  }
  render()
}

function continueSimulation(): void {
  if (!state.awaitingNext) return
  state.incidentIndex += 1
  state.awaitingNext = false
  state.secondsElapsed = 0
  state.escalationStage = 0
  state.incidentStartMetrics = { ...state.metrics }
  state.latestUpdate = ''
  addFeed('alarm', activeIncident().title)
  startIncidentTimer()
  render()
}

function resetGame(): void {
  clearTimer()
  state.phase = 'intro'
  state.riskIndex = 0
  state.draft = { probability: null, impact: null }
  state.assessments = {}
  state.measureSelections = {}
  state.incidentDeck = []
  state.choiceOrders = {}
  state.incidentIndex = 0
  state.awaitingNext = false
  state.secondsElapsed = 0
  state.escalationStage = 0
  state.metrics = { network: 100, service: 100, trust: 100, capacity: 100 }
  state.incidentStartMetrics = { ...state.metrics }
  state.results = []
  state.feed = []
  state.latestUpdate = ''
  render()
}

app.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest<HTMLButtonElement>('[data-action]')
  if (!button || button.disabled) return

  const action = button.dataset.action
  const value = button.dataset.value
  if (action === 'start') {
    state.phase = 'risk'
  } else if (action === 'set-probability') {
    state.draft.probability = Number(value)
  } else if (action === 'set-impact') {
    state.draft.impact = Number(value)
  } else if (action === 'set-measure') {
    const riskId = button.dataset.risk
    if (!riskId || !risks.some((risk) => risk.id === riskId) || !value) {
      throw new Error('Tiltaksvalget mangler en gyldig risiko eller tiltakstype.')
    }
    state.measureSelections[riskId] = value
  } else if (action === 'confirm-risk') {
    const risk = risks[state.riskIndex]
    if (state.draft.probability === null || state.draft.impact === null) return
    state.assessments[risk.id] = {
      probability: state.draft.probability,
      impact: state.draft.impact,
    }
    if (state.riskIndex === risks.length - 1) {
      state.phase = 'measures'
    } else {
      state.riskIndex += 1
      state.draft = { probability: null, impact: null }
    }
  } else if (action === 'confirm-measures') {
    if (Object.keys(state.measureSelections).length !== risks.length) return
    state.phase = 'briefing'
  } else if (action === 'begin-simulation') {
    startSimulation()
    return
  } else if (action === 'respond') {
    resolveIncident(Number(value))
    return
  } else if (action === 'continue-simulation') {
    continueSimulation()
    return
  } else if (action === 'replay' || action === 'home') {
    resetGame()
    return
  }
  render()
})

render()
