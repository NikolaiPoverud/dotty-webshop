export interface GuideSection {
  heading: string;
  body: string;
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface GuideCTA {
  text: string;
  href: string;
}

export interface GuideContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  sections: GuideSection[];
  faqs: GuideFAQ[];
  cta: GuideCTA;
}

export interface Guide {
  slug: string;
  content: Record<'no' | 'en', GuideContent>;
  relatedSlugs: string[];
  datePublished: string;
  dateModified: string;
}

export const GUIDES: Guide[] = [
  {
    slug: 'hva-er-pop-art',
    datePublished: '2025-01-15',
    dateModified: '2025-06-01',
    relatedSlugs: ['pop-art-historie', 'velg-kunst-til-hjemmet'],
    content: {
      no: {
        title: 'Hva er pop-art?',
        metaTitle: 'Hva er pop-art? | En enkel guide til kunstretningen',
        metaDescription:
          'Lær om pop-art: opprinnelse, kjennetegn og de mest kjente kunstnerne. Oppdag hvorfor pop-art fortsatt er relevant i dag.',
        excerpt:
          'Pop-art er en kunstretning som oppstod på 1950-tallet og feirer populærkultur, reklame og massemedia. Her er alt du trenger å vite.',
        sections: [
          {
            heading: 'Opprinnelsen til pop-art',
            body: 'Pop-art oppstod i Storbritannia på midten av 1950-tallet og spredte seg raskt til USA. Kunstnerne hentet inspirasjon fra reklame, tegneserier og hverdagsprodukter. Det var et bevisst brudd med den abstrakte ekspresjonismen som dominerte kunstscenen.',
          },
          {
            heading: 'Kjennetegn ved pop-art',
            body: 'Pop-art kjennetegnes av sterke farger, tydelige konturer og bruk av bilder fra populærkulturen. Halvtonemønstre, gjentakelser og ironi er sentrale virkemidler. Stilen visker ut grensen mellom «fin kunst» og kommersiell kultur.',
          },
          {
            heading: 'Kjente pop-art-kunstnere',
            body: 'Andy Warhol er kanskje den mest ikoniske pop-art-kunstneren, kjent for sine Campbell\'s Soup-bokser og Marilyn Monroe-portretter. Roy Lichtenstein skapte malerier inspirert av tegneserier, mens Jasper Johns brukte flagg og tall som motiver. Claes Oldenburg er kjent for sine gigantiske skulpturer av hverdagsobjekter.',
          },
          {
            heading: 'Pop-art i dag',
            body: 'Pop-art lever videre gjennom samtidskunstnere som blander klassiske teknikker med moderne temaer. Stilen er like aktuell i dag som på 1960-tallet, med referanser til sosiale medier, teknologi og forbrukerkultur. Hos oss finner du originale pop-art-verk som bringer denne energien inn i hjemmet ditt.',
          },
        ],
        faqs: [
          {
            question: 'Hva betyr pop-art?',
            answer:
              'Pop-art er en forkortelse for «popular art» og refererer til kunst som henter motiver og teknikker fra populærkulturen, massemedia og reklame.',
          },
          {
            question: 'Hvem regnes som pop-artens far?',
            answer:
              'Både Richard Hamilton i Storbritannia og Andy Warhol i USA regnes som sentrale grunnleggere av pop-art-bevegelsen.',
          },
          {
            question: 'Er pop-art fortsatt populært?',
            answer:
              'Ja, pop-art er en av de mest gjenkjennelige kunstretningene og inspirerer fortsatt kunstnere, designere og interiørinteresserte verden over.',
          },
        ],
        cta: {
          text: 'Utforsk vår samling av originale pop-art-verk',
          href: '/shop',
        },
      },
      en: {
        title: 'What is Pop Art?',
        metaTitle: 'What is Pop Art? | A Simple Guide to the Art Movement',
        metaDescription:
          'Learn about pop art: its origins, key characteristics, and most famous artists. Discover why pop art is still relevant today.',
        excerpt:
          'Pop art is an art movement that emerged in the 1950s, celebrating popular culture, advertising, and mass media. Here is everything you need to know.',
        sections: [
          {
            heading: 'The Origins of Pop Art',
            body: 'Pop art emerged in Britain in the mid-1950s and quickly spread to the United States. Artists drew inspiration from advertising, comic strips, and everyday consumer products. It was a deliberate break from the abstract expressionism that dominated the art scene.',
          },
          {
            heading: 'Key Characteristics of Pop Art',
            body: 'Pop art is defined by bold colors, strong outlines, and imagery drawn from popular culture. Halftone patterns, repetition, and irony are central techniques. The style deliberately blurs the line between "fine art" and commercial culture.',
          },
          {
            heading: 'Famous Pop Art Artists',
            body: "Andy Warhol is perhaps the most iconic pop artist, known for his Campbell's Soup cans and Marilyn Monroe portraits. Roy Lichtenstein created paintings inspired by comic books, while Jasper Johns used flags and numbers as motifs. Claes Oldenburg is celebrated for his oversized sculptures of everyday objects.",
          },
          {
            heading: 'Pop Art Today',
            body: 'Pop art lives on through contemporary artists who blend classic techniques with modern themes. The style is as relevant today as it was in the 1960s, with references to social media, technology, and consumer culture. In our shop, you will find original pop art pieces that bring this energy into your home.',
          },
        ],
        faqs: [
          {
            question: 'What does pop art mean?',
            answer:
              'Pop art is short for "popular art" and refers to art that takes its subjects and techniques from popular culture, mass media, and advertising.',
          },
          {
            question: 'Who is considered the father of pop art?',
            answer:
              'Both Richard Hamilton in Britain and Andy Warhol in the United States are considered central founders of the pop art movement.',
          },
          {
            question: 'Is pop art still popular?',
            answer:
              'Yes, pop art remains one of the most recognizable art movements and continues to inspire artists, designers, and interior enthusiasts worldwide.',
          },
        ],
        cta: {
          text: 'Explore our collection of original pop art',
          href: '/shop',
        },
      },
    },
  },
  {
    slug: 'velg-kunst-til-hjemmet',
    datePublished: '2025-01-15',
    dateModified: '2025-06-01',
    relatedSlugs: ['hva-er-pop-art', 'ta-vare-pa-kunsttrykk'],
    content: {
      no: {
        title: 'Hvordan velge kunst til hjemmet',
        metaTitle: 'Hvordan velge kunst til hjemmet | Tips og råd',
        metaDescription:
          'Praktiske tips for å velge kunst til stue, soverom og kontor. Lær om størrelse, farger og plassering for best mulig resultat.',
        excerpt:
          'Å velge riktig kunstverk til hjemmet handler om mer enn bare smak. Her får du praktiske tips om størrelse, farger og plassering.',
        sections: [
          {
            heading: 'Velg riktig størrelse',
            body: 'Et kunstverk bør fylle omtrent to tredjedeler av veggen eller møbelet det henger over. For store vegger fungerer ett stort verk bedre enn flere små. Mål veggen før du handler, og husk at et bilde som virker stort i butikken kan virke lite på en stor vegg.',
          },
          {
            heading: 'Farger og stemning',
            body: 'Velg kunst som harmonerer med rommets fargepalett, eller bruk det som et bevisst kontrastpunkt. Pop-art med sterke farger kan løfte et nøytralt rom og gi det karakter. Tenk på hvilken stemning du ønsker: energisk og leken, eller rolig og sofistikert.',
          },
          {
            heading: 'Rom for rom',
            body: 'I stuen passer større, iøynefallende verk som blir et samtaleemne. På soverommet fungerer roligere motiver og dempede farger best. På hjemmekontoret kan et inspirerende kunstverk øke kreativiteten og gjøre arbeidsdagen mer motiverende.',
          },
          {
            heading: 'Original eller trykk?',
            body: 'Et originalverk er unikt og kan bli en investering som stiger i verdi over tid. Trykk gir deg muligheten til å få kunsten du elsker til en lavere pris, og kvalitetstrykk holder seg flotte i mange år. Begge deler kan være det riktige valget avhengig av budsjett og ønsker.',
          },
          {
            heading: 'Plassering og oppheng',
            body: 'Midten av kunstverket bør henge i øyehøyde, omtrent 150 cm fra gulvet. Over en sofa bør det være 15-20 cm mellom sofaen og bildet. God belysning gjør en stor forskjell, og en enkel spotlampe kan fremheve verket.',
          },
        ],
        faqs: [
          {
            question: 'Hvor stort bør et kunstverk være?',
            answer:
              'En god tommelfingerregel er at kunstverket bør dekke omtrent to tredjedeler av bredden på møbelet det henger over. For frie vegger kan du gå større.',
          },
          {
            question: 'Må kunsten matche rommets farger?',
            answer:
              'Ikke nødvendigvis. Kunst som kontrasterer kan skape et spennende blikkfang. Det viktigste er at helheten føles gjennomtenkt og bevisst.',
          },
        ],
        cta: {
          text: 'Finn kunsten som passer hjemmet ditt',
          href: '/shop',
        },
      },
      en: {
        title: 'How to Choose Art for Your Home',
        metaTitle: 'How to Choose Art for Your Home | Tips and Advice',
        metaDescription:
          'Practical tips for choosing art for your living room, bedroom, and office. Learn about sizing, colors, and placement for the best result.',
        excerpt:
          'Choosing the right artwork for your home is about more than just taste. Here are practical tips on sizing, colors, and placement.',
        sections: [
          {
            heading: 'Choosing the Right Size',
            body: 'An artwork should fill roughly two-thirds of the wall or furniture piece it hangs above. For large walls, one big piece works better than several small ones. Measure your wall before shopping, and remember that a piece that looks large in a store can appear small on a big wall.',
          },
          {
            heading: 'Colors and Mood',
            body: 'Choose art that harmonizes with the room\'s color palette, or use it as a deliberate contrast point. Pop art with bold colors can elevate a neutral room and give it character. Consider the mood you want: energetic and playful, or calm and sophisticated.',
          },
          {
            heading: 'Room by Room',
            body: 'In the living room, larger eye-catching pieces that spark conversation work best. In the bedroom, calmer subjects and muted tones create a restful atmosphere. In a home office, an inspiring artwork can boost creativity and make the workday more motivating.',
          },
          {
            heading: 'Original or Print?',
            body: 'An original work is unique and can be an investment that grows in value over time. Prints let you enjoy the art you love at a lower price point, and quality prints stay beautiful for years. Both can be the right choice depending on your budget and goals.',
          },
          {
            heading: 'Placement and Hanging',
            body: 'The center of the artwork should hang at eye level, roughly 150 cm from the floor. Above a sofa, leave 15-20 cm between the couch and the frame. Good lighting makes a big difference, and a simple spotlight can truly highlight the piece.',
          },
        ],
        faqs: [
          {
            question: 'How large should an artwork be?',
            answer:
              'A good rule of thumb is that the artwork should cover about two-thirds of the width of the furniture it hangs above. For open walls, you can go larger.',
          },
          {
            question: 'Does the art need to match the room colors?',
            answer:
              'Not necessarily. Art that contrasts can create an exciting focal point. The key is that the overall look feels intentional and considered.',
          },
        ],
        cta: {
          text: 'Find the art that fits your home',
          href: '/shop',
        },
      },
    },
  },
  {
    slug: 'ta-vare-pa-kunsttrykk',
    datePublished: '2025-01-15',
    dateModified: '2025-06-01',
    relatedSlugs: ['velg-kunst-til-hjemmet'],
    content: {
      no: {
        title: 'Hvordan ta vare på kunsttrykk',
        metaTitle: 'Hvordan ta vare på kunsttrykk | Pleie og oppbevaring',
        metaDescription:
          'Lær hvordan du tar vare på kunsttrykk med riktig innramming, UV-beskyttelse, rengjøring og oppbevaring. Hold trykkene fine i mange år.',
        excerpt:
          'Med riktig behandling kan kunsttrykk holde seg vakre i generasjoner. Her er de viktigste tipsene for innramming, rengjøring og oppbevaring.',
        sections: [
          {
            heading: 'Innramming og montering',
            body: 'Bruk alltid syrefritt passepartout og bakplate for å beskytte trykket. Unngå å montere trykket direkte mot glasset, da fuktighet kan føre til at papiret fester seg. En profesjonell innrammer kan hjelpe deg med å velge riktige materialer.',
          },
          {
            heading: 'UV-beskyttelse',
            body: 'Direkte sollys bleker farger over tid. Velg glass med UV-filter eller plasser kunsten vekk fra vinduer med sterkt lys. Museumsglass gir best beskyttelse, men selv vanlig UV-glass gjør en stor forskjell.',
          },
          {
            heading: 'Rengjøring',
            body: 'Tørk av glasset med en myk, lofri klut og alkoholfritt rengøringsmiddel. Bruk aldri spray direkte på rammen, da væske kan trenge inn bak glasset. Støv rammen regelmessig for å unngå oppsamling.',
          },
          {
            heading: 'Fuktighet og temperatur',
            body: 'Kunsttrykk trives best i stabil romtemperatur med en luftfuktighet på 40-60 prosent. Unngå å henge kunst på baderom eller i kjøkken med mye damp. Svingninger i fuktighet kan føre til bølger i papiret og muggdannelse.',
          },
          {
            heading: 'Oppbevaring',
            body: 'Trykk som ikke er hengt opp bør oppbevares flatt i syrefrie mapper. Unngå å rulle trykk over lengre tid, da det kan skade overflaten. Oppbevar i tørt, kjølig rom, og legg syrefritt silkepapir mellom hvert trykk.',
          },
        ],
        faqs: [
          {
            question: 'Kan jeg henge kunsttrykk i direkte sollys?',
            answer:
              'Det anbefales ikke. Direkte sollys bleker fargene over tid. Bruk UV-beskyttende glass og unngå plassering rett i sollys for å bevare trykkets kvalitet.',
          },
          {
            question: 'Hvor lenge varer et kunsttrykk?',
            answer:
              'Med riktig innramming og plassering kan kvalitetstrykk holde seg fine i mange tiår. Syrefrie materialer og UV-beskyttelse er nøkkelen til lang levetid.',
          },
          {
            question: 'Trenger jeg profesjonell innramming?',
            answer:
              'Det er ikke et krav, men en profesjonell innrammer sikrer syrefrie materialer og riktig montering som beskytter trykket best mulig.',
          },
        ],
        cta: {
          text: 'Se vårt utvalg av kunsttrykk',
          href: '/shop',
        },
      },
      en: {
        title: 'How to Care for Art Prints',
        metaTitle: 'How to Care for Art Prints | Maintenance and Storage',
        metaDescription:
          'Learn how to care for art prints with proper framing, UV protection, cleaning, and storage. Keep your prints beautiful for years to come.',
        excerpt:
          'With proper care, art prints can stay beautiful for generations. Here are the most important tips on framing, cleaning, and storage.',
        sections: [
          {
            heading: 'Framing and Mounting',
            body: 'Always use acid-free matting and backing board to protect the print. Avoid mounting the print directly against the glass, as moisture can cause the paper to stick. A professional framer can help you choose the right materials.',
          },
          {
            heading: 'UV Protection',
            body: 'Direct sunlight fades colors over time. Choose glass with UV filtering or place art away from windows with strong light. Museum glass offers the best protection, but even standard UV glass makes a significant difference.',
          },
          {
            heading: 'Cleaning',
            body: 'Wipe the glass with a soft, lint-free cloth and alcohol-free cleaner. Never spray directly on the frame, as liquid can seep behind the glass. Dust the frame regularly to prevent buildup.',
          },
          {
            heading: 'Humidity and Temperature',
            body: 'Art prints do best in stable room temperature with humidity between 40-60 percent. Avoid hanging art in bathrooms or kitchens with heavy steam. Fluctuations in humidity can cause the paper to warp and encourage mold growth.',
          },
          {
            heading: 'Storage',
            body: 'Prints that are not hung should be stored flat in acid-free folders. Avoid rolling prints for extended periods, as this can damage the surface. Store in a dry, cool room, and place acid-free tissue paper between each print.',
          },
        ],
        faqs: [
          {
            question: 'Can I hang art prints in direct sunlight?',
            answer:
              'It is not recommended. Direct sunlight fades colors over time. Use UV-protective glass and avoid placement in direct sunlight to preserve the print quality.',
          },
          {
            question: 'How long do art prints last?',
            answer:
              'With proper framing and placement, quality prints can remain beautiful for many decades. Acid-free materials and UV protection are the keys to longevity.',
          },
          {
            question: 'Do I need professional framing?',
            answer:
              'It is not required, but a professional framer ensures acid-free materials and proper mounting that protect the print as well as possible.',
          },
        ],
        cta: {
          text: 'Browse our art print collection',
          href: '/shop',
        },
      },
    },
  },
  {
    slug: 'pop-art-historie',
    datePublished: '2025-01-15',
    dateModified: '2025-06-01',
    relatedSlugs: ['hva-er-pop-art'],
    content: {
      no: {
        title: 'Pop-artens historie og kjente kunstnere',
        metaTitle: 'Pop-artens historie | Fra 1950-tallet til i dag',
        metaDescription:
          'Utforsk pop-artens historie fra 1950-tallet til i dag. Lær om de viktigste bevegelsene, kunstnerne og hvordan pop-art har utviklet seg.',
        excerpt:
          'Fra britiske kollasjer på 1950-tallet til moderne digital kunst. Følg pop-artens fascinerende reise gjennom tiårene.',
        sections: [
          {
            heading: '1950-tallet: Pop-art fødes i Storbritannia',
            body: 'Pop-artens røtter ligger i den britiske Independent Group, med kunstnere som Richard Hamilton og Eduardo Paolozzi. Hamiltons kollasje «Just what is it that makes today\'s homes so different, so appealing?» fra 1956 regnes som et av de første pop-art-verkene. Gruppen utforsket forholdet mellom kunst, teknologi og populærkultur.',
          },
          {
            heading: '1960-tallet: Den amerikanske eksplosjonen',
            body: 'I New York tok Andy Warhol, Roy Lichtenstein og James Rosenquist pop-art til nye høyder. Warhols Factory ble et kulturelt sentrum der kunst, musikk og film smeltet sammen. Perioden definerte pop-art som en av de mest innflytelsesrike kunstretningene i det 20. århundret.',
          },
          {
            heading: '1970- og 80-tallet: Utvikling og neo-pop',
            body: 'Pop-art inspirerte nye bevegelser som neo-pop, med kunstnere som Jeff Koons og Keith Haring. Haring tok kunsten ut på gatene med sine ikoniske figurer i New Yorks t-bane. Grensen mellom populærkultur og kunst ble enda mer utydelig.',
          },
          {
            heading: 'Pop-art i Norden',
            body: 'Skandinavia har sin egen pop-art-tradisjon med kunstnere som svenske Öyvind Fahlström og danske Asger Jorn, som begge var påvirket av bevegelsen. I Norge har pop-art inspirert samtidskunstnere som blander nordisk estetikk med internasjonale pop-art-tradisjoner.',
          },
          {
            heading: 'Pop-art i dag',
            body: 'Moderne pop-art inkorporerer digitale teknikker, sosiale medier og nye kulturelle referanser. Kunstnere som Banksy, Takashi Murakami og KAWS viderefører ånden i pop-art med nye uttrykk. Pop-art forblir en vital og tilgjengelig kunstform som appellerer til et bredt publikum.',
          },
        ],
        faqs: [
          {
            question: 'Når startet pop-art?',
            answer:
              'Pop-art oppstod på midten av 1950-tallet i Storbritannia med Independent Group, og spredte seg til USA tidlig på 1960-tallet.',
          },
          {
            question: 'Hva er forskjellen på pop-art og neo-pop?',
            answer:
              'Neo-pop oppstod på 1980-tallet og bygger videre på pop-artens ideer, men med nye materialer og referanser til samtidskulturen. Kunstnere som Jeff Koons og Takashi Murakami er sentrale.',
          },
        ],
        cta: {
          text: 'Opplev pop-art i vår nettbutikk',
          href: '/shop',
        },
      },
      en: {
        title: 'Pop Art History and Famous Artists',
        metaTitle: 'Pop Art History | From the 1950s to Today',
        metaDescription:
          'Explore the history of pop art from the 1950s to today. Learn about the key movements, artists, and how pop art has evolved over the decades.',
        excerpt:
          'From British collages in the 1950s to modern digital art. Follow the fascinating journey of pop art through the decades.',
        sections: [
          {
            heading: 'The 1950s: Pop Art is Born in Britain',
            body: 'Pop art\'s roots lie in the British Independent Group, featuring artists like Richard Hamilton and Eduardo Paolozzi. Hamilton\'s collage "Just what is it that makes today\'s homes so different, so appealing?" from 1956 is considered one of the first pop art works. The group explored the relationship between art, technology, and popular culture.',
          },
          {
            heading: 'The 1960s: The American Explosion',
            body: "In New York, Andy Warhol, Roy Lichtenstein, and James Rosenquist took pop art to new heights. Warhol's Factory became a cultural hub where art, music, and film merged together. This period defined pop art as one of the most influential art movements of the 20th century.",
          },
          {
            heading: 'The 1970s-80s: Evolution and Neo-Pop',
            body: "Pop art inspired new movements like neo-pop, with artists such as Jeff Koons and Keith Haring. Haring took art to the streets with his iconic figures in New York's subway system. The boundary between popular culture and art became even more blurred.",
          },
          {
            heading: 'Pop Art in the Nordics',
            body: 'Scandinavia has its own pop art tradition with artists like Swedish Öyvind Fahlström and Danish Asger Jorn, both influenced by the movement. In Norway, pop art has inspired contemporary artists who blend Nordic aesthetics with international pop art traditions.',
          },
          {
            heading: 'Pop Art Today',
            body: 'Modern pop art incorporates digital techniques, social media, and new cultural references. Artists like Banksy, Takashi Murakami, and KAWS carry forward the spirit of pop art with fresh expressions. Pop art remains a vital and accessible art form that appeals to a broad audience.',
          },
        ],
        faqs: [
          {
            question: 'When did pop art start?',
            answer:
              'Pop art emerged in the mid-1950s in Britain with the Independent Group and spread to the United States in the early 1960s.',
          },
          {
            question: 'What is the difference between pop art and neo-pop?',
            answer:
              'Neo-pop emerged in the 1980s and builds on pop art ideas but with new materials and references to contemporary culture. Artists like Jeff Koons and Takashi Murakami are central figures.',
          },
        ],
        cta: {
          text: 'Experience pop art in our shop',
          href: '/shop',
        },
      },
    },
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
