/** Publication allowlist only: educational text and approved external links. */
export const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;
export type Level = (typeof levels)[number];
export type LearningTopic = {
  id: 'analysis' | 'steel' | 'concrete' | 'bim';
  title: string;
  level: Level;
  summary: string;
  keywords: readonly string[];
  subtopics: readonly string[];
  references: readonly { title: string; url: string }[];
};

export const learningTopics: readonly LearningTopic[] = [
  {
    id: 'analysis', title: 'Structural Analysis and Design Loads', level: 'Beginner',
    summary: 'Trace a load path, check model reactions and record which code edition governs the combinations.',
    keywords: ['ETABS', 'NBCC', 'wind', 'seismic', 'load cases', 'load combinations', 'SAP2000'],
    subtopics: ['Load cases and combinations', 'Model idealization and verification', 'Dynamic response and serviceability'],
    references: [
      { title: 'CSI ETABS documentation', url: 'https://docs.csiamerica.com/help-files/etabs/Introduction/Welcome_to_ETABS.htm' },
      { title: 'National Building Code of Canada 2025 (NRC)', url: 'https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6' },
    ],
  },
  {
    id: 'steel', title: 'Steel Design and Connections', level: 'Intermediate',
    summary: 'Follow the load from deck to support. Distinguish span and deflection checks from in-plane diaphragm load transfer.',
    keywords: ['steel', 'deck', 'joists', 'welding', 'bolts', 'diaphragm', 'CISC', 'IDEA StatiCa'],
    subtopics: ['Member behavior and limit states', 'Connections, detailing and fabrication', 'Steel deck and diaphragm systems'],
    references: [
      { title: 'CISC technical resources', url: 'https://www.cisc-icca.ca/technical-resources/' },
      { title: 'Canam steel deck technical guide (PDF)', url: 'https://www.canam.com/wp-content/uploads/2024/12/steel-deck-canada-canam-2.pdf' },
    ],
  },
  {
    id: 'concrete', title: 'Concrete, Masonry and Anchors', level: 'Intermediate',
    summary: 'Compare slab support conditions and identify which substrate, loads and installation assumptions govern an anchorage detail.',
    keywords: ['Hilti', 'masonry', 'concrete', 'reinforcement', 'anchors', 'slab', 'foundations'],
    subtopics: ['Slabs, foundations and reinforcement', 'Masonry and joint detailing', 'Fastening, embedment and load transfer'],
    references: [
      { title: 'Hilti specifications and CAD details', url: 'https://www.hilti.ca/content/hilti/W1/CA/en/business/business/engineering/specifications-and-cad-details.html' },
    ],
  },
  {
    id: 'bim', title: 'Structural BIM and Model Exchange', level: 'Intermediate',
    summary: 'Compare connectivity, axes, releases and loads before relying on a structural model transferred between applications.',
    keywords: ['Revit', 'Dynamo', 'Robot', 'Advance Steel', 'BIM', 'SAP2000', 'IFC', 'model exchange'],
    subtopics: ['Analytical and physical models', 'Model exchange and interoperability', 'Drawings, schedules and coordination'],
    references: [
      { title: 'Autodesk structural modeling resources', url: 'https://www.autodesk.com/learn/ondemand/collection/building-structural-engineering' },
      { title: 'Dynamo Primer', url: 'https://primer2.dynamobim.org/' },
    ],
  },
] as const;

export type LearningResource = Pick<LearningTopic, 'title' | 'level' | 'summary' | 'keywords' | 'references'> & {
  id: string;
};

export const learningResources: Record<LearningTopic['id'], readonly LearningResource[]> = {
  analysis: [
    {
      id: "load-combinations",
      title: "Load Cases and Combinations",
      level: "Beginner",
      summary: "Use an introductory loading example to separate the actions on a structure from the combinations used to check it. Record the model-code edition and jurisdiction before comparing an older handout with current provisions.",
      keywords: ["NBCC","load cases","gravity loads","load combinations"],
      references: [
        { title: "National Building Code of Canada 2025 (NRC)", url: "https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6" },
      ],
    },
    {
      id: "wind-load-path",
      title: "Wind Loads and Lateral Load Paths",
      level: "Intermediate",
      summary: "Sketch the transfer of wind forces from the building envelope to diaphragms and vertical resisting elements. Compare the assumptions behind a US wind example with the design basis selected for a Canadian example.",
      keywords: ["wind loads","lateral design","ASCE 7","NBCC"],
      references: [
        { title: "ASCE 7 design loads", url: "https://www.asce.org/publications-and-news/asce-7" },
        { title: "National Building Code of Canada 2025 (NRC)", url: "https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6" },
      ],
    },
    {
      id: "modal-response",
      title: "Modal Response and Model Verification",
      level: "Advanced",
      summary: "Use a structural model to review mass and restraint assumptions before interpreting modal or response-spectrum results. Check reactions and mode shapes for consistency with the intended structural behavior.",
      keywords: ["ETABS","SAP2000","modal analysis","response spectrum","boundary conditions"],
      references: [
        { title: "CSI Analysis Reference Manual", url: "https://web.wiki.csiamerica.com/wiki/spaces/doc/pages/1245505" },
      ],
    },
  ],
  steel: [
    {
      id: "steel-member-checks",
      title: "Steel Member Stability and Section Properties",
      level: "Intermediate",
      summary: "Read the section properties and restraint assumptions together when reviewing member behavior. Separate the member resistance check from serviceability and confirm the edition used for the example.",
      keywords: ["CISC","steel sections","buckling","torsion","serviceability"],
      references: [
        { title: "CISC technical resources", url: "https://www.cisc-icca.ca/technical-resources/" },
      ],
    },
    {
      id: "steel-deck-span",
      title: "Steel Deck Span and Deflection",
      level: "Intermediate",
      summary: "Use deck calculation examples to identify span, support and reinforcement assumptions. Trace which checks relate to construction loading and which relate to the completed assembly.",
      keywords: ["steel deck","joists","reinforcement","deflection","Canam"],
      references: [
        { title: "Steel Deck Institute standards", url: "https://sdi.org/codes-standards/sdi-standards/" },
      ],
    },
    {
      id: "composite-diaphragm",
      title: "Composite Deck Diaphragms and Fasteners",
      level: "Advanced",
      summary: "Trace in-plane forces through the deck and attachments to the vertical lateral system. Use the NIST worked example to identify which assumptions depend on its historical code editions.",
      keywords: ["diaphragm","steel deck","welding","fasteners","seismic load path"],
      references: [
        { title: "NIST composite diaphragm design guide", url: "https://nvlpubs.nist.gov/nistpubs/gcr/2010/NIST.GCR.10-917-4.pdf" },
        { title: "Steel Deck Institute standards", url: "https://sdi.org/codes-standards/sdi-standards/" },
      ],
    },
  ],
  concrete: [
    {
      id: "reinforcement-detailing",
      title: "Reinforcement Detailing and Crack Control",
      level: "Intermediate",
      summary: "Read reinforcement details alongside the load path and serviceability assumptions. Identify where crack control, torsion and bar continuity shape the questions a reviewer should ask.",
      keywords: ["reinforced concrete","crack control","torsion","ACI 318","reinforcement"],
      references: [
        { title: "National Building Code of Canada 2025 (NRC)", url: "https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6" },
      ],
    },
    {
      id: "slabs-on-ground",
      title: "Slabs on Ground and Joint Layout",
      level: "Intermediate",
      summary: "Review how the ground support, application loads, reinforcement and joints relate to slab behavior. Use floor inspection references to distinguish measured flatness from a structural design check.",
      keywords: ["slab-on-ground","joints","floor flatness","ACI 360","reinforcement"],
      references: [
        { title: "ACI Committee 360 — slabs on ground", url: "https://www.concrete.org/getinvolved/committees/directoryofcommittees/acommitteehome.aspx?committee_code=C0036000" },
      ],
    },
    {
      id: "anchor-selection",
      title: "Post-Installed Anchor Selection",
      level: "Intermediate",
      summary: "Compare anchor requirements for concrete and masonry. Check whether the publisher data covers the substrate, installation conditions and load case before applying it to a new detail.",
      keywords: ["Hilti","adhesive anchors","concrete breakout","masonry anchors","PROFIS"],
      references: [
        { title: "Hilti specifications and CAD details", url: "https://www.hilti.ca/content/hilti/W1/CA/en/business/business/engineering/specifications-and-cad-details.html" },
      ],
    },
  ],
  bim: [
    {
      id: "revit-robot-exchange",
      title: "Revit to Robot Analytical Model Exchange",
      level: "Intermediate",
      summary: "Compare a small frame on both sides of a transfer. Verify analytical alignment, connectivity, releases, boundary conditions, units and load assignments before comparing results.",
      keywords: ["Revit","Robot Structural Analysis","model exchange","analytical model","releases"],
      references: [
        { title: "Autodesk Revit and Robot model exchange paper", url: "https://damassets.autodesk.net/content/dam/autodesk/www/pdfs/linking-autodesk-revit-and-robot-structural-analysis-professional.pdf" },
        { title: "Autodesk structural modeling, detailing and analysis", url: "https://www.autodesk.com/learn/ondemand/collection/building-structural-engineering" },
      ],
    },
    {
      id: "dynamo-analysis",
      title: "Dynamo for Repeatable Analysis Tasks",
      level: "Advanced",
      summary: "Use a small Dynamo graph to transfer or check analytical model data. Track which nodes depend on the software release and compare object counts and load cases with a baseline.",
      keywords: ["Dynamo","Revit","Robot","visual programming","Python"],
      references: [
        { title: "Dynamo Primer", url: "https://primer2.dynamobim.org/" },
        { title: "Autodesk structural modeling, detailing and analysis", url: "https://www.autodesk.com/learn/ondemand/collection/building-structural-engineering" },
      ],
    },
    {
      id: "advance-steel-detailing",
      title: "Advance Steel Detailing and Drawing Handoffs",
      level: "Intermediate",
      summary: "Follow a steel model from coordinated geometry to fabrication drawings. Compare member and connection information after exchange and confirm which drawings need an update.",
      keywords: ["Advance Steel","Revit","shop drawings","fabrication","detailing"],
      references: [
        { title: "Autodesk Advance Steel Extension for Revit", url: "https://help.autodesk.com/cloudhelp/2025/ENU/Revit-StructEng/files/GUID-C86164A0-C1B3-4F09-8C38-84C0B4A860FF.htm" },
      ],
    },
  ],
};

/** Selected public display labels. The destinations use public section anchors. */
export type PublicFolder =
  | { label: string; children: readonly PublicFolder[] }
  | { label: string; topic: LearningTopic['id']; resource?: string; linkLabel: string };

export const publicFolderTree: readonly PublicFolder[] = [
  { label: 'Canadian Building Code Loads', children: [
    { label: 'Load Combinations', topic: 'analysis', resource: 'load-combinations', linkLabel: 'Load cases and combinations' },
    { label: 'Wind Loading', topic: 'analysis', resource: 'wind-load-path', linkLabel: 'Wind loads and lateral load paths' },
  ] },
  { label: 'Structural Analysis Models', topic: 'analysis', resource: 'modal-response', linkLabel: 'Modal response and model verification' },
  { label: 'Canadian Steel Construction', topic: 'steel', resource: 'steel-member-checks', linkLabel: 'Steel member stability and section properties' },
  { label: 'Steel Deck and Diaphragms', children: [
    { label: 'Canam', topic: 'steel', resource: 'steel-deck-span', linkLabel: 'Steel deck span and deflection' },
    { label: 'Diaphragm Fasteners', topic: 'steel', resource: 'composite-diaphragm', linkLabel: 'Composite deck diaphragms and fasteners' },
  ] },
  { label: 'Civil Engineering', children: [
    { label: 'Concrete Design', topic: 'concrete', resource: 'reinforcement-detailing', linkLabel: 'Reinforcement detailing and crack control' },
  ] },
  { label: 'Concrete Slabs', topic: 'concrete', resource: 'slabs-on-ground', linkLabel: 'Slabs on ground and joint layout' },
  { label: 'Hilti Concrete Anchors', topic: 'concrete', resource: 'anchor-selection', linkLabel: 'Post-installed anchor selection' },
  { label: 'Revit', children: [
    { label: 'Robot to Revit', topic: 'bim', resource: 'revit-robot-exchange', linkLabel: 'Revit to Robot analytical model exchange' },
  ] },
  { label: 'Dynamo', topic: 'bim', resource: 'dynamo-analysis', linkLabel: 'Dynamo for repeatable analysis tasks' },
  { label: 'Advance Steel', topic: 'bim', resource: 'advance-steel-detailing', linkLabel: 'Advance Steel detailing and drawing handoffs' },
];

function matches(entry: LearningResource, terms: readonly string[], extra: readonly string[] = []) {
  const searchable = [
    entry.title, entry.summary, entry.level, ...entry.keywords, ...extra,
    ...entry.references.map(({ title }) => title),
  ].join(' ').toLowerCase();

  return terms.every((term) => searchable.includes(term));
}

export function filterLearningTopics(query: string, level: Level | '') {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  return learningTopics.flatMap((topic) => {
    const overviewMatches = (!level || topic.level === level) && matches(topic, terms, topic.subtopics);
    const resources = learningResources[topic.id].filter((resource) =>
      (!level || resource.level === level) &&
      (overviewMatches || matches(resource, terms, [topic.title])),
    );
    return overviewMatches || resources.length ? [{ ...topic, resources }] : [];
  });
}
