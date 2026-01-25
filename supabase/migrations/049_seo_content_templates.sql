-- Phase 1.2: SEO Content Templates Table
-- Stores unique content for each facet page to avoid duplicate content issues

CREATE TABLE IF NOT EXISTS seo_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL CHECK (locale IN ('no', 'en')),
  facet_type TEXT NOT NULL CHECK (facet_type IN ('type', 'year', 'price', 'size', 'collection', 'type-year', 'type-size', 'type-price')),
  facet_value TEXT NOT NULL,

  -- SEO metadata
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,

  -- Page content
  h1_text TEXT NOT NULL,
  intro_paragraph TEXT,
  seo_footer_text TEXT,

  -- FAQ content as JSONB array
  -- Format: [{"question": "...", "answer": "..."}, ...]
  faq_items JSONB DEFAULT '[]'::jsonb,

  -- Content variations based on context
  low_count_intro TEXT,      -- Shown when < 5 products
  high_count_intro TEXT,     -- Shown when > 20 products
  empty_state_text TEXT,     -- Shown when 0 products

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint for locale + facet combination
  CONSTRAINT seo_content_templates_unique UNIQUE(locale, facet_type, facet_value)
);

-- Add updated_at trigger
CREATE TRIGGER seo_content_templates_updated_at
  BEFORE UPDATE ON seo_content_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_seo_templates_locale_facet
  ON seo_content_templates (locale, facet_type);

CREATE INDEX IF NOT EXISTS idx_seo_templates_facet_value
  ON seo_content_templates (facet_type, facet_value);

-- Enable RLS
ALTER TABLE seo_content_templates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read seo templates"
  ON seo_content_templates FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can modify
CREATE POLICY "Service role can manage seo templates"
  ON seo_content_templates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed default content templates for type facets
INSERT INTO seo_content_templates (locale, facet_type, facet_value, meta_title, meta_description, h1_text, intro_paragraph, faq_items, low_count_intro, high_count_intro)
VALUES
  -- Norwegian - Type facets
  ('no', 'type', 'original',
   'Originale Kunstverk | Unike Pop-Art Malerier | Dotty.',
   'Utforsk vår eksklusive samling av originale, håndmalte pop-art kunstverk. Hvert maleri er et unikt mesterverk signert av kunstneren.',
   'Originale Kunstverk',
   'Våre originale kunstverk er unike mesterverk, håndmalt med kjærlighet og dedikasjon. Hvert stykke er signert av kunstneren og kommer med ekthetssertifikat. Opplev ekte pop-art kunst som vil transformere ditt hjem.',
   '[{"question": "Hva gjør et originalt kunstverk unikt?", "answer": "Hvert originalt verk er håndmalt og finnes kun i ett eksemplar. Du får et signert verk med ekthetssertifikat."}, {"question": "Hvordan leveres originale kunstverk?", "answer": "Originaler pakkes forsiktig og sendes med forsikret frakt. Store verk leveres med spesialtransport."}, {"question": "Kan jeg bestille et tilpasset originalt verk?", "answer": "Ja, ta kontakt for å diskutere kommisjonert kunst tilpasset dine ønsker og rom."}]',
   'Oppdag våre sjeldne originaler - hver én et unikt kunstnerisk uttrykk.',
   'Utforsk vår omfattende samling av originale pop-art malerier. Med over {count} unike verk finner du garantert noe som passer din stil.'),

  ('no', 'type', 'print',
   'Kunsttrykk | Limiterte Pop-Art Trykk | Dotty.',
   'Oppdag våre kunsttrykk i begrenset opplag. Høykvalitets reproduksjoner som bringer pop-art inn i ditt hjem til rimelige priser.',
   'Kunsttrykk',
   'Våre kunsttrykk gir deg muligheten til å eie pop-art av høy kvalitet til en mer tilgjengelig pris. Hvert trykk er produsert i begrenset opplag på arkivpapir, signert og nummerert av kunstneren.',
   '[{"question": "Hva er forskjellen på et trykk og en original?", "answer": "Trykk er høykvalitets reproduksjoner i begrenset opplag, mens originaler er unike håndmalte verk. Begge er signert av kunstneren."}, {"question": "Hvor mange trykk lages av hvert motiv?", "answer": "Opplaget varierer, men typisk mellom 50-100 eksemplarer per motiv. Opplaget står angitt på hvert verk."}, {"question": "Hvilket papir brukes til trykkene?", "answer": "Vi bruker arkivkvalitet Fine Art papir som holder seg vakkert i generasjoner."}]',
   'Se våre eksklusive kunsttrykk - perfekte for den som vil starte sin kunstsamling.',
   'Bla gjennom vår store samling av kunsttrykk. Med {count} motiver å velge mellom, finner du det perfekte verket for deg.'),

  -- English - Type facets
  ('en', 'type', 'original',
   'Original Artworks | Unique Pop-Art Paintings | Dotty.',
   'Explore our exclusive collection of original, hand-painted pop-art artworks. Each painting is a unique masterpiece signed by the artist.',
   'Original Artworks',
   'Our original artworks are unique masterpieces, hand-painted with love and dedication. Each piece is signed by the artist and comes with a certificate of authenticity. Experience real pop-art that will transform your home.',
   '[{"question": "What makes an original artwork unique?", "answer": "Each original is hand-painted and exists in only one copy. You receive a signed work with a certificate of authenticity."}, {"question": "How are original artworks delivered?", "answer": "Originals are carefully packaged and shipped with insured delivery. Large works are delivered with special transport."}, {"question": "Can I commission a custom original work?", "answer": "Yes, please contact us to discuss commissioned art tailored to your wishes and space."}]',
   'Discover our rare originals - each one a unique artistic expression.',
   'Explore our extensive collection of original pop-art paintings. With over {count} unique pieces, you''re sure to find something that fits your style.'),

  ('en', 'type', 'print',
   'Art Prints | Limited Edition Pop-Art Prints | Dotty.',
   'Discover our limited edition art prints. High-quality reproductions that bring pop-art into your home at accessible prices.',
   'Art Prints',
   'Our art prints give you the opportunity to own high-quality pop-art at a more accessible price. Each print is produced in limited edition on archival paper, signed and numbered by the artist.',
   '[{"question": "What''s the difference between a print and an original?", "answer": "Prints are high-quality limited edition reproductions, while originals are unique hand-painted works. Both are signed by the artist."}, {"question": "How many prints are made of each design?", "answer": "Edition sizes vary, but typically between 50-100 copies per design. The edition number is noted on each work."}, {"question": "What paper is used for the prints?", "answer": "We use archival quality Fine Art paper that will remain beautiful for generations."}]',
   'View our exclusive art prints - perfect for starting your art collection.',
   'Browse our large collection of art prints. With {count} designs to choose from, you''ll find the perfect piece for you.')
ON CONFLICT (locale, facet_type, facet_value) DO NOTHING;

-- Seed price range templates
INSERT INTO seo_content_templates (locale, facet_type, facet_value, meta_title, meta_description, h1_text, intro_paragraph, faq_items)
VALUES
  ('no', 'price', 'under-2500',
   'Kunst Under 2500 kr | Rimelig Pop-Art | Dotty.',
   'Oppdag pop-art til under 2500 kr. Perfekt for å starte kunstsamlingen din uten å bryte budsjettet.',
   'Kunst Under 2 500 kr',
   'Start din kunstsamling med våre rimeligste verk. Pop-art trykk og mindre originaler som passer ethvert budsjett, uten å gå på kompromiss med kvalitet eller stil.',
   '[{"question": "Hva slags kunst får jeg til under 2500 kr?", "answer": "I denne prisklassen finner du hovedsakelig kunsttrykk i mindre formater. Perfekt for å starte samlingen."}, {"question": "Er rimelige trykk av lavere kvalitet?", "answer": "Nei, alle våre trykk er produsert på arkivpapir av høyeste kvalitet, uavhengig av pris."}]'),

  ('en', 'price', 'under-2500',
   'Art Under 2,500 NOK | Affordable Pop-Art | Dotty.',
   'Discover pop-art under 2,500 NOK. Perfect for starting your art collection without breaking the budget.',
   'Art Under 2,500 NOK',
   'Start your art collection with our most affordable pieces. Pop-art prints and smaller originals that fit any budget, without compromising on quality or style.',
   '[{"question": "What kind of art can I get for under 2,500 NOK?", "answer": "In this price range, you''ll find mainly art prints in smaller formats. Perfect for starting your collection."}, {"question": "Are affordable prints lower quality?", "answer": "No, all our prints are produced on the highest quality archival paper, regardless of price."}]'),

  ('no', 'price', 'over-25000',
   'Eksklusiv Kunst Over 25 000 kr | Premium Pop-Art | Dotty.',
   'Utforsk våre mest eksklusive kunstverk over 25 000 kr. Store originaler og sjeldne mesterverk for den kresne samleren.',
   'Eksklusiv Kunst Over 25 000 kr',
   'For den seriøse kunstsamleren tilbyr vi våre mest eksklusive verk. Store originaler, sjeldne mesterverk og unika som vil være midtpunktet i ethvert rom.',
   '[{"question": "Hva gjør disse verkene så eksklusive?", "answer": "Verkene i denne kategorien er store originaler, ofte flere meter i størrelse, med ekstraordinær detaljrikdom og kompleksitet."}, {"question": "Inkluderer prisen frakt og montering?", "answer": "For verk over 25 000 kr tilbyr vi hvit hansker-levering med profesjonell montering inkludert."}]'),

  ('en', 'price', 'over-25000',
   'Exclusive Art Over 25,000 NOK | Premium Pop-Art | Dotty.',
   'Explore our most exclusive artworks over 25,000 NOK. Large originals and rare masterpieces for the discerning collector.',
   'Exclusive Art Over 25,000 NOK',
   'For the serious art collector, we offer our most exclusive works. Large originals, rare masterpieces, and unique pieces that will be the centerpiece of any room.',
   '[{"question": "What makes these works so exclusive?", "answer": "Works in this category are large originals, often several meters in size, with extraordinary detail and complexity."}, {"question": "Does the price include shipping and installation?", "answer": "For works over 25,000 NOK, we offer white-glove delivery with professional installation included."}]')
ON CONFLICT (locale, facet_type, facet_value) DO NOTHING;

-- Comment for documentation
COMMENT ON TABLE seo_content_templates IS
  'SEO content templates for programmatic pages. Provides unique content per facet to avoid duplicate content issues.';
