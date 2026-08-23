export type Treatment = {
  number: string;
  name: string;
  short: string;
  duration: string;
  price: string;
  detail: string;
};

const treatmentsFr: Treatment[] = [
  {
    number: "01",
    name: "Contrôle annuel",
    short: "Examen complet des dents et des gencives, dépistage des caries, radiographie si nécessaire.",
    duration: "30 min",
    price: "30 - 45 €",
    detail: "Une fois par an, c’est le rendez-vous qui rend tous les autres plus courts. Nous vérifions chaque dent, l’état des gencives et les anciens soins, puis nous établissons avec vous un plan si quelque chose demande une intervention.",
  },
  {
    number: "02",
    name: "Plombage",
    short: "Nettoyage de la carie et reconstruction de la dent en composite de la teinte de votre émail.",
    duration: "45 min",
    price: "45 - 95 €",
    detail: "La carie est retirée, puis la dent reconstruite couche par couche en composite. Le résultat est invisible et la dent retrouve sa forme et sa force le jour même.",
  },
  {
    number: "03",
    name: "Détartrage & surfaçage",
    short: "Élimination du tartre au-dessus et sous la gencive pour arrêter le saignement et le déchaussement.",
    duration: "45 min",
    price: "40 - 120 €",
    detail: "Un nettoyage précis, au-dessus et sous la gencive, pour retrouver une bouche saine et prévenir la perte dentaire.",
  },
  { number: "04", name: "Traitement de canal", short: "Traitement du nerf infecté pour conserver une dent qui, sinon, devrait être extraite.", duration: "60 min", price: "140 - 400 €", detail: "Nous retirons le tissu infecté, désinfectons les canaux et refermons la dent afin de la conserver durablement." },
  { number: "05", name: "Extraction", short: "Retrait d’une dent trop abîmée ou d’une dent de sagesse, sous anesthésie locale.", duration: "45 min", price: "60 - 180 €", detail: "Une extraction est une décision prise ensemble, jamais par défaut. Nous vous expliquons ce qui la remplacera avant même de commencer." },
  { number: "06", name: "Prothèse dentaire", short: "Prothèse partielle ou complète, amovible, réalisée sur mesure en plusieurs séances.", duration: "60 min", price: "600 - 1 800 €", detail: "Conception, essayages et réglages sont réalisés au cabinet pour retrouver une mastication stable et naturelle." },
  { number: "07", name: "Couronne & facette", short: "Couronne céramique pour reconstruire une dent, facette pour en corriger la forme ou la teinte.", duration: "60 min", price: "500 - 950 €", detail: "Nous préparons, scannons et ajustons chaque restauration pour qu’elle se fonde naturellement dans votre sourire." },
  { number: "08", name: "Implant", short: "Racine en titane posée dans l’os, puis couronne fixe : la solution la plus proche d’une vraie dent.", duration: "60 min", price: "1 200 - 2 200 €", detail: "Chaque étape est planifiée à partir de l’imagerie du cabinet, de la pose à la couronne définitive." },
  { number: "09", name: "Pédodontie", short: "Soins des enfants dès la première dent, dans un rendez-vous pensé pour leur rythme.", duration: "30 min", price: "0 € (< 18 ans)", detail: "Le premier rendez-vous sert surtout à s’apprivoiser : monter sur le fauteuil, compter les dents, repartir content. Pour les moins de 18 ans, l’essentiel des soins est remboursé." },
];

const treatmentsNl: Treatment[] = [
  {
    number: "01",
    name: "Jaarlijkse controle",
    short: "Volledig onderzoek van tanden en tandvlees, opsporing van gaatjes en indien nodig een röntgenfoto.",
    duration: "30 min",
    price: "30 - 45 €",
    detail: "Eén keer per jaar maakt deze afspraak alle volgende korter. We controleren elke tand, het tandvlees en vroegere behandelingen en stellen samen een plan op als er iets moet gebeuren.",
  },
  {
    number: "02",
    name: "Vulling",
    short: "Verwijdering van het gaatje en herstel van de tand met composiet in de kleur van uw glazuur.",
    duration: "45 min",
    price: "45 - 95 €",
    detail: "We verwijderen het aangetaste weefsel en bouwen de tand laag voor laag opnieuw op met composiet. Het resultaat is onopvallend en de tand is dezelfde dag weer sterk.",
  },
  {
    number: "03",
    name: "Tandsteenverwijdering & wortelreiniging",
    short: "Verwijdering van tandsteen boven en onder het tandvlees om bloeding en terugtrekking te stoppen.",
    duration: "45 min",
    price: "40 - 120 €",
    detail: "Een nauwkeurige reiniging boven en onder het tandvlees voor een gezonde mond en om tandverlies te voorkomen.",
  },
  { number: "04", name: "Wortelkanaalbehandeling", short: "Behandeling van een geïnfecteerde zenuw om een tand te behouden die anders getrokken moet worden.", duration: "60 min", price: "140 - 400 €", detail: "We verwijderen het geïnfecteerde weefsel, ontsmetten de kanalen en sluiten de tand om hem duurzaam te behouden." },
  { number: "05", name: "Extractie", short: "Verwijdering van een zwaar beschadigde tand of verstandskies onder plaatselijke verdoving.", duration: "45 min", price: "60 - 180 €", detail: "Een extractie is altijd een gezamenlijke beslissing. Voor we beginnen, leggen we uit welke vervanging mogelijk is." },
  { number: "06", name: "Tandprothese", short: "Een gedeeltelijke of volledige uitneembare prothese, op maat gemaakt in meerdere afspraken.", duration: "60 min", price: "600 - 1 800 €", detail: "Ontwerp, pasbeurten en afstelling gebeuren in de praktijk voor stabiel en natuurlijk kauwcomfort." },
  { number: "07", name: "Kroon & facet", short: "Een keramische kroon herstelt een tand; een facet corrigeert vorm of kleur.", duration: "60 min", price: "500 - 950 €", detail: "We bereiden, scannen en passen elke restauratie aan zodat ze natuurlijk opgaat in uw glimlach." },
  { number: "08", name: "Implantaat", short: "Een titanium wortel in het bot met een vaste kroon: de oplossing die het dichtst bij een echte tand komt.", duration: "60 min", price: "1 200 - 2 200 €", detail: "Elke stap wordt gepland met beeldvorming in de praktijk, van plaatsing tot de definitieve kroon." },
  { number: "09", name: "Kindertandheelkunde", short: "Zorg vanaf de eerste tand, tijdens een afspraak die volledig op het ritme van kinderen is afgestemd.", duration: "30 min", price: "0 € (< 18 jaar)", detail: "De eerste afspraak draait vooral om wennen: in de stoel zitten, tanden tellen en tevreden naar huis gaan. Voor jongeren onder 18 jaar wordt de belangrijkste zorg terugbetaald." },
];

export const treatmentsByLanguage = { fr: treatmentsFr, nl: treatmentsNl } as const;

export const hoursByLanguage = {
  fr: [
    ["Lun", "08:30–18:00"], ["Mar", "08:30–18:00"], ["Mer", "08:30–18:00"],
    ["Jeu", "08:30–18:00"], ["Ven", "08:30–17:00"], ["Sam", "09:00–13:00"], ["Dim", "Fermé"],
  ],
  nl: [
    ["Ma", "08:30–18:00"], ["Di", "08:30–18:00"], ["Wo", "08:30–18:00"],
    ["Do", "08:30–18:00"], ["Vr", "08:30–17:00"], ["Za", "09:00–13:00"], ["Zo", "Gesloten"],
  ],
} as const;
