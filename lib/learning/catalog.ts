/** Publication allowlist only: educational text and approved external links. */
export const levels = ['Beginner', 'Intermediate'] as const;
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

/** Handpicked, approved public display labels; parent-child branches preserved. No original paths/IDs. */
export type PublicFolder =
  | { label: string; children: readonly PublicFolder[] }
  | { label: string; topic: LearningTopic['id']; linkLabel: string };
export const publicFolderTree: readonly PublicFolder[] = [
  { label: 'Canadian Building Code Loads', topic: 'analysis', linkLabel: 'Design loads and combinations' },
  { label: 'Steel Deck and Diaphragms', children: [
    { label: 'Canam', topic: 'steel', linkLabel: 'Deck design and detailing' },
  ] },
  { label: 'Civil Engineering', children: [
    { label: 'Concrete Design', topic: 'concrete', linkLabel: 'Concrete detailing and support conditions' },
  ] },
  { label: 'Revit', children: [
    { label: 'Robot to Revit', topic: 'bim', linkLabel: 'Analytical model exchange' },
  ] },
] as const;

export function filterLearningTopics(query: string, level: Level | '') {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  return learningTopics.filter((topic) => {
    if (level && topic.level !== level) return false;
    const searchable = [
      topic.title,
      topic.summary,
      topic.level,
      ...topic.keywords,
      ...topic.subtopics,
      ...topic.references.map(({ title }) => title),
    ].join(' ').toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}
