type Guide = {
  title: string;
  description: string;
  level: string;
  keywords: readonly string[];
  intro: string;
  principleTitle: string;
  steps: readonly string[];
  exampleTitle: string;
  example: string;
  check: string;
  references: readonly (readonly [title: string, url: string, readingNote: string])[];
  diagram: readonly string[];
};

export const guides: Readonly<Record<string, Guide>> = {
  "load-combinations": {
    "title": "Canadian Structural Design Loads and Load Combinations",
    "description": "Learn to define structural load cases, convert an area load to a beam line load, and document the adopted Canadian code basis for design combinations.",
    "level": "Beginner",
    "keywords": [
      "Canadian structural design loads",
      "load cases and combinations",
      "tributary width",
      "beam reactions"
    ],
    "intro": "Build a load register before entering combinations in an analysis program. Write down what each load represents, its units, its direction and which parts of the structure receive it.",
    "principleTitle": "Structural Load Cases and Load Paths",
    "steps": [
      "Separate loads by action so that permanent loads, occupancies and environmental loads can be combined with their own factors and accompanying terms.",
      "Trace each area load through the slab or deck to its supporting member. Confirm tributary width before converting kPa to kN/m.",
      "Record the adopted code edition, local amendments, limit state and combination assumptions beside the model cases."
    ],
    "exampleTitle": "Worked Example for a Simply Supported Beam",
    "example": "Use a hypothetical permanent area load of 1.5 kPa and a separate imposed area load of 2.0 kPa. A 3 m tributary width gives independent line loads of 4.5 kN/m and 6.0 kN/m. For a 6 m simply supported beam under uniform load, each end receives 13.5 kN from the permanent case and 18.0 kN from the imposed case. Add any separate beam self-weight to the permanent case. Select combination factors from the adopted provisions for the project and the limit state being checked.",
    "check": "Compare each pair of model reactions with the total load from its own case before checking combined results. Confirm the code edition and jurisdiction when adapting an archived classroom example.",
    "references": [
      [
        "National Building Code of Canada 2020, Division B Part 4",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Use the structural design provisions to locate the load and load-combination sections."
      ],
      [
        "NRC National Building Code of Canada 2025 publication record",
        "https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6",
        "Compare editions and confirm which one applies in the project jurisdiction."
      ]
    ],
    "diagram": [
      "Area load",
      "Tributary strip",
      "Beam",
      "Support reactions"
    ]
  },
  "steel-deck-span": {
    "title": "Steel Deck Span, Deflection and Diaphragm Design",
    "description": "Follow a worked steel deck load example and distinguish gravity span and deflection checks from diaphragm shear transfer through deck and fasteners.",
    "level": "Intermediate",
    "keywords": [
      "steel deck span",
      "steel deck load tables",
      "deck deflection",
      "composite diaphragm"
    ],
    "intro": "A steel deck profile can serve different structural functions at different stages. Record the span and loading condition for each gravity check and draw the in-plane load path separately.",
    "principleTitle": "Reading Steel Deck Span and Load Information",
    "steps": [
      "Match the actual deck profile, thickness, span configuration and support conditions to the manufacturer’s data.",
      "Identify whether the check is for construction-stage deck or the completed assembly. Record temporary loads and shoring assumptions separately.",
      "For diaphragm action, trace force from the deck and attachments into collectors and vertical resisting elements."
    ],
    "exampleTitle": "Worked Example for a One-Metre Deck Strip",
    "example": "For a hypothetical 1 m strip over a 3 m simple span with a uniform vertical load of 2.4 kPa, the line load is 2.4 kN/m. Each support receives 3.6 kN per metre of deck width, and the idealized maximum bending moment is 2.7 kN·m per metre. Use these values to check the model inputs and reactions. The relevant product table depends on the stage, spans, connection condition and stated rating basis.",
    "check": "Review gravity deflection for the appropriate stage. Check diaphragm shear transfer and attachments using the separate lateral load path and the provisions applicable to the project.",
    "references": [
      [
        "Canam steel deck product and design resources",
        "https://www.canam.com/en/product/steel-deck/",
        "Locate the relevant deck profile and its technical documents."
      ],
      [
        "NIST guide to composite steel deck and concrete-filled diaphragms",
        "https://nvlpubs.nist.gov/nistpubs/gcr/2010/NIST.GCR.10-917-4.pdf",
        "Review how an example traces in-plane forces through the diaphragm and its connections."
      ]
    ],
    "diagram": [
      "Gravity load",
      "Deck strip",
      "Supporting members",
      "Vertical reactions"
    ]
  },
  "reinforcement-detailing": {
    "title": "Concrete Reinforcement Detailing and Crack Control",
    "description": "Learn to review concrete reinforcement spacing, placement and continuity with a worked drawing check and a reference to Canadian structural provisions.",
    "level": "Intermediate",
    "keywords": [
      "concrete reinforcement detailing",
      "rebar spacing",
      "crack control",
      "reinforcement drawing review"
    ],
    "intro": "Review a reinforcement drawing alongside the structural model. Bar position, direction and continuity help an engineer determine whether the detail matches the behavior assumed in design.",
    "principleTitle": "Reading Concrete Reinforcement Details",
    "steps": [
      "Identify the member, support and section before interpreting the bar callouts.",
      "Follow each bar set across plans and sections and identify where cover, development and anchorage need engineering checks.",
      "Record which bar sets are associated with flexure, distributing reinforcement or serviceability checks in the design."
    ],
    "exampleTitle": "Worked Drawing Review for Bar Spacing",
    "example": "A hypothetical detail shows seven equally spaced bar centerlines at 150 mm. There are six intervals, so the distance from the first to the last centerline is 900 mm. Compare that dimension with the section and check how the end centerlines relate to faces, cover and the bar diameter. Treat spacing, clearance and crack control as separate checks with their own design inputs.",
    "check": "On a marked-up drawing, identify the bar set, direction, start and end location, and any unresolved continuity question. Confirm the required design standard and edition before judging capacity or crack control.",
    "references": [
      [
        "National Building Code of Canada 2020, Division B Part 4",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Locate the structural concrete provisions and the referenced design standard for that model-code edition."
      ]
    ],
    "diagram": [
      "Bar callout",
      "Plan centerlines",
      "Section and cover",
      "Drawing check"
    ]
  },
  "revit-robot-exchange": {
    "title": "Revit to Robot Structural Analysis Model Exchange",
    "description": "Verify Revit-to-Robot analytical model exchange with a simple beam example covering geometry, supports, releases, load assignments and reactions.",
    "level": "Intermediate",
    "keywords": [
      "Revit Robot model exchange",
      "analytical model verification",
      "structural BIM interoperability",
      "support reactions"
    ],
    "intro": "Use a baseline model before transferring a production structure. Give the receiving model its own verification record, including the software release and the link used.",
    "principleTitle": "Analytical Model Transfer Checks",
    "steps": [
      "Record member axes, node connectivity, units and support restraints in the baseline.",
      "Compare geometry, local axes, releases and load-case assignments after transfer.",
      "Check the deformed shape and reactions, then record any changes made by the receiving application."
    ],
    "exampleTitle": "Worked Verification for a Single Beam",
    "example": "Create a 4 m beam with simple supports and an 8 kN downward point load at midspan. With self-weight excluded for this check, each support should carry 4 kN vertically. Compare this manual result with the receiving model. If the load relocates or support restraints change, investigate the transfer before comparing stress or deflection.",
    "check": "Save the baseline and receiving model separately. Record the software versions and retain one small reproducible check for testing the workflow after updates.",
    "references": [
      [
        "Autodesk Revit and Robot model exchange paper",
        "https://damassets.autodesk.net/content/dam/autodesk/www/pdfs/linking-autodesk-revit-and-robot-structural-analysis-professional.pdf",
        "Review the analytical-model exchange concepts and identify version-specific steps."
      ],
      [
        "Autodesk structural modeling and analysis learning collection",
        "https://www.autodesk.com/learn/ondemand/collection/building-structural-engineering",
        "Find the current publisher workflow for preparing and verifying a structural analytical model."
      ]
    ],
    "diagram": [
      "Revit baseline",
      "Model transfer",
      "Robot model",
      "Reaction comparison"
    ]
  }
};
