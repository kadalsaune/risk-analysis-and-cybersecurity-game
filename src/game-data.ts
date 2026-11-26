export type Measure = {
  id: string
  title: string
  description: string
  cost: number
  covers: string[]
}

export type RiskScenario = {
  id: string
  shortTitle: string
  title: string
  description: string
  evidence: string[]
  probabilityQuestion: string
  impactQuestion: string
  category: string
  icon: string
  tags: string[]
  measures: Measure[]
}

export type OperationalMetrics = {
  network: number
  service: number
  trust: number
  capacity: number
}

export type IncidentChoice = {
  label: string
  tool: string
  tradeoff: string
  effects: OperationalMetrics
  feedback: string
}

export type SimulationIncident = {
  id: string
  shortTitle: string
  title: string
  category: string
  severity: string
  description: string
  context: string
  decisionPoint: string
  availableResources: string[]
  mitigatedBy: {
    measureId: string
    reason: string
  }[]
  exposureTags: string[]
  escalations: {
    message: string
    effects: OperationalMetrics
  }[]
  choices: IncidentChoice[]
}

export const risks: RiskScenario[] = [
  {
    id: 'supplier',
    shortTitle: 'Avhengighet av leverandører',
    title: 'Når en leverandør svikter',
    description: 'To av Nordlys ITs kundetjenester bruker den samme eksterne driftspartneren. Hvis partneren får et avbrudd, kan ikke Nordlys IT selv rette feilen.',
    evidence: [
      'Driftspartneren hadde to avbrudd på 30–45 minutter det siste året.',
      'Avtalen lover 99,9 % tilgjengelighet, men det er ikke avtalt en alternativ leverandør.',
      'En manuell reserveprosess finnes på papiret, men er ikke testet.',
    ],
    probabilityQuestion: 'Hvor sannsynlig er det at et nytt avbrudd hos driftspartneren påvirker Nordlys ITs kundetjenester i løpet av de neste 12 månedene? Vurder både de to tidligere avbruddene og at tjenestene deler samme leverandør.',
    impactQuestion: 'Hvis partneren er utilgjengelig en hel arbeidsdag, hvor mange av Nordlys ITs tjenester og kunder rammes? Hvor godt kan den uprøvde manuelle prosessen begrense følgene?',
    category: 'LEVERANDØR / KONTINUITET',
    icon: '⇄',
    tags: ['vendor', 'availability', 'network'],
    measures: [
      { id: 'supplier-failover', title: 'Avtal alternativ leveranse', description: 'Etabler reell reserve for kritiske leverandørtjenester.', cost: 4, covers: ['vendor', 'availability', 'network'] },
      { id: 'supplier-runbook', title: 'Lag kontakt- og kontinuitetsplan', description: 'Definer eskalering, kontaktpunkter og manuell reserveprosess.', cost: 2, covers: ['vendor', 'availability'] },
      { id: 'none', title: 'Ikke finansier nå', description: 'Bruk poengene på andre risikoer.', cost: 0, covers: [] },
    ],
  },
  {
    id: 'facility',
    shortTitle: 'Fysisk infrastruktur',
    title: 'Et driftsmiljø med få reserver',
    description: 'Nettverksutstyret står i et låst rom i et delt kontorbygg. Strøm og kjøling er avhengig av lokalt utstyr, og Nordlys IT har ikke et annet serverrom klart.',
    evidence: [
      'UPS-batteriet ble montert for åtte år siden. Kapasiteten er ikke belastningstestet de siste 18 månedene.',
      'Temperaturvarsleren ble testet for seks måneder siden, men kjøleanlegget har ingen automatisk reserve.',
      'Adgangsloggen for serverrommet gjennomgås bare ved en konkret hendelse.',
    ],
    probabilityQuestion: 'Hvor sannsynlig er det at strøm, kjøling eller fysisk adgang skaper et driftsavbrudd i løpet av de neste 12 månedene? Se på alder og testhistorikk for utstyret, men skill mellom en mulig feil og et sikkert avbrudd.',
    impactQuestion: 'Hvis strømmen eller kjølingen svikter i flere timer, hvilke tjenester påvirkes når utstyret står samlet i ett rom? Vurder også om uautorisert fysisk tilgang kan gi et kort eller langvarig avbrudd.',
    category: 'FYSISK / DRIFT',
    icon: '⌑',
    tags: ['physical', 'power', 'availability', 'access'],
    measures: [
      { id: 'facility-reserve', title: 'Test reservekraft og kjøling', description: 'Test UPS, temperaturvarsling og kontrollert nedstenging.', cost: 3, covers: ['physical', 'power', 'availability'] },
      { id: 'facility-routine', title: 'Stram inn fysisk kontroll', description: 'Før besøkslogg og innfør faste kontroller av rom og utstyr.', cost: 2, covers: ['physical', 'access'] },
      { id: 'none', title: 'Ikke finansier nå', description: 'Bruk poengene på andre risikoer.', cost: 0, covers: [] },
    ],
  },
  {
    id: 'identity',
    shortTitle: 'Identitet og menneskelige feil',
    title: 'En konto får for mye tillit',
    description: 'Support og drift bruker kontoer med ulik tilgang til kundesaker og interne verktøy. En kompromittert eller feilbrukt konto kan derfor få større rekkevidde enn den ansatte trenger.',
    evidence: [
      'Det er 42 ansatte og fem administratorkontoer. Flerfaktorautentisering er ikke påkrevd for alle administratorkontoene.',
      'Ansatte rapporterte tre mistenkelige e-poster det siste kvartalet; ingen bekreftet kontoovertakelse er registrert.',
      'Uvanlige hasteforespørsler blir noen ganger godkjent uten kontroll via en annen kanal.',
    ],
    probabilityQuestion: 'Hvor sannsynlig er det at en ansatt gjør en feil eller at en konto blir misbrukt med tilgang til interne verktøy i løpet av de neste 12 månedene? Bruk rapportene og tilgangspraksisen som tegn, men ikke anta at hver mistenkelig e-post fører til et angrep.',
    impactQuestion: 'Hvis en av de fem administratorkontoene blir misbrukt, hvor mye større kan konsekvensen bli enn ved en vanlig supportkonto? Vurder hvilke kundedata og driftssystemer kontoen kan nå.',
    category: 'MENNESKER / IDENTITET',
    icon: '◎',
    tags: ['identity', 'human', 'access', 'data'],
    measures: [
      { id: 'identity-mfa', title: 'Beskytt privilegerte kontoer', description: 'Krev flerfaktorautentisering og begrens administrative tilganger.', cost: 3, covers: ['identity', 'access', 'data'] },
      { id: 'identity-verify', title: 'Innfør kontroll ved hastesaker', description: 'Bekreft uvanlige forespørsler via en separat kanal.', cost: 2, covers: ['human', 'identity'] },
      { id: 'none', title: 'Ikke finansier nå', description: 'Bruk poengene på andre risikoer.', cost: 0, covers: [] },
    ],
  },
  {
    id: 'recovery',
    shortTitle: 'Gjenoppretting av data',
    title: 'Backup er ikke det samme som beredskap',
    description: 'Nordlys IT tar sikkerhetskopi av kundedata og driftsoppsett, men har ikke nylig vist at kopiene kan gjenopprettes raskt nok etter et større datatap.',
    evidence: [
      'Sikkerhetskopi tas hver natt, og siste vellykkede jobb er registrert i overvåkingen.',
      'Siste fullstendige gjenopprettingstest var for ni måneder siden. Testen tok ikke med alle kundetjenestene.',
      'Kopiene er tilgjengelige fra det vanlige driftsmiljøet med administratorkontoer.',
    ],
    probabilityQuestion: 'Hvor sannsynlig er det at Nordlys IT ikke får gjenopprettet én eller flere tjenester når de trengs i løpet av de neste 12 månedene? Skill mellom at en backupjobb feiler og at en gjenopprettingstest faktisk mislykkes.',
    impactQuestion: 'Hvis de tilgjengelige kopiene ikke kan brukes etter et større datatap, hvor lenge kan kritiske tjenester være nede? Vurder at kopiene ikke dekker alle tjenestene og bruker samme driftsmiljø.',
    category: 'TEKNISK / GJENOPPRETTING',
    icon: '↻',
    tags: ['recovery', 'data', 'availability', 'network'],
    measures: [
      { id: 'recovery-isolated', title: 'Beskytt en separat sikkerhetskopi', description: 'Hold minst én gjenopprettingskopi utenfor vanlig driftstilgang.', cost: 4, covers: ['recovery', 'data', 'availability'] },
      { id: 'recovery-test', title: 'Øv på gjenoppretting', description: 'Test restore og avklar hvem som prioriterer tjenester.', cost: 2, covers: ['recovery', 'availability'] },
      { id: 'none', title: 'Ikke finansier nå', description: 'Bruk poengene på andre risikoer.', cost: 0, covers: [] },
    ],
  },
  {
    id: 'privacy',
    shortTitle: 'Personvern og tilgang',
    title: 'Kundedata på feil sted',
    description: 'Support må kunne hjelpe kunder raskt, men dagens tilgangsoppsett gjør det mulig for flere medarbeidere å se opplysninger de ikke trenger i alle saker.',
    evidence: [
      'Tolv supportmedarbeidere kan åpne saker for alle kundene, også når de bare jobber med én kundegruppe.',
      'Tilganger gjennomgås én gang i året. Endringer i arbeidsoppgaver varsles ikke alltid til den som administrerer tilgangen.',
      'En kunde meldte om en mulig feilvisning for to måneder siden. Undersøkelsen fant ingen bekreftet eksponering.',
    ],
    probabilityQuestion: 'Hvor sannsynlig er det at en ansatt ved en feil får innsyn i eller deler en annen kundes opplysninger i løpet av de neste 12 månedene? Vurder de brede tilgangene og det tidligere varselet, men ta med at eksponeringen ikke ble bekreftet.',
    impactQuestion: 'Hvis opplysninger fra én eller flere kundesaker blir sett av feil person, hvor alvorlig blir følgene for kundene og Nordlys IT? Vurder typen data, hvor mange som kan rammes, og behovet for oppfølging.',
    category: 'PERSONVERN / DATA',
    icon: '◉',
    tags: ['privacy', 'data', 'access', 'change'],
    measures: [
      { id: 'privacy-access', title: 'Begrens datatilgang', description: 'Gi tilgang etter arbeidsbehov og fjern unødvendige rettigheter.', cost: 3, covers: ['privacy', 'access', 'data'] },
      { id: 'privacy-review', title: 'To-personers kontroll', description: 'Krev gjennomgang av endringer i deling og kundedata.', cost: 2, covers: ['privacy', 'change'] },
      { id: 'none', title: 'Ikke finansier nå', description: 'Bruk poengene på andre risikoer.', cost: 0, covers: [] },
    ],
  },
  {
    id: 'change',
    shortTitle: 'Endringer i produksjon',
    title: 'En liten endring med stor rekkevidde',
    description: 'Teknikerne oppdaterer kundeportalen og interne systemer jevnlig. En feil kan påvirke flere kunder før den blir oppdaget, særlig når endringen ikke er enkel å rulle tilbake.',
    evidence: [
      'Det gjennomføres vanligvis 10–12 produksjonsendringer i måneden.',
      'Tilbakeføring ble testet for to av de siste åtte endringene. De øvrige hadde varierende dokumentasjon.',
      'Kollegakontroll er påkrevd for større endringer, men ikke for alle hastefikser.',
    ],
    probabilityQuestion: 'Hvor sannsynlig er det at en produksjonsendring skaper en feil som påvirker kunder i løpet av de neste 12 månedene? Bruk antall endringer og testhistorikken som grunnlag, og vurder at ikke alle endringer har samme risiko.',
    impactQuestion: 'Hvis en feil slipper gjennom, hvor stor del av kundeportalen eller driften kan bli påvirket før den oppdages? Vurder hvor mange kunder som bruker tjenesten, og hvor godt endringen kan rulles tilbake.',
    category: 'TEKNISK / ENDRING',
    icon: '⌘',
    tags: ['change', 'availability', 'network', 'data'],
    measures: [
      { id: 'change-rollback', title: 'Test tilbakeføring før endring', description: 'Dokumenter rollback og test den for kritiske tjenester.', cost: 3, covers: ['change', 'availability', 'network'] },
      { id: 'change-review', title: 'Krev kollegakontroll', description: 'La en annen tekniker vurdere endringer med stor rekkevidde.', cost: 2, covers: ['change', 'data'] },
      { id: 'none', title: 'Ikke finansier nå', description: 'Bruk poengene på andre risikoer.', cost: 0, covers: [] },
    ],
  },
]

export const incidents: SimulationIncident[] = [
  {
    id: 'power-event',
    shortTitle: 'Temperaturalarm i utstyrsrommet',
    title: 'Temperaturen stiger i utstyrsrommet',
    category: 'FYSISK / INFRASTRUKTUR',
    severity: 'ALVORLIG',
    description: 'En temperatursensor varsler om rask oppvarming. Nettverksutstyret er fortsatt tilgjengelig, men flere tjenester rapporterer ustabilitet.',
    context: 'Du vet ennå ikke om kjølingen har stoppet helt eller om sensoren viser feil.',
    decisionPoint: 'Sensoren viser en rask temperaturøkning, men årsaken er ikke bekreftet. Avgjør hvor raskt du må gripe inn, og hvor mye tjenestenedetid du kan akseptere for å beskytte utstyret.',
    availableResources: [
      'Temperaturlogg og administrasjonskonsoll for serverne.',
      'UPS med ukjent kapasitet: siste belastningstest var for 18 måneder siden.',
      'Telefonnummer til byggets driftsvakt.',
      'Ingen reservekjøling eller ekstra serverrom er tilgjengelig.',
    ],
    mitigatedBy: [
      { measureId: 'facility-reserve', reason: 'Reservekraft og temperaturvarsling er testet, slik at du kan handle med mer pålitelig informasjon.' },
    ],
    exposureTags: ['physical', 'power', 'availability', 'network'],
    escalations: [
      { message: 'Temperaturen fortsetter å stige. Flere tjenester svarer tregere.', effects: { network: -3, service: -5, trust: 0, capacity: -2 } },
      { message: 'Utstyr begynner å koble seg fra. Kundesaker øker.', effects: { network: -7, service: -8, trust: -3, capacity: -4 } },
    ],
    choices: [
      { label: 'Bekreft kjølefeilen før du gjør større endringer', tool: 'Sammenlign temperaturloggen med byggets driftsvakt.', tradeoff: 'Gir bedre grunnlag for målrettet handling, men temperaturen kan stige mens du undersøker.', effects: { network: -5, service: -6, trust: -3, capacity: -5 }, feedback: 'Du fikk avklart om sensoren eller kjølingen var problemet før du valgte et større inngrep.' },
      { label: 'Steng ned utsatte servere kontrollert', tool: 'Bruk administrasjonskonsollen og UPS-en; kapasiteten er ikke bekreftet.', tradeoff: 'Reduserer belastningen på varmt utstyr, men tjenester på serverne blir utilgjengelige.', effects: { network: -13, service: -15, trust: -6, capacity: -4 }, feedback: 'Nedstengingen reduserte belastningen på utstyret, men kundene mistet tilgang til berørte tjenester.' },
      { label: 'La utstyret gå mens du følger sensorverdiene', tool: 'Overvåk temperaturloggen hvert minutt.', tradeoff: 'Unngår et umiddelbart tjenestekutt, men en reell kjølefeil kan forverres raskt.', effects: { network: -14, service: -8, trust: -10, capacity: -3 }, feedback: 'Du unngikk en umiddelbar nedstenging, men ustabiliteten rakk å påvirke flere tjenester.' },
    ],
  },
  {
    id: 'vendor-event',
    shortTitle: 'Ekstern driftspartner utilgjengelig',
    title: 'Driftspartneren svarer ikke',
    category: 'LEVERANDØR / TILGJENGELIGHET',
    severity: 'HØY',
    description: 'En ekstern plattform som brukes til kundestøtte, har sluttet å svare. Leverandørens statusmelding gir ingen estimert rettetid.',
    context: 'Kundestøtte går tregere, men ordre- og fakturadata er foreløpig tilgjengelige.',
    decisionPoint: 'Leverandøren har ikke gitt noen rettetid, mens køen vokser. Velg hvordan du holder kundene informert og får viktige saker gjennom uten å anta at en alternativ leverandør finnes.',
    availableResources: [
      'Leverandørens statusside og kontaktpunkt fra avtalen.',
      'Køen med kundesaker og Nordlys ITs egen statusside.',
      'En manuell arbeidsflyt finnes på papir, men er ikke testet.',
      'Ingen alternativ leverandør er avtalt.',
    ],
    mitigatedBy: [
      { measureId: 'supplier-failover', reason: 'En avtalt alternativ leveranse reduserer avhengigheten av den utilgjengelige leverandøren.' },
      { measureId: 'supplier-runbook', reason: 'En testet kontakt- og kontinuitetsplan gjør det raskere å gå over til manuell drift.' },
    ],
    exposureTags: ['vendor', 'availability', 'network', 'human'],
    escalations: [
      { message: 'Leverandøren har fortsatt ikke bekreftet omfanget. Køen vokser.', effects: { network: -2, service: -6, trust: -4, capacity: -3 } },
      { message: 'Kundestøttekøen har passert normal kapasitet.', effects: { network: 0, service: -7, trust: -7, capacity: -6 } },
    ],
    choices: [
      { label: 'Bruk den manuelle arbeidsflyten for viktige saker', tool: 'Følg papirprosedyren og registrer sakene i køen for etterføring.', tradeoff: 'Holder kritisk kundearbeid i gang, men den uprøvde prosessen tar tid og gir fare for dobbeltarbeid.', effects: { network: 0, service: -11, trust: -5, capacity: -9 }, feedback: 'Manuell behandling holdt viktige saker i gang, men den uprøvde prosessen bandt opp vaktlaget.' },
      { label: 'Sorter køen etter konsekvens for kunden', tool: 'Bruk sakslisten til å prioritere driftsstans og tidskritiske saker først.', tradeoff: 'De mest berørte kundene får hjelp først; andre saker venter lenger.', effects: { network: -1, service: -8, trust: -5, capacity: -11 }, feedback: 'Kundene med størst konsekvens ble prioritert, mens resten av køen fortsatt vokste.' },
      { label: 'Stans saksbehandlingen og publiser status', tool: 'Bruk Nordlys ITs statusside og vis til leverandørens statusside.', tradeoff: 'Reduserer gjentatte henvendelser, men ingen kundesaker blir løst før leverandøren er tilbake.', effects: { network: 0, service: -17, trust: -4, capacity: 3 }, feedback: 'Statusinformasjonen reduserte trykket på vaktlaget, men saksbehandlingen stod stille.' },
    ],
  },
  {
    id: 'identity-event',
    shortTitle: 'Uvanlig aktivitet på en konto',
    title: 'En ansatts konto oppfører seg uvanlig',
    category: 'IDENTITET / MULIG MISBRUK',
    severity: 'HØY',
    description: 'En ansatt melder om varsler hun ikke kjenner igjen. Kontoen har nylig hatt tilgang til flere kundesaker.',
    context: 'Det er uklart om dette skyldes en legitim innlogging, feil eller misbruk.',
    decisionPoint: 'Det kan være en falsk alarm, men kontoen har tilgang til kundesaker og nye varsler kommer inn. Vei risikoen ved å la kontoen være aktiv mot driftsforstyrrelsen ved å sperre den.',
    availableResources: [
      'Identitetskonsoll for å sperre kontoer og tilbakekalle aktive økter.',
      'Innloggingslogg og registrert telefonnummer til den ansatte.',
      'Én driftstekniker er tilgjengelig; ingen egen sikkerhetsgruppe er på vakt.',
    ],
    mitigatedBy: [
      { measureId: 'identity-mfa', reason: 'Flerfaktorautentisering og begrensede adminrettigheter reduserer hvor mye en overtatt konto kan gjøre.' },
      { measureId: 'identity-verify', reason: 'Kontroll via en separat kanal gjør det enklere å skille en legitim innlogging fra misbruk.' },
    ],
    exposureTags: ['identity', 'human', 'access', 'data'],
    escalations: [
      { message: 'Det kommer nye innloggingsvarsler mens du undersøker.', effects: { network: -4, service: -2, trust: -3, capacity: -3 } },
      { message: 'Flere kundesaker er åpnet fra kontoen.', effects: { network: -6, service: -5, trust: -8, capacity: -5 } },
    ],
    choices: [
      { label: 'Sperr kontoen og tilbakekall aktive økter', tool: 'Bruk identitetskonsollen; kontakt den ansatte etterpå.', tradeoff: 'Begrenser mulig misbruk raskt, men den ansatte mister tilgangen mens saken undersøkes.', effects: { network: -3, service: -8, trust: -2, capacity: -7 }, feedback: 'Kontoen ble stanset mens du undersøkte. Det begrenset mulig videre tilgang, men arbeidet måtte fordeles på nytt.' },
      { label: 'Bekreft innloggingen via den registrerte telefonen', tool: 'Sammenlign svaret med innloggingsloggen før du endrer kontoen.', tradeoff: 'Unngår å sperre en legitim bruker, men misbruk kan fortsette mens du verifiserer.', effects: { network: -6, service: -5, trust: -5, capacity: -6 }, feedback: 'Du fikk mer informasjon før et inngrep, men kontoens tilgang var ikke begrenset mens du ventet.' },
      { label: 'La kontoen være aktiv mens du følger loggene', tool: 'Bruk innloggingsloggen; ingen handling stopper aktive økter.', tradeoff: 'Unngår umiddelbar driftsforstyrrelse, men mulig misbruk kan fortsette uten begrensning.', effects: { network: -12, service: -2, trust: -12, capacity: -4 }, feedback: 'Arbeidsflyten fortsatte, men du lot mulig misbruk fortsette mens du samlet logger.' },
    ],
  },
  {
    id: 'change-event',
    shortTitle: 'Kundeportalen feiler etter en endring',
    title: 'Kundeportalen viser feil etter oppdatering',
    category: 'ENDRING / TJENESTEKVALITET',
    severity: 'HØY',
    description: 'Etter en planlagt oppdatering får noen kunder feil status på sakene sine. Andre deler av portalen virker fortsatt.',
    context: 'Det er ikke avklart om feilen bare gjelder visning eller også lagring av nye endringer.',
    decisionPoint: 'Feilen startet rett etter en utrulling. Du må stoppe feilaktige endringer raskt, men unngå å miste gyldige data eller stenge mer av portalen enn nødvendig.',
    availableResources: [
      'Utrullingslogg og forrige versjonspakke for portalen.',
      'Tilgang til å sette portalen i skrivebeskyttet modus.',
      'Funksjonsbryter for å slå av statusvisningen uten å stenge hele portalen.',
      'Kundedata kan kontrolleres i loggene før en tilbakeføring.',
    ],
    mitigatedBy: [
      { measureId: 'change-rollback', reason: 'En testet tilbakeføring gjør det raskere og tryggere å gå tilbake fra den siste endringen.' },
      { measureId: 'change-review', reason: 'Kollegakontroll gjør det lettere å se om utrullingen kan påvirke lagrede data.' },
      { measureId: 'privacy-review', reason: 'To-personers kontroll av endringer i kundedata kan fange opp feil før de vises i kundeportalen.' },
    ],
    exposureTags: ['change', 'availability', 'network', 'data', 'privacy'],
    escalations: [
      { message: 'Flere kunder melder om avvik. Det er fortsatt uklart om data påvirkes.', effects: { network: -2, service: -5, trust: -5, capacity: -3 } },
      { message: 'Feilen sprer seg til flere deler av portalen.', effects: { network: -5, service: -9, trust: -8, capacity: -5 } },
    ],
    choices: [
      { label: 'Rull tilbake til forrige versjon', tool: 'Bruk versjonspakken og kontroller nye data i utrullingsloggen.', tradeoff: 'Kan rette feilen raskt; data skrevet etter utrullingen må sammenlignes før alt åpnes igjen.', effects: { network: -4, service: -9, trust: -4, capacity: -8 }, feedback: 'Tilbakerullingen fjernet den siste endringen. Du måtte kontrollere data som var skrevet etter utrullingen.' },
      { label: 'Sett portalen i skrivebeskyttet modus', tool: 'Bruk portalens driftsinnstilling; kunder kan fortsatt lese saker.', tradeoff: 'Hindrer nye feilskrivinger, men kundene kan ikke oppdatere saker midlertidig.', effects: { network: -1, service: -13, trust: -5, capacity: -5 }, feedback: 'Skrivebeskyttelsen hindret flere mulige feilskrivinger, men stoppet kundearbeid.' },
      { label: 'Slå av den feilende statusvisningen', tool: 'Bruk funksjonsbryteren; resten av kundeportalen forblir åpen.', tradeoff: 'Begrenser inngrepet, men kunder mister statusinformasjon mens årsaken er ukjent.', effects: { network: -2, service: -7, trust: -7, capacity: -6 }, feedback: 'Du begrenset feilen til statusvisningen. Kunder manglet informasjon, men resten av portalen fortsatte.' },
    ],
  },
  {
    id: 'attack-event',
    shortTitle: 'Massivt hackerangrep',
    title: 'Massivt angrep — flere tjenester rammes',
    category: 'STØRRE CYBERHENDELSE',
    severity: 'KRITISK',
    description: 'Et omfattende angrep rammer flere av Nordlys ITs systemer samtidig. Filer og tjenester er utilgjengelige, og kundene melder om driftsstans.',
    context: 'Omfanget er uklart. Du må balansere skadebegrensning, tjenestetilgjengelighet og behovet for å forstå hva som har skjedd.',
    decisionPoint: 'Flere systemer er rammet, men du vet ikke hvor angrepet startet eller om det fortsatt sprer seg. Stans spredning og bevar en trygg vei til gjenoppretting; ikke anta at en sikker reserve finnes.',
    availableResources: [
      'Brannmur og nettverkssvitsjer kan isolere berørte nettverkssegmenter.',
      'Identitetskonsollen kan sperre kontoer og aktive økter.',
      'Nattlige sikkerhetskopier finnes, men er tilgjengelige fra vanlig adminmiljø og må kontrolleres før bruk.',
      'Ingen reserve-serverpark eller separat rent driftsmiljø er tilgjengelig.',
      'Hendelseslogg, leverandørkontakt og Nordlys ITs statusside er tilgjengelig.',
    ],
    mitigatedBy: [
      { measureId: 'identity-mfa', reason: 'Flerfaktorautentisering og begrensede adminrettigheter reduserer muligheten for å bruke overtatte kontoer.' },
      { measureId: 'recovery-isolated', reason: 'En separat, beskyttet sikkerhetskopi gir et tryggere utgangspunkt for gjenoppretting.' },
    ],
    exposureTags: ['identity', 'recovery', 'data', 'network', 'availability', 'change'],
    escalations: [
      { message: 'Flere tjenester blir ustabile. Hendelsesbildet er fremdeles ufullstendig.', effects: { network: -7, service: -6, trust: -4, capacity: -5 } },
      { message: 'Kundepåvirkningen øker, og vaktlaget nærmer seg kapasitetsgrensen.', effects: { network: -10, service: -11, trust: -8, capacity: -8 } },
    ],
    choices: [
      { label: 'Isoler berørte nettverk og sperr mistenkte adminøkter', tool: 'Bruk brannmur/svitsjer og identitetskonsollen; behold logger.', tradeoff: 'Begrenser mulig spredning og beskytter bevis, men isolerte tjenester blir utilgjengelige.', effects: { network: -10, service: -12, trust: -5, capacity: -12 }, feedback: 'Du begrenset forbindelsene til berørte systemer og stanset mistenkte økter. Isolerte tjenester var utilgjengelige mens omfanget ble undersøkt.' },
      { label: 'Steng all ekstern tilgang midlertidig', tool: 'Blokker innkommende trafikk i brannmuren og bruk statussiden.', tradeoff: 'Gir en tydelig avgrensning, men stanser også legitime kundetjenester.', effects: { network: -18, service: -22, trust: -5, capacity: -7 }, feedback: 'Bred nedstenging reduserte ekstern tilgang, men stanset også kunder som ikke var direkte berørt.' },
      { label: 'Start gjenoppretting fra siste nattkopi', tool: 'Bruk backupkonsollen; kopien er ikke isolert og er ikke kontrollert for skade.', tradeoff: 'Kan hente tilbake data, men gjenoppretting før du har kontrollert kopien kan føre problemet tilbake.', effects: { network: -12, service: -8, trust: -10, capacity: -16 }, feedback: 'Gjenoppretting startet før kopien var verifisert. Tjenester kom raskere tilbake, men du tok en risiko for å gjeninnføre skade.' },
    ],
  },
  {
    id: 'privacy-event',
    shortTitle: 'Kundeopplysninger delt feil',
    title: 'Kunde ser opplysninger som ikke tilhører dem',
    category: 'PERSONVERN / KUNDEDATA',
    severity: 'ALVORLIG',
    description: 'En kunde melder at hun kan se opplysninger knyttet til en annen kunde. Supportsystemet kan vise data på tvers av saker.',
    context: 'Det er ikke kjent hvor mange kunder som kan være berørt, eller hvor lenge feilen har vært der.',
    decisionPoint: 'Mulig eksponering pågår, men omfanget er ukjent. Stans videre innsyn først, samtidig som du bevarer logger som kan vise hvilke kunder som er berørt.',
    availableResources: [
      'Rolle- og tilgangskonsoll for supportsystemet.',
      'Logger over åpning og deling av kundesaker.',
      'Kundeportalen kan settes midlertidig utilgjengelig.',
      'Ingen fullstendig liste over berørte kunder er klar.',
    ],
    mitigatedBy: [
      { measureId: 'privacy-access', reason: 'Begrensede datatilganger reduserer hvor mange ansatte og roller som kan se kundesaker.' },
      { measureId: 'privacy-review', reason: 'To-personers kontroll gjør det mindre sannsynlig at en feil deling blir stående uten å bli oppdaget.' },
    ],
    exposureTags: ['privacy', 'data', 'access', 'change'],
    escalations: [
      { message: 'En ny kunde melder om lignende visning. Omfanget er uklart.', effects: { network: 0, service: -4, trust: -7, capacity: -3 } },
      { message: 'Flere rapporter kommer inn, og kundetilliten faller.', effects: { network: 0, service: -5, trust: -10, capacity: -4 } },
    ],
    choices: [
      { label: 'Steng deling av saker på tvers av kunder', tool: 'Fjern krysskundetilgang i supportsystemet og bevar logger over tidligere innsyn.', tradeoff: 'Stanser videre innsyn gjennom den aktuelle funksjonen, men support mister tilgang på tvers mens rollene kontrolleres.', effects: { network: -1, service: -6, trust: -4, capacity: -8 }, feedback: 'Deling på tvers av kunder ble stanset, og loggene ble beholdt for å undersøke tidligere innsyn.' },
      { label: 'Steng kundevisningen mens du undersøker', tool: 'Bruk portalens driftsinnstilling; varsle kundene på statussiden.', tradeoff: 'Stanser videre kundetilgang bredt, men alle kunder mister visning av sakene sine.', effects: { network: -2, service: -18, trust: -7, capacity: -4 }, feedback: 'Stengingen hindret videre innsyn gjennom portalen, men rammet også kunder som ikke var berørt.' },
      { label: 'Skjul bare den rapporterte saken', tool: 'Bruk supportsystemet til å skjule én sak mens du leser loggene.', tradeoff: 'Lite tjenestekutt, men andre saker kan fortsatt være synlige hvis feilen er bredere.', effects: { network: -1, service: -4, trust: -12, capacity: -5 }, feedback: 'Den rapporterte saken ble skjult, men du hadde ikke avklart om andre kunder var utsatt for samme feil.' },
    ],
  },
  {
    id: 'workload-event',
    shortTitle: 'Vaktlaget får flere alarmer enn det rekker',
    title: 'Hendelseskøen vokser raskere enn vaktlaget',
    category: 'MENNESKER / DRIFTSKAPASITET',
    severity: 'MODERAT',
    description: 'Flere kunder melder om små feil samtidig som overvåkingen sender gjentatte varsler. Noen varsler kom etter en portaloppdatering, og leverandørens statusside svarer tregt.',
    context: 'Vaktlaget er redusert i dag. Det er uklart om varslene skyldes utrullingen, leverandøren eller separate feil; ubehandlede alarmer kan skjule et større problem.',
    decisionPoint: 'Du er alene på vakt og varslene kan være duplikater eller flere separate feil. Finn en måte å oppdage alvorlige problemer først uten å slå av varsler som kan være viktige.',
    availableResources: [
      'Varselkø med tidsstempel, tjeneste og alvorlighetsgrad.',
      'Overvåkingsregler kan dempe gjentatte varsler uten å slå av alle alarmer.',
      'Utrullingsloggen for portaloppdateringen og kontaktpunktet til leverandøren.',
      'Nordlys ITs statusside kan brukes til å informere kundene.',
      'Ingen ekstra tekniker eller innleid hjelp er tilgjengelig i denne vakten.',
    ],
    mitigatedBy: [
      { measureId: 'supplier-runbook', reason: 'En kontakt- og eskaleringsplan hjelper deg å sortere bort saker som venter på leverandøren.' },
      { measureId: 'change-review', reason: 'Dokumenterte endringer og kollegakontroll gjør det lettere å knytte varsler til nylige utrullinger.' },
    ],
    exposureTags: ['human', 'availability', 'vendor', 'change', 'privacy'],
    escalations: [
      { message: 'Nye varsler kommer raskere enn de kan vurderes.', effects: { network: -1, service: -4, trust: -3, capacity: -7 } },
      { message: 'Vaktlaget må velge hvilke varsler som skal undersøkes først.', effects: { network: -3, service: -7, trust: -5, capacity: -10 } },
    ],
    choices: [
      { label: 'Behandle varsler med størst kundepåvirkning først', tool: 'Sorter køen etter alvorlighetsgrad og antall berørte kunder.', tradeoff: 'Kritiske feil blir undersøkt raskere, mens små saker blir liggende.', effects: { network: -2, service: -5, trust: -4, capacity: -8 }, feedback: 'Du undersøkte de mest alvorlige kundefeilene først. Mindre saker ble liggende til køen var lavere.' },
      { label: 'Koble sammen varsler før du starter flere undersøkelser', tool: 'Sammenlign tidsstempel og tjeneste i varselkøen; noter én arbeidshypotese.', tradeoff: 'Gir bedre oversikt og skåner vaktlaget, men enkelte saker venter mens du grupperer dem.', effects: { network: -3, service: -8, trust: -4, capacity: 2 }, feedback: 'Du samlet sannsynlige duplikater og frigjorde kapasitet, men noen kundesaker ventet lenger.' },
      { label: 'Demp bare bekreftede duplikatvarsler', tool: 'Juster overvåkingsregelen for gjentatte varsler; behold kritiske terskler.', tradeoff: 'Reduserer støy uten å slå av kritiske varsler, men du kan overse en separat feil hvis grupperingen er feil.', effects: { network: -6, service: -4, trust: -6, capacity: -2 }, feedback: 'Varselstøyen falt mens kritiske terskler var aktive. Du må fortsatt kontrollere at separate feil ikke ble gruppert sammen.' },
    ],
  },
]
