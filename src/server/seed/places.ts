// Seed places. Descriptions are original to TukTrail.
// Fees, opening hours and practical logistics are deliberately left null:
// every seeded place is `isVerified: false` until a human checks it on the ground.
// Coordinates come from well-established public knowledge; entries marked
// `checkCoords` are approximate and should be spot-checked before launch.
import type { District } from "@/shared/constants/geography";
import type { PlaceCategory } from "@/shared/constants/places";

export interface SeedPlace {
  slug: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  district: District;
  visitRadiusM: number;
  bestMonths: number[];
  shortDescription: string;
  fullDescription: string;
  dressCode?: string;
  safetyNotes?: string;
  checkCoords?: boolean;
}

// Shared guidance that is standard across Sri Lankan Buddhist and Hindu sites.
const TEMPLE_DRESS =
  "Cover shoulders and knees. Remove shoes and hats before entering shrine areas, and never pose with your back to a Buddha statue.";
const KOVIL_DRESS =
  "Dress modestly and remove shoes before entering. At some Hindu kovils men are asked to remove their shirts in the inner shrine.";

// Monsoon-driven seasons (broad patterns, not guarantees).
const SOUTH_WEST_DRY = [12, 1, 2, 3, 4];
const EAST_COAST_DRY = [4, 5, 6, 7, 8, 9];
const CULTURAL_TRIANGLE = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const HILL_COUNTRY = [1, 2, 3, 4];
const UVA_HILLS = [1, 2, 3, 6, 7, 8, 9];
const NORTH = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const SEED_PLACES: SeedPlace[] = [
  // ── Western ──────────────────────────────────────────────────────────
  {
    slug: "gangaramaya-temple",
    name: "Gangaramaya Temple",
    category: "temple",
    lat: 6.9166,
    lng: 79.8563,
    district: "colombo",
    visitRadiusM: 500,
    bestMonths: [],
    shortDescription:
      "A busy, eclectic Buddhist temple near Beira Lake where shrine rooms, a small museum of donated curios and a working school for monks sit side by side in central Colombo.",
    fullDescription:
      "Gangaramaya feels less like a single monument and more like a neighbourhood that happens to be a temple. Courtyards open onto shrine rooms, a bodhi tree, rows of Buddha statues from across Asia and display cases crammed with gifts from devotees over more than a century.\n\nIt is also a living institution: monks study and teach here, and the temple organises one of Colombo's best-known processions around the February full moon.\n\nA short walk away, the Seema Malaka meditation platform floats on Beira Lake and is often visited together with the main temple.",
    dressCode: TEMPLE_DRESS,
  },
  {
    slug: "kelaniya-raja-maha-vihara",
    name: "Kelaniya Raja Maha Vihara",
    category: "temple",
    lat: 6.9533,
    lng: 79.9187,
    district: "gampaha",
    visitRadiusM: 600,
    bestMonths: [],
    shortDescription:
      "A revered riverside temple just outside Colombo, known for its whitewashed stupa and richly painted image house depicting episodes from Buddhist history.",
    fullDescription:
      "Set beside the Kelani River on the edge of the capital, this temple is one of the most important places of worship in the Western Province. Buddhist tradition links the site to a visit by the Buddha himself.\n\nThe image house is the highlight for many visitors: its walls carry large twentieth-century murals that read like an illustrated history of Buddhism on the island.\n\nCome early or late in the day when the stone paths are cooler underfoot and devotees gather for offerings.",
    dressCode: TEMPLE_DRESS,
  },
  {
    slug: "colombo-national-museum",
    name: "Colombo National Museum",
    category: "museum",
    lat: 6.9101,
    lng: 79.8608,
    district: "colombo",
    visitRadiusM: 400,
    bestMonths: [],
    shortDescription:
      "Sri Lanka's largest museum, housed in a white colonial-era building beside Viharamahadevi Park, with galleries spanning royal regalia, bronzes, masks and everyday objects.",
    fullDescription:
      "The National Museum is a good first stop for understanding the places you will see later in the trip. Its galleries move roughly chronologically, from prehistoric finds through the Anuradhapura and Polonnaruwa periods to the Kandyan kingdom and the colonial era.\n\nLook for the bronze statuary, the carved wooden pieces from Kandyan-era buildings and the collection of traditional masks used in southern ritual dance.\n\nThe gardens in front of the building are shaded and pleasant for a break before or after a visit.",
  },
  {
    slug: "galle-face-green",
    name: "Galle Face Green",
    category: "viewpoint",
    lat: 6.9248,
    lng: 79.8457,
    district: "colombo",
    visitRadiusM: 700,
    bestMonths: [],
    shortDescription:
      "An open seafront promenade in the heart of Colombo where families fly kites, street-food carts set up at dusk and the sun drops into the Indian Ocean.",
    fullDescription:
      "Galle Face Green is Colombo's front lawn: a long strip of grass and promenade between the city and the sea. It is at its liveliest in the late afternoon and evening, when the heat eases and the green fills with kite flyers, couples and families.\n\nFood stalls along the seaward edge sell isso vadai (prawn fritters), kottu and fresh fruit with chilli and salt.\n\nThe sea here is for looking at rather than swimming in.",
    safetyNotes: "Strong waves and currents along this stretch; swimming is not advised.",
  },

  // ── Central ──────────────────────────────────────────────────────────
  {
    slug: "temple-of-the-tooth",
    name: "Temple of the Sacred Tooth Relic",
    category: "temple",
    lat: 7.2936,
    lng: 80.6413,
    district: "kandy",
    visitRadiusM: 600,
    bestMonths: [],
    shortDescription:
      "Sri Dalada Maligawa, the lakeside temple in Kandy that houses Sri Lanka's most venerated Buddhist relic, inside the former royal palace complex of the Kandyan kings.",
    fullDescription:
      "For centuries, possession of the tooth relic of the Buddha was tied to the right to rule the island, and it has been kept in Kandy since the time of the Kandyan kingdom. Today the temple remains an active place of worship and part of a UNESCO World Heritage city.\n\nDaily rituals (pujas) bring drumming, offerings and crowds of devotees into the inner shrine. The surrounding complex includes museums, audience halls and royal buildings.\n\nIn July or August the city hosts the Esala Perahera, a night procession of dancers, drummers and decorated elephants.",
    dressCode: TEMPLE_DRESS,
    safetyNotes: "Security checks at the entrance; bags may be inspected.",
  },
  {
    slug: "peradeniya-botanic-gardens",
    name: "Royal Botanic Gardens, Peradeniya",
    category: "garden",
    lat: 7.269,
    lng: 80.5966,
    district: "kandy",
    visitRadiusM: 900,
    bestMonths: [1, 2, 3, 4, 7, 8],
    shortDescription:
      "Expansive botanic gardens on a bend of the Mahaweli River near Kandy, with towering palm avenues, an orchid house and a giant Javan fig spreading over the lawn.",
    fullDescription:
      "Peradeniya is the largest of Sri Lanka's botanic gardens and an easy half-day from Kandy. Wide avenues of royal and cabbage palms divide the grounds, opening onto lawns, a spice garden, bamboo groves and glasshouses.\n\nThe orchid house is a highlight, as is the vast Javan fig tree whose canopy covers an area the size of a small field.\n\nFruit bats roost in the tall trees near the river; you will hear them before you see them.",
  },
  {
    slug: "sigiriya",
    name: "Sigiriya Rock Fortress",
    category: "heritage_site",
    lat: 7.957,
    lng: 80.7603,
    district: "matale",
    visitRadiusM: 1500,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A fifth-century palace built on top of a sheer volcanic plug, reached by staircases past ancient frescoes and a giant pair of carved lion's paws.",
    fullDescription:
      "Sigiriya rises abruptly out of the dry-zone forest, and the climb to its summit is one of Sri Lanka's defining experiences. According to the island's chronicles it was the royal capital of King Kashyapa, who built a palace on the rock and laid out symmetrical water gardens at its base.\n\nOn the way up you pass a sheltered gallery of painted women, a polished 'mirror wall' covered in centuries-old graffiti verse, and the lion's paws that once formed a monumental gateway.\n\nThe summit holds the foundations of the palace and views across the plains to the Knuckles range.",
    safetyNotes:
      "The ascent involves steep, exposed metal stairways. Start early to avoid midday heat, carry water, and keep quiet near hornet nests if signs are posted.",
  },
  {
    slug: "dambulla-cave-temple",
    name: "Dambulla Cave Temple",
    category: "temple",
    lat: 7.8567,
    lng: 80.6492,
    district: "matale",
    visitRadiusM: 800,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "Five cave shrines tucked under a granite overhang, their walls and ceilings covered in painted Buddhas and murals, with views over the plains from the rock terrace.",
    fullDescription:
      "The Dambulla caves have been a place of Buddhist worship for over two thousand years. Each cave is a shrine, and together they hold a remarkable collection of statues and continuous ceiling paintings that seem to flow over the rock.\n\nThe largest cave is crowded with seated and standing Buddhas, while the smaller ones are quieter and more intimate. The complex is a UNESCO World Heritage Site.\n\nThe walk up the rock is short but steep; the terrace at the top looks out towards Sigiriya on clear days.",
    dressCode: TEMPLE_DRESS,
    safetyNotes: "Monkeys are bold around the stairway; keep food out of sight.",
  },
  {
    slug: "horton-plains",
    name: "Horton Plains National Park",
    category: "national_park",
    lat: 6.8022,
    lng: 80.8075,
    district: "nuwara_eliya",
    visitRadiusM: 8000,
    bestMonths: HILL_COUNTRY,
    shortDescription:
      "A high, windswept plateau of grassland and cloud forest whose loop trail leads to World's End, a sudden cliff edge dropping hundreds of metres to the lowlands.",
    fullDescription:
      "Horton Plains sits at the top of the central highlands and feels nothing like the tropical image of Sri Lanka: open grassland, stunted forest, cold streams and frequent mist. It is part of the Central Highlands World Heritage Site.\n\nThe classic walk is a loop of around nine kilometres taking in World's End and Baker's Falls. Arrive early: mist usually rolls in by late morning and can hide the view completely.\n\nSambar deer graze near the trailhead, and the park is a good place for highland endemic birds.",
    safetyNotes:
      "Temperatures can be near freezing at dawn. Stay on marked paths near the escarpment; the cliff edges are unfenced.",
  },
  {
    slug: "gregory-lake",
    name: "Gregory Lake",
    category: "lake",
    lat: 6.9564,
    lng: 80.7728,
    district: "nuwara_eliya",
    visitRadiusM: 900,
    bestMonths: HILL_COUNTRY,
    shortDescription:
      "A colonial-era reservoir on the edge of Nuwara Eliya, ringed by a lakeside path and lawns, with pedal boats and views back to the misty tea hills.",
    fullDescription:
      "Gregory Lake was created in the nineteenth century when Nuwara Eliya was developing as a cool-climate retreat. Today it is the town's main open space, popular with local families at weekends and during the April holiday season.\n\nA path runs around much of the shore, and the lawns along the southern side are good for a slow afternoon.\n\nMornings are often still and misty, which suits photographers.",
  },

  // ── Southern ─────────────────────────────────────────────────────────
  {
    slug: "galle-fort",
    name: "Galle Fort",
    category: "heritage_site",
    lat: 6.0267,
    lng: 80.217,
    district: "galle",
    visitRadiusM: 1000,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A walled old town on a headland, first fortified by the Portuguese and expanded by the Dutch, with ramparts, a lighthouse and quiet streets of colonial houses.",
    fullDescription:
      "Galle Fort is one of the best-preserved fortified towns built by Europeans in South and Southeast Asia, and a UNESCO World Heritage Site. Inside the walls, the grid of narrow streets is lined with old merchant houses, churches, a mosque and small museums.\n\nThe ramparts make an easy circuit on foot. Late afternoon is the best time, when the light softens and people gather on the bastions to watch the sun set over the ocean.\n\nThe fort is a living town, not an open-air museum: people live, work and go to school here.",
    safetyNotes:
      "Some rampart edges are high and unfenced. Avoid jumping from the walls into the sea, regardless of what others are doing.",
  },
  {
    slug: "mirissa-beach",
    name: "Mirissa Beach",
    category: "beach",
    lat: 5.9449,
    lng: 80.459,
    district: "matara",
    visitRadiusM: 1200,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A curved, palm-backed bay on the south coast, with a small rocky islet at one end, relaxed cafés along the sand and a harbour used for whale-watching trips.",
    fullDescription:
      "Mirissa's crescent of sand is one of the south coast's most popular spots. The western end is anchored by Parrot Rock, a small islet you can scramble up at low tide for a view along the bay, and a short headland nearby is known for its photogenic coconut palm grove.\n\nThe harbour to the east is a base for boats heading out to look for blue whales and dolphins during the south coast season.\n\nOutside the dry months the sea can become rough and the beach narrows considerably.",
    safetyNotes:
      "Rip currents occur, especially during the south-west monsoon (roughly May–October). Swim only where locals do and never alone.",
  },
  {
    slug: "mulkirigala-rock-temple",
    name: "Mulkirigala Rock Temple",
    category: "temple",
    lat: 6.1226,
    lng: 80.7379,
    district: "hambantota",
    visitRadiusM: 700,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A tiered series of cave temples climbing a lone rock inland from Tangalle, with reclining Buddhas, painted ceilings and a summit stupa above the coconut country.",
    fullDescription:
      "Mulkirigala is often compared to Dambulla but sees far fewer visitors. The temple complex is arranged on terraces up the rock, each with its own cave shrines holding reclining and seated Buddhas and walls of painted scenes.\n\nThe final stretch to the stupa at the top is steep and exposed, rewarded by wide views over the southern plains to the sea.\n\nGo in the cooler morning hours and allow time to pause at each level.",
    dressCode: TEMPLE_DRESS,
    safetyNotes: "Steep rock-cut steps near the summit; take care in wet weather.",
  },
  {
    slug: "yala-national-park",
    name: "Yala National Park",
    category: "national_park",
    lat: 6.3725,
    lng: 81.5185,
    district: "hambantota",
    visitRadiusM: 15000,
    bestMonths: [2, 3, 4, 5, 6, 7],
    shortDescription:
      "Sri Lanka's best-known wildlife park: dry scrub, rocky outcrops, lagoons and coastline where jeep safaris look for leopards, elephants, sloth bears and birdlife.",
    fullDescription:
      "Yala covers a large stretch of the south-east, but most visits focus on the section nearest the coast. The landscape is a mix of thorny scrub, open grassland, water holes and rocky outcrops that leopards use as lookouts.\n\nBeyond leopards, elephants, water buffalo, crocodiles, spotted deer and a long list of birds are commonly seen. Early morning and late afternoon drives are usually best.\n\nParts of the park often close for a period around September–October during the driest weeks.",
    safetyNotes:
      "Visit only with a licensed safari jeep, stay inside the vehicle and keep noise down. Do not feed animals.",
  },

  // ── Uva ──────────────────────────────────────────────────────────────
  {
    slug: "ella-rock",
    name: "Ella Rock",
    category: "hike",
    lat: 6.8573,
    lng: 81.0408,
    district: "badulla",
    visitRadiusM: 1500,
    bestMonths: UVA_HILLS,
    shortDescription:
      "A half-day hike from Ella village along the railway line, through tea and eucalyptus to a rocky summit with a view down the Ella Gap to the southern plains.",
    fullDescription:
      "Ella Rock is the most popular hike around Ella, and the route is part of the appeal: you start by walking the railway tracks before branching off through tea gardens, small farms and patches of forest.\n\nThe final climb is steep. From the top, the land falls away through the Ella Gap, and on clear days you can see a long way south.\n\nPaths are not well marked and change over time; many people use a local guide or an offline map.",
    safetyNotes:
      "Start early: clouds often close in by late morning. Watch for trains when walking the tracks, and wear proper footwear for loose, steep ground.",
    checkCoords: true,
  },
  {
    slug: "nine-arch-bridge",
    name: "Nine Arch Bridge",
    category: "viewpoint",
    lat: 6.8768,
    lng: 81.0608,
    district: "badulla",
    visitRadiusM: 600,
    bestMonths: UVA_HILLS,
    shortDescription:
      "A colonial-era stone railway viaduct curving across a jungle ravine near Ella, best seen from the hillside café terraces as a blue train rumbles over.",
    fullDescription:
      "The Nine Arch Bridge at Demodara carries the hill-country railway across a deep, forested valley on a series of tall stone arches. Built in the early twentieth century, it has become one of the most recognisable sights in the Ella area.\n\nThe view is best from the slopes on either side, where small cafés overlook the bridge. Watching a train cross is the classic moment, so it is worth asking locally about expected times.\n\nThe bridge can be reached on foot from Ella along the tracks or by a short tuk-tuk ride and walk.",
    safetyNotes: "Step well off the tracks when a train approaches; the bridge has no walkway.",
  },
  {
    slug: "ravana-falls",
    name: "Ravana Falls",
    category: "waterfall",
    lat: 6.8406,
    lng: 81.0547,
    district: "badulla",
    visitRadiusM: 500,
    bestMonths: [10, 11, 12, 1, 2],
    shortDescription:
      "A tall, multi-tiered waterfall right beside the Ella–Wellawaya road, linked in local legend to the Ramayana and at its fullest after the rains.",
    fullDescription:
      "Ravana Falls tumbles down a series of rock steps directly next to the main road below Ella, which makes it one of the easiest waterfalls on the island to see. Local tradition connects the area to the king Ravana of the Ramayana epic.\n\nThe falls are most impressive after heavy rain and can thin to a trickle in the driest weeks.\n\nVendors and visitors gather at the roadside viewing area; for a quieter look, come early.",
    safetyNotes:
      "Rocks near the base are slippery and flash flooding is possible after rain. Mind traffic when stopping on the road.",
  },
  {
    slug: "liptons-seat",
    name: "Lipton's Seat",
    category: "viewpoint",
    lat: 6.803,
    lng: 80.9919,
    district: "badulla",
    visitRadiusM: 700,
    bestMonths: UVA_HILLS,
    shortDescription:
      "A ridge-top lookout above the Dambatenne tea estate near Haputale, said to be where Sir Thomas Lipton surveyed his plantations, with sweeping views over several provinces.",
    fullDescription:
      "The road to Lipton's Seat winds up through the neat rows of the Dambatenne estate, past pickers and small line-house villages. Many visitors walk the last stretch to take in the tea country slowly.\n\nAt the top, a statue of Lipton sits at the edge of a vast view across the hills and down to the plains. On a clear morning it is one of the widest panoramas in the country.\n\nMist arrives quickly, often by mid-morning, so an early start makes all the difference.",
    checkCoords: true,
  },

  // ── Sabaragamuwa ─────────────────────────────────────────────────────
  {
    slug: "sri-pada",
    name: "Sri Pada (Adam's Peak)",
    category: "hike",
    lat: 6.8096,
    lng: 80.4994,
    district: "ratnapura",
    visitRadiusM: 2000,
    bestMonths: [12, 1, 2, 3, 4, 5],
    shortDescription:
      "A sacred conical mountain climbed overnight by pilgrims of several faiths, with thousands of lit steps leading to a summit shrine and a sunrise above the clouds.",
    fullDescription:
      "Sri Pada is revered by Buddhists, Hindus, Muslims and Christians, each tradition associating the footprint-shaped mark at the summit with a different figure. During the pilgrimage season, the path is lit through the night and lined with tea stalls.\n\nMost people start in the small hours to reach the top for sunrise, when the peak casts a triangular shadow across the clouds.\n\nOutside the season the path is unlit and the summit much quieter; the climb is still possible but more serious.",
    dressCode: "The summit is a shrine: dress modestly and remove shoes where asked.",
    safetyNotes:
      "The climb is long and steep with thousands of steps. Bring warm layers for the summit, a torch, and water. Weekends and full-moon days are extremely crowded.",
  },
  {
    slug: "udawalawe-national-park",
    name: "Udawalawe National Park",
    category: "national_park",
    lat: 6.4744,
    lng: 80.8987,
    district: "ratnapura",
    visitRadiusM: 12000,
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    shortDescription:
      "Open grassland and scrub around a large reservoir, where herds of wild elephants are reliably seen on jeep safaris throughout the year.",
    fullDescription:
      "Udawalawe is the place to go if elephants are your priority. The park's open landscape around the Udawalawe reservoir makes it easy to watch family herds feeding, bathing and moving between water sources.\n\nWater buffalo, crocodiles, jackals and many raptors and water birds are also common.\n\nNear the park boundary, the Elephant Transit Home rehabilitates orphaned calves for release back into the wild.",
    safetyNotes: "Visit only with a licensed safari jeep and stay in the vehicle.",
    checkCoords: true,
  },
  {
    slug: "sinharaja-forest-reserve",
    name: "Sinharaja Forest Reserve",
    category: "national_park",
    lat: 6.4236,
    lng: 80.4205,
    district: "ratnapura",
    visitRadiusM: 6000,
    bestMonths: [1, 2, 3, 4, 8, 9],
    shortDescription:
      "The country's last large stretch of lowland rainforest, a World Heritage Site rich in endemic birds, frogs and plants, explored on guided walks under a dense canopy.",
    fullDescription:
      "Sinharaja protects a remnant of the rainforest that once covered much of south-western Sri Lanka. A remarkable share of its trees, birds and amphibians are found nowhere else on Earth.\n\nWalks are guided and follow forest trails from the entrances. Mixed-species bird flocks, which move through the canopy together, are a speciality, but patient watching also turns up lizards, frogs and butterflies.\n\nExpect humidity, rain at almost any time, and plenty of leeches.",
    safetyNotes: "Leech socks are strongly recommended. Trails can be muddy and slippery.",
    checkCoords: true,
  },
  {
    slug: "bopath-ella",
    name: "Bopath Ella",
    category: "waterfall",
    lat: 6.8015,
    lng: 80.3667,
    district: "ratnapura",
    visitRadiusM: 500,
    bestMonths: [1, 2, 3, 6, 7, 8],
    shortDescription:
      "A wide waterfall near Kuruwita whose shape is said to resemble the heart-shaped leaf of the bo tree, set among paddy fields and a short walk from the road.",
    fullDescription:
      "Bopath Ella takes its name from its outline: the water spreads as it falls in a shape likened to a bo leaf. It is an easy stop on the way to or from Ratnapura.\n\nA short path leads from the parking area through village land to the viewing points near the base.\n\nThe falls are fullest after rain, which also makes the rocks treacherous.",
    safetyNotes: "Do not bathe near the base: the pool can have strong undercurrents.",
    checkCoords: true,
  },

  // ── North Central ────────────────────────────────────────────────────
  {
    slug: "anuradhapura-sacred-city",
    name: "Anuradhapura Sacred City",
    category: "heritage_site",
    lat: 8.3446,
    lng: 80.3966,
    district: "anuradhapura",
    visitRadiusM: 3000,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "The first great capital of ancient Sri Lanka: colossal brick stupas, monastery ruins and the sacred bo tree grown from a cutting of the tree of the Buddha's enlightenment.",
    fullDescription:
      "For over a thousand years Anuradhapura was the political and religious centre of the island. What survives is spread over a wide area: giant dagobas such as Ruwanwelisaya and Jetavanaramaya, monastery complexes, bathing ponds and carved guardstones.\n\nAt its heart is the Jaya Sri Maha Bodhi, an ancient tree venerated as grown from a cutting of the Bodhi tree in India. It remains one of the most important pilgrimage sites in the Buddhist world.\n\nThe site is best explored by bicycle or tuk-tuk over a full day, starting early to avoid the heat.",
    dressCode: `${TEMPLE_DRESS} White clothing is customary for pilgrims.`,
    safetyNotes: "Very hot from late morning. Stone surfaces at shrines get hot underfoot; carry socks.",
  },
  {
    slug: "polonnaruwa-ancient-city",
    name: "Polonnaruwa Ancient City",
    category: "heritage_site",
    lat: 7.9478,
    lng: 81.0012,
    district: "polonnaruwa",
    visitRadiusM: 3000,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A compact medieval royal capital of palaces, temples and stupas beside a vast reservoir, ending at Gal Vihara's serene Buddha figures carved from a single granite face.",
    fullDescription:
      "Polonnaruwa became the island's capital after Anuradhapura, and its ruins are more concentrated and easier to explore. The Quadrangle holds an extraordinary cluster of shrines and stupas within a short walk.\n\nThe highlight for many is Gal Vihara, where several large Buddha images, standing, seated and reclining, are carved from one long granite outcrop.\n\nThe Parakrama Samudra reservoir on the city's edge shows the scale of the irrigation works that supported these kingdoms.",
    dressCode: TEMPLE_DRESS,
    safetyNotes: "Cycling is popular; bring sun protection and plenty of water.",
  },
  {
    slug: "mihintale",
    name: "Mihintale",
    category: "temple",
    lat: 8.3507,
    lng: 80.5133,
    district: "anuradhapura",
    visitRadiusM: 1200,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "The hilltop where Buddhism is traditionally said to have been introduced to Sri Lanka, climbed by a long stone stairway to stupas and a rock with a sweeping view.",
    fullDescription:
      "Mihintale is honoured as the place where the monk Mahinda met King Devanampiya Tissa and brought Buddhism to the island. It is the focus of large pilgrimages at the June full moon (Poson).\n\nA broad granite staircase, shaded by frangipani trees, leads up past monastic ruins to the main terrace and stupas. The final scramble up Aradhana Gala rock gives a view across the forest towards Anuradhapura.\n\nIt makes an excellent half-day trip from Anuradhapura.",
    dressCode: TEMPLE_DRESS,
    safetyNotes: "Aradhana Gala is steep and exposed with only a handrail; avoid it in strong wind or rain.",
  },
  {
    slug: "minneriya-national-park",
    name: "Minneriya National Park",
    category: "national_park",
    lat: 8.0367,
    lng: 80.8817,
    district: "polonnaruwa",
    visitRadiusM: 10000,
    bestMonths: [6, 7, 8, 9, 10],
    shortDescription:
      "Woodland and grassland around an ancient reservoir where, in the dry season, large numbers of elephants gather on the receding shoreline to graze.",
    fullDescription:
      "Minneriya is built around a reservoir constructed in the ancient period. As the water drops in the dry months, fresh grass grows on the exposed bed and elephants move in from the surrounding forests.\n\nThis seasonal congregation, often called 'the Gathering', can bring together a remarkable number of elephants in one place.\n\nOutside the peak season, jeeps often go to nearby Kaudulla or Hurulu Eco Park instead, depending on where the herds are.",
    safetyNotes: "Visit only with a licensed safari jeep and stay in the vehicle.",
    checkCoords: true,
  },

  // ── Northern ─────────────────────────────────────────────────────────
  {
    slug: "jaffna-fort",
    name: "Jaffna Fort",
    category: "heritage_site",
    lat: 9.6618,
    lng: 80.0088,
    district: "jaffna",
    visitRadiusM: 700,
    bestMonths: NORTH,
    shortDescription:
      "A star-shaped coastal fort begun by the Portuguese and rebuilt by the Dutch, overlooking the Jaffna lagoon, with thick ramparts you can walk around.",
    fullDescription:
      "Jaffna Fort is one of the largest colonial forts on the island. Its pentagonal plan, moat and angled bastions are classic examples of European military design of the period.\n\nThe fort suffered heavy damage during the civil war and parts of it have since been restored. Walking the ramparts gives views over the lagoon and the city.\n\nLate afternoon light is beautiful here, and the nearby lagoon shore is a good place to watch the evening.",
  },
  {
    slug: "nallur-kandaswamy-kovil",
    name: "Nallur Kandaswamy Kovil",
    category: "temple",
    lat: 9.6747,
    lng: 80.0294,
    district: "jaffna",
    visitRadiusM: 500,
    bestMonths: NORTH,
    shortDescription:
      "Jaffna's most important Hindu temple, dedicated to Lord Murugan, with a golden gopuram gateway and a long annual festival that draws devotees from around the world.",
    fullDescription:
      "Nallur Kandaswamy Kovil is the spiritual heart of Tamil Hindu life in Jaffna. The present temple stands on a site associated with the old Jaffna kingdom, and its ornate gateway towers and gold-toned halls are striking.\n\nPujas take place several times a day, accompanied by drums, nadaswaram pipes and bells. The temple is known for its orderliness and strict punctuality.\n\nThe annual festival, held over several weeks around August, is one of the biggest religious events in the north.",
    dressCode: KOVIL_DRESS,
  },
  {
    slug: "casuarina-beach",
    name: "Casuarina Beach",
    category: "beach",
    lat: 9.7584,
    lng: 79.8869,
    district: "jaffna",
    visitRadiusM: 1200,
    bestMonths: [3, 4, 5, 6, 7, 8, 9],
    shortDescription:
      "A long, shallow, casuarina-fringed beach on Karainagar island, connected to Jaffna by causeway, popular with local families for paddling in calm water.",
    fullDescription:
      "Casuarina Beach is named for the feathery casuarina trees that line the back of the sand. The water stays shallow a long way out, which makes it popular for wading and family outings, especially at weekends.\n\nGetting there is part of the trip: the road crosses causeways over the lagoon with views of fishing stakes and wading birds.\n\nFacilities are basic, so bring water and shade.",
    safetyNotes: "Jellyfish occur at times; ask locally before swimming.",
    checkCoords: true,
  },

  // ── Eastern ──────────────────────────────────────────────────────────
  {
    slug: "koneswaram-temple",
    name: "Koneswaram Temple",
    category: "temple",
    lat: 8.5822,
    lng: 81.2453,
    district: "trincomalee",
    visitRadiusM: 800,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A Hindu temple dedicated to Shiva on Swami Rock, a clifftop headland above Trincomalee's harbour with dramatic sea views and a long history as a pilgrimage site.",
    fullDescription:
      "Koneswaram stands at the tip of the Fort Frederick peninsula, high above the sea. The site has been sacred for many centuries; the original temple was destroyed in the colonial period and the present temple was rebuilt in the twentieth century.\n\nThe approach passes through the fort grounds, where spotted deer wander freely. Behind the temple, a cliff edge known as Lovers' Leap drops straight into deep water.\n\nAt the right time of year, people sometimes spot whales offshore from the headland.",
    dressCode: KOVIL_DRESS,
    safetyNotes: "Cliff edges are high and partly unfenced.",
  },
  {
    slug: "pasikudah-beach",
    name: "Pasikudah Beach",
    category: "beach",
    lat: 7.9264,
    lng: 81.561,
    district: "batticaloa",
    visitRadiusM: 1500,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A wide, sheltered bay on the east coast where a protective reef keeps the water shallow and calm far from shore, ideal for gentle swimming in the dry season.",
    fullDescription:
      "Pasikudah's appeal is its calm: a reef offshore creates a large lagoon-like area where you can walk out a long way in waist-deep water.\n\nThe bay is backed by resort hotels along much of its length, while the neighbouring Kalkudah beach is wilder and quieter.\n\nThe east coast is at its best in the middle of the year, when the west and south are rainy.",
    safetyNotes: "Seas can be rough from about November to February during the north-east monsoon.",
  },
  {
    slug: "arugam-bay",
    name: "Arugam Bay",
    category: "beach",
    lat: 6.8403,
    lng: 81.8361,
    district: "ampara",
    visitRadiusM: 2000,
    bestMonths: [4, 5, 6, 7, 8, 9],
    shortDescription:
      "A laid-back surf village on the south-east coast, known for long right-hand point breaks, with lagoons and wildlife-rich wetlands just inland.",
    fullDescription:
      "Arugam Bay grew from a fishing village into one of Asia's well-known surf spots. The main point break peels along a rocky headland, and several other breaks up and down the coast suit different levels.\n\nEven if you do not surf, the bay is a relaxed place to stay a few days. Nearby lagoons such as Pottuvil and the area around Kumana are good for birds, crocodiles and occasionally elephants.\n\nThe season runs with the east coast's dry months; out of season the town is very quiet.",
    safetyNotes:
      "Reef and rocks under some breaks. Respect local surf etiquette and swim between the main beach's calmer areas only.",
  },
  {
    slug: "pigeon-island-national-park",
    name: "Pigeon Island National Park",
    category: "national_park",
    lat: 8.7215,
    lng: 81.2056,
    district: "trincomalee",
    visitRadiusM: 2500,
    bestMonths: [5, 6, 7, 8, 9],
    shortDescription:
      "A small marine national park off Nilaveli, reached by boat, with shallow coral reefs where snorkellers often see reef sharks, turtles and schools of fish.",
    fullDescription:
      "Pigeon Island is one of Sri Lanka's few marine national parks. The island itself is small and rocky; the attraction is the reef around it, much of it in shallow water accessible to snorkellers.\n\nBlacktip reef sharks, turtles and colourful reef fish are often seen. The island takes its name from the rock pigeons that nest there.\n\nCorals are fragile: do not stand on them, and use reef-safe sun protection or a rash guard.",
    safetyNotes:
      "Boats operate only in calm months. Wear a life jacket if you are not a confident swimmer, and avoid touching coral or sea life.",
    checkCoords: true,
  },

  // ── North Western ────────────────────────────────────────────────────
  {
    slug: "wilpattu-national-park",
    name: "Wilpattu National Park",
    category: "national_park",
    lat: 8.43,
    lng: 80.03,
    district: "puttalam",
    visitRadiusM: 15000,
    bestMonths: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    shortDescription:
      "Sri Lanka's largest national park: dense forest dotted with natural sand-rimmed lakes called villus, offering quieter safaris with chances of leopard and sloth bear.",
    fullDescription:
      "Wilpattu is known for its villus, natural lakes that collect rainwater and draw wildlife throughout the dry season. The forest is thicker than in Yala, so sightings take more patience, but the park is far less crowded.\n\nLeopards, sloth bears, elephants, deer and a wide range of birds live here. Full-day safaris let you reach the deeper lakes.\n\nThe park also has archaeological and legendary associations along its coastline.",
    safetyNotes: "Visit only with a licensed safari jeep. Roads inside are rough; expect a bumpy ride.",
    checkCoords: true,
  },
  {
    slug: "yapahuwa",
    name: "Yapahuwa Rock Fortress",
    category: "heritage_site",
    lat: 7.8207,
    lng: 80.311,
    district: "kurunegala",
    visitRadiusM: 900,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A short-lived thirteenth-century royal capital on a granite rock, with a steep ornamental stairway guarded by carved stone lions and a sweeping view from the top.",
    fullDescription:
      "Yapahuwa served briefly as a capital and, for a time, sheltered the tooth relic. Its showpiece is the ornamental stairway leading up to the former relic house: steep, finely carved, and flanked by stone lions in a distinctive style.\n\nBeyond the stairway, a path continues up the rock to the summit with views across the countryside.\n\nIt sees few visitors compared with the Cultural Triangle's big names, which is part of its charm.",
    dressCode: TEMPLE_DRESS,
    safetyNotes: "The upper path is steep and uneven; wear shoes with grip.",
  },
  {
    slug: "kalpitiya-lagoon",
    name: "Kalpitiya Lagoon",
    category: "wildlife",
    lat: 8.2333,
    lng: 79.7667,
    district: "puttalam",
    visitRadiusM: 5000,
    bestMonths: [11, 12, 1, 2, 3, 4],
    shortDescription:
      "A long sandy peninsula on the north-west coast between a lagoon and the open sea, known for spinner dolphin boat trips and steady winds for kitesurfing.",
    fullDescription:
      "The Kalpitiya peninsula is a world away from the busy south coast: fishing villages, sand tracks, mangroves and a broad shallow lagoon.\n\nIn the calmer months, boats head out early in the morning to look for spinner dolphins, sometimes in large pods. Later in the year, steady winds make the lagoon a popular kitesurfing spot.\n\nThe Bar Reef marine sanctuary lies offshore.",
    safetyNotes: "Choose boat operators who keep a respectful distance from dolphins and carry life jackets.",
    checkCoords: true,
  },
];
