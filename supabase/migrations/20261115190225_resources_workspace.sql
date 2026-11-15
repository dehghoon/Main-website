begin;

create table public.learning_categories (
  id text primary key default gen_random_uuid()::text,
  title text not null check (length(btrim(title)) between 1 and 100)
);
create unique index learning_categories_title_key on public.learning_categories (lower(btrim(title)));

create table public.learning_subtopics (
  id text primary key default gen_random_uuid()::text,
  category_id text not null references public.learning_categories(id),
  title text not null check (length(btrim(title)) between 1 and 150),
  unique (id, category_id)
);
create unique index learning_subtopics_title_key
  on public.learning_subtopics (category_id, lower(btrim(title)));

create table public.learning_articles (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.learning_categories(id),
  subtopic_id text not null,
  author_id uuid not null default auth.uid() references auth.users(id),
  title text not null check (length(btrim(title)) between 1 and 160),
  summary text not null check (length(btrim(summary)) between 1 and 320),
  body text not null check (length(btrim(body)) between 1 and 50000),
  keywords text[] not null default '{}' check (cardinality(keywords) <= 20),
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  published_at timestamptz,
  foreign key (subtopic_id, category_id) references public.learning_subtopics(id, category_id)
);
create index learning_articles_published_idx on public.learning_articles (published_at desc) where published_at is not null;
create index learning_articles_author_idx on public.learning_articles (author_id);
create index learning_articles_taxonomy_idx on public.learning_articles (category_id, subtopic_id);

create function public.learning_can_publish()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select auth.uid() is not null and (
    public.platform_access_is_owner()
    or 'blog.publish' = any(public.platform_my_permissions())
  );
$$;

create function public.learning_can_edit()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select auth.uid() is not null and (
    public.learning_can_publish()
    or public.platform_my_permissions() && array['blog.create', 'blog.edit', 'timesheet.view_own']
    or exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'manager'))
  );
$$;

revoke all on function public.learning_can_publish(), public.learning_can_edit() from public, anon;
grant execute on function public.learning_can_publish(), public.learning_can_edit() to authenticated;

alter table public.learning_categories enable row level security;
alter table public.learning_subtopics enable row level security;
alter table public.learning_articles enable row level security;

revoke all on public.learning_categories, public.learning_subtopics, public.learning_articles from public, anon, authenticated;
grant select (id, title) on public.learning_categories to anon, authenticated;
grant select (id, category_id, title) on public.learning_subtopics to anon, authenticated;
grant select (id, category_id, subtopic_id, title, summary, body, keywords, level, published_at)
  on public.learning_articles to anon, authenticated;
grant insert (title) on public.learning_categories to authenticated;
grant insert (category_id, title) on public.learning_subtopics to authenticated;
grant insert (category_id, subtopic_id, title, summary, body, keywords, level, published_at),
  update (category_id, subtopic_id, title, summary, body, keywords, level, published_at)
  on public.learning_articles to authenticated;

create policy learning_public_articles on public.learning_articles for select to anon, authenticated
  using (published_at is not null);
create policy learning_employee_articles on public.learning_articles for select to authenticated
  using ((select public.learning_can_publish()) or
         ((select public.learning_can_edit()) and author_id = (select auth.uid())));
create policy learning_create_articles on public.learning_articles for insert to authenticated
  with check ((select public.learning_can_edit()) and author_id = (select auth.uid()) and
              (published_at is null or (select public.learning_can_publish())));
create policy learning_update_articles on public.learning_articles for update to authenticated
  using ((select public.learning_can_publish()) or
         ((select public.learning_can_edit()) and author_id = (select auth.uid()) and published_at is null))
  with check ((select public.learning_can_publish()) or
              ((select public.learning_can_edit()) and author_id = (select auth.uid()) and published_at is null));

create policy learning_public_categories on public.learning_categories for select to anon, authenticated
  using (exists(select 1 from public.learning_articles where category_id = learning_categories.id and published_at is not null));
create policy learning_public_subtopics on public.learning_subtopics for select to anon, authenticated
  using (exists(select 1 from public.learning_articles where subtopic_id = learning_subtopics.id and published_at is not null));
create policy learning_employee_categories on public.learning_categories for select to authenticated
  using ((select public.learning_can_edit()));
create policy learning_employee_subtopics on public.learning_subtopics for select to authenticated
  using ((select public.learning_can_edit()));
create policy learning_create_categories on public.learning_categories for insert to authenticated
  with check ((select public.learning_can_edit()));
create policy learning_create_subtopics on public.learning_subtopics for insert to authenticated
  with check ((select public.learning_can_edit()));

insert into public.learning_categories (id, title) values
  ('loads', 'Design Loads & Codes'),
  ('analysis', 'Structural Analysis & Serviceability'),
  ('steel', 'Steel Design & Connections'),
  ('concrete', 'Concrete, Masonry & Foundations'),
  ('industrial', 'Industrial Structures & Equipment Supports'),
  ('envelope', 'Building Envelope & Nonstructural Components'),
  ('anchors', 'Anchors, Fasteners & Penetrations'),
  ('inspection', 'Inspection, Assessment & Repair'),
  ('civil', 'Civil & Site Engineering'),
  ('safety', 'Construction Safety & Access'),
  ('workflow', 'Software, BIM & Engineering Workflows'),
  ('wood', 'Wood Design');

insert into public.learning_subtopics (id, category_id, title) values
  ('load-combinations', 'loads', 'Canadian Building Code Loads'),
  ('solar-mounting-and-structural-loads', 'loads', 'Solar Mounting and Structural Loads'),
  ('wind-load-path', 'loads', 'Wind Loads and Lateral Load Paths'),
  ('roof-snow-loads', 'loads', 'Roof Snow Loads and Snow Drift'),
  ('building-problems', 'analysis', 'Building Problems'),
  ('underground-piping-and-civil-coordination', 'analysis', 'Underground Piping and Civil Coordination'),
  ('modal-response', 'analysis', 'Modal Response and Structural Model Verification'),
  ('floor-vibration', 'analysis', 'Floor Vibration and Serviceability'),
  ('steel-deck-and-diaphragms', 'steel', 'Steel Deck and Diaphragms'),
  ('steel-deck-span', 'steel', 'Canam Steel Deck Span and Deflection'),
  ('composite-diaphragm', 'steel', 'Composite Deck Diaphragms and Fasteners'),
  ('hilti-for-fasteners', 'steel', 'Hilti for Fasteners'),
  ('steel-member-checks', 'steel', 'W-Shape Properties and Steel Member Checks'),
  ('deck-design', 'steel', 'Residential Deck Design'),
  ('steel-design', 'steel', 'Steel Design'),
  ('steel-sheet', 'steel', 'Cold-Formed Steel Studs and Track'),
  ('cold-formed-steel-design', 'steel', 'Cold-Formed Steel Design'),
  ('industrial-grating-and-walkways', 'steel', 'Steel Bar Grating and Walkway Supports'),
  ('canam-for-technical-seminars-and-manufacturer-resources', 'steel', 'CANAM for Technical Seminars and Manufacturer Resources'),
  ('versa-dek-and-deep-dek', 'steel', 'Versa-Dek And Deep-Dek'),
  ('load-tables-lrfd', 'steel', 'Load Tables LRFD'),
  ('floor-deck', 'steel', 'Floor Deck'),
  ('deep-dek-floor-deck-load-tables', 'steel', 'Deep Dek Floor Deck Load Tables'),
  ('versa-dek-floor-deck-load-tables', 'steel', 'Versa Dek Floor Deck Load Tables'),
  ('versa-dek-acoustical-floor-deck-load-tables', 'steel', 'Versa Dek Acoustical Floor Deck Load Tables'),
  ('roof-deck', 'steel', 'Roof Deck'),
  ('deep-dek-roof-deck-load-tables', 'steel', 'Deep Dek Roof Deck Load Tables'),
  ('deep-dek-acoustical', 'steel', 'Deep Dek Acoustical'),
  ('versa-dek-roof-deck-load-tables', 'steel', 'Versa Dek Roof Deck Load Tables'),
  ('versa-dek-acoustical-roof-deck-load-tables', 'steel', 'Versa Dek Acoustical Roof Deck Load Tables'),
  ('steel-shear-plate-connections', 'steel', 'Steel Shear Plate Connections'),
  ('structural-welding-references', 'steel', 'Welding and Welded Connections'),
  ('retaining-wall', 'concrete', 'Retaining Wall Load Path and Foundation Checks'),
  ('reinforcement-couplers', 'concrete', 'Rebar Couplers and Mechanical Splices'),
  ('concrete-abrasion-resistance', 'concrete', 'Concrete Abrasion Resistance'),
  ('structural-and-concrete-joints', 'concrete', 'Structural and Concrete Joints'),
  ('technical-seminars-and-manufacturer-resources', 'concrete', 'Technical Seminars and Manufacturer Resources'),
  ('bekaert-for-technical-seminars-and-manufacturer-resources', 'concrete', 'Bekaert Fibre-Reinforced Concrete'),
  ('floor-slabs', 'concrete', 'Floor Slabs'),
  ('chance-for-technical-seminars-and-manufacturer-resources', 'concrete', 'CHANCE for Technical Seminars and Manufacturer Resources'),
  ('euclid-for-technical-seminars-and-manufacturer-resources', 'concrete', 'Euclid Concrete Materials and Repair'),
  ('fyfe-for-technical-seminars-and-manufacturer-resources', 'concrete', 'Fyfe for Technical Seminars and Manufacturer Resources'),
  ('tyco-for-fyfe', 'concrete', 'Tyco for Fyfe'),
  ('data-sheets', 'concrete', 'Data Sheets'),
  ('composite-anchors', 'concrete', 'Composite Anchors'),
  ('composites-for-data-sheets', 'concrete', 'Composites for Data Sheets'),
  ('prefabricated-laminates', 'concrete', 'Prefabricated Laminates'),
  ('epoxies-for-data-sheets', 'concrete', 'Epoxies for Data Sheets'),
  ('rebar-for-data-sheets', 'concrete', 'Reinforcement for Structural Repair'),
  ('reference-documents', 'concrete', 'Reference Documents'),
  ('design-manual', 'concrete', 'Design Manual'),
  ('fyfe-brochures', 'concrete', 'Fyfe Brochures'),
  ('msds-epoxies-mortars-chemicals', 'concrete', 'MSDS - Epoxies, Mortars & Chemicals'),
  ('msds-fabrics-laminates-misc', 'concrete', 'MSDS - Fabrics Laminates & Misc'),
  ('hard-cem-for-technical-seminars-and-manufacturer-resources', 'concrete', 'Hard-Cem for Technical Seminars and Manufacturer Resources'),
  ('engineering-for-hard-cem', 'concrete', 'Engineering for Hard-Cem'),
  ('product-information', 'concrete', 'Product Information'),
  ('profiles-for-hard-cem', 'concrete', 'Profiles for Hard-Cem'),
  ('hard-cem-safety-data-sheets', 'concrete', 'Hard-Cem Safety Data Sheets'),
  ('shotcrete-for-hard-cem', 'concrete', 'Shotcrete for Hard-Cem'),
  ('lafarge-rcc', 'concrete', 'Lafarge RCC'),
  ('maccaferri-for-technical-seminars-and-manufacturer-resources', 'concrete', 'Maccaferri for Technical Seminars and Manufacturer Resources'),
  ('maccaferri-fibres-sog', 'concrete', 'Maccaferri Fibres SOG'),
  ('sika-for-technical-seminars-and-manufacturer-resources', 'concrete', 'Sika Repair and Strengthening Resources'),
  ('sika-technical-publications', 'concrete', 'Sika Technical Publications'),
  ('masonry-structural-design', 'concrete', 'Structural Masonry Design and Detailing'),
  ('slabs-on-ground', 'concrete', 'Slabs on Ground and Joint Layout'),
  ('euclid-software', 'concrete', 'Euclid Software'),
  ('precast-concrete', 'concrete', 'Precast Concrete Connections and Erection'),
  ('prestressed-concrete', 'concrete', 'Prestressed Concrete Load Stages and Service Checks'),
  ('cable-tray-and-support-systems', 'industrial', 'Cable Support'),
  ('lighting-pole', 'industrial', 'Lighting Pole'),
  ('pipe-support-engineering', 'industrial', 'Pipe Supports and Hangers'),
  ('pipe-support-arrangement-review', 'industrial', 'Pipe Support Arrangement Review'),
  ('legacy-pipe-support-coordination', 'industrial', 'Legacy Pipe Support Coordination'),
  ('pump-support-and-equipment-loads', 'industrial', 'Pump and Equipment Supports'),
  ('crane-and-lifting-support-structures', 'industrial', 'Crane Support Structures'),
  ('uni-struct-for-technical-seminars-and-manufacturer-resources', 'industrial', 'Uni-Struct for Technical Seminars and Manufacturer Resources'),
  ('unistrut-channel-support-systems', 'industrial', 'Unistrut Channel Support Systems'),
  ('pipe-rack', 'industrial', 'Pipe Rack Structural Coordination'),
  ('ceiling-support-systems', 'envelope', 'Ceiling Support and Seismic Bracing'),
  ('headed-studs-and-shear-connectors', 'anchors', 'Headed Studs and Shear Connectors'),
  ('anchor-bolts-and-structural-screws', 'anchors', 'Anchor Bolts and Structural Screws'),
  ('notes-for-anchor-bolts-and-structural-screws', 'anchors', 'Notes for Anchor Bolts and Structural Screws'),
  ('anchor-selection', 'anchors', 'Hilti Concrete Anchors and Post-Installed Fastening'),
  ('jordahl-anchor-channels', 'anchors', 'Jordahl Anchor Channels'),
  ('fire-resistance-systems', 'anchors', 'Fire Resistance Systems'),
  ('jordahl-for-technical-seminars-and-manufacturer-resources', 'anchors', 'Jordahl for Technical Seminars and Manufacturer Resources'),
  ('simpson-for-technical-seminars-and-manufacturer-resources', 'anchors', 'Simpson for Technical Seminars and Manufacturer Resources'),
  ('simpson-anchoring-fastening-collection', 'anchors', 'Simpson Anchoring & Fastening Collection'),
  ('catalogs-for-simpson-anchoring-fastening-collection', 'anchors', 'Catalogs for Simpson Anchoring & Fastening Collection'),
  ('simpson-anchor-code-reports', 'anchors', 'Simpson Anchor Code Reports'),
  ('fliers-for-simpson-anchoring-fastening-collection', 'anchors', 'Fliers for Simpson Anchoring & Fastening Collection'),
  ('safety-data-for-simpson-anchoring-fastening-collection', 'anchors', 'Safety Data for Simpson Anchoring & Fastening Collection'),
  ('submittals-for-simpson-anchoring-fastening-collection', 'anchors', 'Submittals for Simpson Anchoring & Fastening Collection'),
  ('techbull-for-simpson-anchoring-fastening-collection', 'anchors', 'TechBull for Simpson Anchoring & Fastening Collection'),
  ('simpson-strong-tie', 'anchors', 'Simpson Strong Tie'),
  ('simpson-technical-library-for-simpson', 'anchors', 'Simpson Technical Library for Simpson'),
  ('catalogs-for-simpson-technical-library', 'anchors', 'Catalogs for Simpson Technical Library'),
  ('simpson-code-evaluation-reports', 'anchors', 'Simpson Code Evaluation Reports'),
  ('fliers-for-simpson-technical-library', 'anchors', 'Fliers for Simpson Technical Library'),
  ('safety-data-for-simpson-technical-library', 'anchors', 'Safety Data for Simpson Technical Library'),
  ('strongwall-for-simpson-technical-library', 'anchors', 'StrongWall for Simpson Technical Library'),
  ('submittals-for-simpson-technical-library', 'anchors', 'Submittals for Simpson Technical Library'),
  ('techbull-for-simpson-technical-library', 'anchors', 'TechBull for Simpson Technical Library'),
  ('firestopping-and-structural-penetrations', 'anchors', 'Firestopping and Structural Penetrations'),
  ('3m-for-firestopping-and-structural-penetrations', 'anchors', '3M for Firestopping and Structural Penetrations'),
  ('embedded-part-ep-procedures', 'anchors', 'Embedded Part (EP) Procedures'),
  ('supplementary-penetration-coordination', 'anchors', 'Supplementary Penetration Coordination'),
  ('hilti-for-firestopping-and-structural-penetrations', 'anchors', 'Hilti for Firestopping and Structural Penetrations'),
  ('structural-inspection-and-condition-assessment', 'inspection', 'Structural Inspection and Condition Assessment'),
  ('engineering-inspection-presentations', 'inspection', 'Engineering Inspection Presentations'),
  ('movies-for-engineering-inspection-presentations', 'inspection', 'Movies for Engineering Inspection Presentations'),
  ('microstation-for-movies', 'inspection', 'MicroStation for Movies'),
  ('structural-corrosion-and-durability', 'inspection', 'Structural Corrosion and Durability'),
  ('protective-paint-and-coatings', 'inspection', 'Protective Paint and Coatings'),
  ('concrete-defect', 'inspection', 'Concrete Defect'),
  ('repair-products', 'inspection', 'Repair Products'),
  ('composite-strengthening-reference-review', 'inspection', 'Composite Strengthening Reference Review'),
  ('corrosion-inhibitor', 'inspection', 'Corrosion Inhibitor'),
  ('finish-coatings', 'inspection', 'Finish Coatings'),
  ('mci-corrosion-inhibitors', 'inspection', 'MCI Corrosion Inhibitors'),
  ('floor-loading-assessment', 'inspection', 'Existing Floor Loading and Capacity Assessment'),
  ('leed-and-sustainable-construction', 'civil', 'LEED and Sustainable Construction'),
  ('civil-engineering-reference-library', 'civil', 'Civil Engineering Reference Library'),
  ('reinforcement-detailing', 'civil', 'Concrete Reinforcement Detailing and Crack Control'),
  ('storm-drainage', 'civil', 'Storm Drainage Flow and Inlet Capacity'),
  ('fall-protection', 'safety', 'Fall Protection and Structural Anchorage Coordination'),
  ('structural-calculation-notes', 'workflow', 'Structural Calculation Notes'),
  ('canam-for-structural-calculation-notes', 'workflow', 'Canam Joist Calculation Notes'),
  ('masonry-for-structural-calculation-notes', 'workflow', 'Masonry for Structural Calculation Notes'),
  ('mathcad-engineering-worksheets', 'workflow', 'Mathcad Engineering Worksheets'),
  ('samples-for-mathcad-engineering-worksheets', 'workflow', 'Samples for Mathcad Engineering Worksheets'),
  ('floor-for-samples', 'workflow', 'Floor for Samples'),
  ('pump-for-samples', 'workflow', 'Pump for Samples'),
  ('supports-for-samples', 'workflow', 'Supports for Samples'),
  ('panels-for-supports', 'workflow', 'Panels for Supports'),
  ('engineering-spreadsheets', 'workflow', 'Engineering Spreadsheets'),
  ('idea-statica-connection-design', 'workflow', 'IDEA StatiCa Connection Design'),
  ('advance-steel-detailing', 'workflow', 'Advance Steel Detailing'),
  ('engineering-software-apis', 'workflow', 'Engineering Software APIs'),
  ('autodesk-structural-cad-resources', 'workflow', 'Autodesk Structural CAD Resources'),
  ('bluebeam-drawing-review', 'workflow', 'Bluebeam Drawing Review'),
  ('dynamo-analysis', 'workflow', 'Dynamo for Structural BIM'),
  ('programming-for-engineering-workflows', 'workflow', 'Programming for Engineering Workflows'),
  ('python-for-engineering-automation', 'workflow', 'Python for Engineering Automation'),
  ('python-automation-practice-example', 'workflow', 'Python Automation Practice Example'),
  ('revit-structural-modeling', 'workflow', 'Revit Structural Modeling'),
  ('bim-coordination-in-revit', 'workflow', 'BIM Coordination in Revit'),
  ('revit-level-of-development', 'workflow', 'Revit Level of Development'),
  ('parametric-design', 'workflow', 'Parametric Design'),
  ('revit-robot-exchange', 'workflow', 'Revit to Robot Analytical Model Exchange'),
  ('model-exchange-presentation-examples', 'workflow', 'Model Exchange Presentation Examples'),
  ('sap2000-and-etabs-model-comparison', 'workflow', 'SAP2000 and ETABS Model Comparison'),
  ('revit-to-sap2000', 'workflow', 'Revit to SAP2000'),
  ('comparing-sap2000-and-robot-models', 'workflow', 'Comparing SAP2000 and Robot Models'),
  ('sap2000-and-revit-model-exchange', 'workflow', 'SAP2000 Model Verification and Revit Coordination'),
  ('csi-to-revit', 'workflow', 'CSI to Revit Model Exchange'),
  ('sap-for-sap2000-and-revit-model-exchange', 'workflow', 'Sap for SAP2000 and Revit Model Exchange'),
  ('structural-shop-drawing-review', 'workflow', 'Structural Shop Drawing Review'),
  ('wood-structural-design-and-detailing', 'wood', 'Wood Framing Load Paths and Support Detailing');

commit;
