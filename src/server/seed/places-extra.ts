// Third batch of seed places (before Phase 4), filling districts with little coverage:
// Kalutara, Gampaha, Kurunegala, Puttalam, Ratnapura, Kegalle, Monaragala, Ampara,
// Batticaloa, Mannar, Matale. Same rules: original text, no fees/hours/phones, unverified.
// Coordinates are cross-checked against Wikidata by scripts/fetch-place-photos.ts.
import type { SeedPlace } from "./places";

const TEMPLE_DRESS =
  "Cover shoulders and knees. Remove shoes and hats before entering shrine areas, and never pose with your back to a Buddha statue.";
const KOVIL_DRESS =
  "Dress modestly and remove shoes before entering. At some Hindu kovils men are asked to remove their shirts in the inner shrine.";

const SOUTH_WEST_DRY = [12, 1, 2, 3, 4];
const EAST_COAST_DRY = [4, 5, 6, 7, 8, 9];
const DRY_ZONE = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const UVA_HILLS = [1, 2, 3, 6, 7, 8, 9];

export const SEED_PLACES_EXTRA: SeedPlace[] = [
  // ── Western ──────────────────────────────────────────────────────────
  {
    slug: "kalutara-bodhiya",
    name: "Kalutara Bodhiya",
    category: "temple",
    lat: 6.5821,
    lng: 79.9617,
    district: "kalutara",
    visitRadiusM: 500,
    bestMonths: [],
    shortDescription:
      "A riverside temple beside the Galle road at Kalutara, known for its sacred bo tree and a large hollow stupa you can walk inside.",
    fullDescription:
      "Travellers on the coast road traditionally stop here to make an offering for a safe journey. The temple sits where the Kalu Ganga meets the sea.\n\nThe white stupa is unusual because it is hollow: inside, the walls and ceiling are painted with scenes from the life of the Buddha.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "Beside the main Galle road at the Kalutara bridge; buses on the coast road stop outside.",
  },
  {
    slug: "negombo-beach",
    name: "Negombo Beach",
    category: "beach",
    lat: 7.2167,
    lng: 79.836,
    district: "gampaha",
    visitRadiusM: 2000,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A long beach in the fishing town of Negombo, close to the international airport, where outrigger boats still land the morning catch.",
    fullDescription:
      "Negombo is many visitors' first or last stop in Sri Lanka thanks to its closeness to the airport. The beach is lined with hotels and restaurants.\n\nThe town has a strong Catholic heritage, a busy fish market and a Dutch-era canal running through it.",
    safetyNotes: "Swimming conditions vary; currents can be strong in the south-west monsoon.",
    howToGetThere:
      "A short drive from Bandaranaike International Airport; Negombo is also on the coastal railway north of Colombo.",
  },
  {
    slug: "colombo-lotus-tower",
    name: "Lotus Tower",
    category: "viewpoint",
    lat: 6.9272,
    lng: 79.8583,
    district: "colombo",
    visitRadiusM: 400,
    bestMonths: [],
    shortDescription:
      "Colombo's tall telecommunications tower, shaped like a lotus bud, with an observation deck looking out over the city, the lake and the sea.",
    fullDescription:
      "The Lotus Tower dominates the Colombo skyline and is lit in changing colours at night.\n\nIts observation deck gives a wide view over Beira Lake, the port and the coast. Evenings are popular for the sunset and city lights.",
    howToGetThere: "Beside Beira Lake near Colombo Fort; a short tuk-tuk ride from most of central Colombo.",
  },

  // ── Southern ─────────────────────────────────────────────────────────
  {
    slug: "bentota-beach",
    name: "Bentota Beach",
    category: "beach",
    lat: 6.42,
    lng: 79.996,
    district: "galle",
    visitRadiusM: 2000,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A wide golden beach where the Bentota river meets the sea, popular for resort stays, river safaris and water sports.",
    fullDescription:
      "Bentota's long sandy beach runs alongside a river lagoon, which makes it a base for boat trips through the mangroves as well as beach time.\n\nThe area is also associated with the architect Geoffrey Bawa, whose country garden at Lunuganga is nearby.",
    safetyNotes: "The sea can be rough during the south-west monsoon (roughly May–October).",
    howToGetThere: "On the coastal railway and Galle road south of Colombo; Bentota has its own station.",
    checkCoords: true,
  },
  {
    slug: "kirinda-temple",
    name: "Kirinda Temple",
    category: "temple",
    lat: 6.216,
    lng: 81.329,
    district: "hambantota",
    visitRadiusM: 500,
    bestMonths: [2, 3, 4, 5, 6, 7],
    shortDescription:
      "A small temple on a boulder above the fishing village of Kirinda, with sweeping views over the sea and the coast towards Yala.",
    fullDescription:
      "The temple at Kirinda is tied in local tradition to the story of Queen Viharamahadevi, said to have come ashore here.\n\nThe rocky summit looks out over the ocean and the scrubby coast that leads into Yala.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "In Kirinda village south of Tissamaharama; a short tuk-tuk ride from Tissa.",
    checkCoords: true,
  },

  // ── North Western ────────────────────────────────────────────────────
  {
    slug: "ridi-viharaya",
    name: "Ridi Viharaya",
    category: "temple",
    lat: 7.549,
    lng: 80.443,
    district: "kurunegala",
    visitRadiusM: 600,
    bestMonths: DRY_ZONE,
    shortDescription:
      "The 'Silver Temple', an ancient cave temple among rocky hills near Kurunegala, with a reclining Buddha and a rare tiled platform.",
    fullDescription:
      "Ridi Viharaya takes its name from a silver ore deposit said to have helped fund the building of a great stupa in Anuradhapura.\n\nThe cave shrines hold a large reclining Buddha, and one platform is decorated with imported ceramic tiles, an unusual detail in a Sri Lankan temple.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "North-east of Kurunegala near Ridigama; easiest by car or tuk-tuk from Kurunegala.",
    checkCoords: true,
  },
  {
    slug: "athugala",
    name: "Athugala (Elephant Rock)",
    category: "viewpoint",
    lat: 7.489,
    lng: 80.37,
    district: "kurunegala",
    visitRadiusM: 600,
    bestMonths: DRY_ZONE,
    shortDescription:
      "A huge granite rock overlooking Kurunegala town, topped by a giant white Buddha statue and wide views over the plains.",
    fullDescription:
      "Kurunegala is ringed by rock outcrops named after animals, and Athugala, the elephant rock, is the most famous.\n\nA road and steps lead to the summit, where a temple and a very large seated Buddha look out across the town and lake.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "Right above Kurunegala town; drive or tuk-tuk up the road to the summit.",
    checkCoords: true,
  },
  {
    slug: "panduwasnuwara",
    name: "Panduwasnuwara",
    category: "heritage_site",
    lat: 7.605,
    lng: 80.105,
    district: "kurunegala",
    visitRadiusM: 1000,
    bestMonths: DRY_ZONE,
    shortDescription:
      "Ruins of a medieval royal city in the countryside west of Kurunegala, with a moated citadel, palace foundations and monastery remains.",
    fullDescription:
      "Panduwasnuwara is one of the lesser-visited ancient capitals, which makes it a peaceful place to explore. A moat and walls surround the royal citadel.\n\nNearby are the remains of monasteries, stupas and a small museum.",
    howToGetThere: "West of Kurunegala via Wariyapola; best by car or tuk-tuk.",
    checkCoords: true,
  },
  {
    slug: "munneswaram-temple",
    name: "Munneswaram Temple",
    category: "temple",
    lat: 7.581,
    lng: 79.816,
    district: "puttalam",
    visitRadiusM: 500,
    bestMonths: [],
    shortDescription:
      "One of Sri Lanka's most important Shiva temples, near Chilaw, visited by both Hindu and Buddhist devotees and famous for its annual festival.",
    fullDescription:
      "Munneswaram is a large temple complex with a long history as a place of pilgrimage. Hindu and Buddhist worshippers share the site.\n\nIts annual festival draws large crowds from across the west coast.",
    dressCode: KOVIL_DRESS,
    howToGetThere: "Just east of Chilaw town; a short tuk-tuk ride from Chilaw station or bus stand.",
    checkCoords: true,
  },

  // ── Sabaragamuwa ─────────────────────────────────────────────────────
  {
    slug: "maha-saman-devale",
    name: "Maha Saman Devalaya",
    category: "temple",
    lat: 6.693,
    lng: 80.383,
    district: "ratnapura",
    visitRadiusM: 500,
    bestMonths: [1, 2, 3, 4, 8, 9],
    shortDescription:
      "Ratnapura's principal shrine, dedicated to the god Saman, guardian of Sri Pada, and the centre of a colourful annual perahera.",
    fullDescription:
      "The devalaya is closely tied to the Sri Pada pilgrimage, as Saman is regarded as the guardian deity of the sacred mountain.\n\nThe shrine sits by the Kalu Ganga just outside Ratnapura town.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "A short tuk-tuk ride from central Ratnapura.",
    checkCoords: true,
  },
  {
    slug: "kitulgala",
    name: "Kitulgala",
    category: "other",
    lat: 6.99,
    lng: 80.418,
    district: "kegalle",
    visitRadiusM: 2000,
    bestMonths: [1, 2, 3, 4, 5, 10, 11, 12],
    shortDescription:
      "A rainforest village on the Kelani River, Sri Lanka's best-known white-water rafting spot, with forest walks and birdwatching.",
    fullDescription:
      "Kitulgala sits in the wet zone between Colombo and the hill country. Rafting operators run trips down the river's rapids.\n\nThe surrounding forest is good for birds, and the river setting was famously used for filming a classic war movie.",
    safetyNotes:
      "Raft only with established operators who provide helmets and life jackets; river levels change quickly after rain.",
    howToGetThere: "On the Avissawella–Hatton road; buses between Colombo and Hatton pass through.",
  },

  // ── Uva ──────────────────────────────────────────────────────────────
  {
    slug: "kataragama-temple",
    name: "Kataragama Temple",
    category: "temple",
    lat: 6.418,
    lng: 81.333,
    district: "monaragala",
    visitRadiusM: 800,
    bestMonths: [5, 6, 7, 8],
    shortDescription:
      "A sacred complex in the southern jungle revered by Buddhists, Hindus, Muslims and the Vedda people, busiest during its summer festival.",
    fullDescription:
      "Kataragama is one of the island's most important multi-faith pilgrimage sites. The main shrine, dedicated to the god Kataragama (Skanda or Murugan), stands near a mosque and the Kiri Vehera stupa.\n\nEvening pujas are lively, with drumming, fruit offerings and crowds of devotees. Pilgrims often bathe in the Menik Ganga before worship.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "Kataragama town is reached by bus or car from Tissamaharama or Wellawaya.",
  },
  {
    slug: "buduruwagala",
    name: "Buduruwagala",
    category: "heritage_site",
    lat: 6.671,
    lng: 81.092,
    district: "monaragala",
    visitRadiusM: 800,
    bestMonths: UVA_HILLS,
    shortDescription:
      "A group of seven large figures carved into a rock face in quiet forest near Wellawaya, including the tallest standing Buddha image on the island.",
    fullDescription:
      "Buduruwagala's carvings show a central standing Buddha flanked by Mahayana bodhisattvas, a reminder of the variety of Buddhist traditions on the island.\n\nTraces of original plaster and paint survive on some figures. The setting, at the end of a forest track beside a small reservoir, is very peaceful.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "South of Wellawaya off the Tissamaharama road; tuk-tuks run from Wellawaya.",
    checkCoords: true,
  },
  {
    slug: "maligawila",
    name: "Maligawila Buddha",
    category: "heritage_site",
    lat: 6.743,
    lng: 81.348,
    district: "monaragala",
    visitRadiusM: 600,
    bestMonths: UVA_HILLS,
    shortDescription:
      "A towering standing Buddha carved from a single block of limestone, re-erected after centuries lying broken in the forest near Monaragala.",
    fullDescription:
      "The Maligawila statue is one of the largest freestanding ancient Buddha images in Sri Lanka. It was found fallen and broken, and was restored and stood upright again in the 20th century.\n\nA short walk away, an image of the bodhisattva Avalokiteshvara was also restored.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "South of Monaragala via Buttala; best by car or tuk-tuk.",
    checkCoords: true,
  },

  // ── Eastern ──────────────────────────────────────────────────────────
  {
    slug: "kumana-national-park",
    name: "Kumana National Park",
    category: "national_park",
    lat: 6.518,
    lng: 81.686,
    district: "ampara",
    visitRadiusM: 10000,
    bestMonths: [4, 5, 6, 7],
    shortDescription:
      "A remote park on the south-east coast, famous for the mangrove swamp where huge numbers of water birds nest each year.",
    fullDescription:
      "Kumana borders Yala's eastern side but sees far fewer visitors. Its lagoons and the Kumana villu draw large breeding colonies of storks, herons, ibises and pelicans.\n\nElephants, leopards and crocodiles also live here. Arugam Bay is the usual base.",
    safetyNotes: "Visit only with a licensed safari jeep and stay in the vehicle.",
    howToGetThere: "South of Arugam Bay via Panama; safari jeeps run from Arugam Bay and Panama.",
    checkCoords: true,
  },
  {
    slug: "batticaloa-fort",
    name: "Batticaloa Fort",
    category: "heritage_site",
    lat: 7.712,
    lng: 81.693,
    district: "batticaloa",
    visitRadiusM: 500,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A compact colonial fort on an island in the Batticaloa lagoon, its moss-covered walls surrounded on three sides by water.",
    fullDescription:
      "The Portuguese began the fort and the Dutch rebuilt it. Its walls, gateways and cannons stand beside the lagoon in the heart of Batticaloa.\n\nParts of the fort house government offices, so some areas may be closed.",
    howToGetThere: "In central Batticaloa on the lagoon island; walkable from the town centre.",
    checkCoords: true,
  },

  // ── Northern ─────────────────────────────────────────────────────────
  {
    slug: "mannar-fort",
    name: "Mannar Fort",
    category: "heritage_site",
    lat: 8.977,
    lng: 79.91,
    district: "mannar",
    visitRadiusM: 500,
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    shortDescription:
      "The walls of a colonial fort guarding the causeway onto Mannar Island, quiet and atmospheric beside the shallow strait.",
    fullDescription:
      "Mannar Fort was built by the Portuguese and later taken over by the Dutch. Its walls and bastions stand at the island end of the causeway from the mainland.\n\nThe island beyond is flat, dry and known for its birdlife, palmyra palms and ancient baobab trees.",
    howToGetThere:
      "At the entrance to Mannar town after crossing the causeway; buses and trains reach Mannar.",
    checkCoords: true,
  },
  {
    slug: "mannar-baobab",
    name: "Mannar Baobab Tree",
    category: "other",
    lat: 8.993,
    lng: 79.92,
    district: "mannar",
    visitRadiusM: 400,
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    shortDescription:
      "An enormous, centuries-old baobab tree on Mannar Island, believed to have been brought by Arab traders, with a trunk wider than a small room.",
    fullDescription:
      "Baobabs are native to Africa, and the giant tree at Pallimunai is thought to have arrived with seafaring traders long ago.\n\nIts massive trunk is the attraction; a fence protects it, but you can walk around it.",
    howToGetThere: "On Mannar Island near Pallimunai, a short tuk-tuk ride from Mannar town.",
    checkCoords: true,
  },
  {
    slug: "thiruketheeswaram",
    name: "Thiruketheeswaram Temple",
    category: "temple",
    lat: 8.956,
    lng: 79.963,
    district: "mannar",
    visitRadiusM: 500,
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    shortDescription:
      "An ancient Shiva temple near Mannar, one of the five great Shiva shrines of Sri Lanka, rebuilt after its destruction in the colonial era.",
    fullDescription:
      "Thiruketheeswaram is one of the Pancha Ishwarams, the five ancient abodes of Shiva revered by Hindus on the island. It stands near the old port of Mantai.\n\nThe temple is especially busy during the Maha Shivaratri festival.",
    dressCode: KOVIL_DRESS,
    howToGetThere: "On the mainland near Mantai, a short drive from the Mannar causeway.",
    checkCoords: true,
  },

  // ── Central ──────────────────────────────────────────────────────────
  {
    slug: "aluvihare-rock-temple",
    name: "Aluvihare Rock Temple",
    category: "temple",
    lat: 7.493,
    lng: 80.62,
    district: "matale",
    visitRadiusM: 500,
    bestMonths: DRY_ZONE,
    shortDescription:
      "A cave temple among boulders north of Matale, where Buddhist scriptures are traditionally said to have first been written down on palm leaves.",
    fullDescription:
      "Aluvihare holds an important place in Buddhist history: tradition says monks gathered here to commit the teachings to writing for the first time.\n\nThe caves contain shrines and vivid murals, and a small museum shows how palm-leaf manuscripts are made.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "Beside the Matale–Dambulla road just north of Matale town.",
    checkCoords: true,
  },
  {
    slug: "riverston",
    name: "Riverston",
    category: "viewpoint",
    lat: 7.526,
    lng: 80.738,
    district: "matale",
    visitRadiusM: 2000,
    bestMonths: [1, 2, 3, 6, 7, 8],
    shortDescription:
      "A windswept ridge on the edge of the Knuckles range, with grassy slopes, small waterfalls and views over the lowlands when the mist clears.",
    fullDescription:
      "Riverston is one of the more accessible corners of the Knuckles region. Short walks lead to viewpoints and the nearby Bambarakiri Ella waterfall.\n\nWeather changes fast here; clear mornings give the best views.",
    safetyNotes: "Strong winds and sudden mist; stay on paths near cliff edges.",
    howToGetThere: "East of Matale via Rattota; the road climbs steeply, so a car or tuk-tuk is easiest.",
    checkCoords: true,
  },
  {
    slug: "knuckles-range",
    name: "Knuckles Mountain Range",
    category: "national_park",
    lat: 7.45,
    lng: 80.8,
    district: "matale",
    visitRadiusM: 10000,
    bestMonths: [1, 2, 3, 6, 7, 8],
    shortDescription:
      "A rugged, protected mountain range north-east of Kandy, part of a World Heritage Site, with cloud forest, remote villages and multi-day treks.",
    fullDescription:
      "The Knuckles range takes its name from the shape of its peaks, said to resemble a clenched fist. Its forests hold many endemic plants and animals.\n\nTrekking with a local guide is the best way to explore, from short walks to overnight routes between villages.",
    safetyNotes: "Trek with a registered guide; leeches are common in wet months.",
    howToGetThere:
      "Trailheads are reached from Kandy or Matale via roads to Deanston, Corbet's Gap or Riverston.",
    checkCoords: true,
  },

  // ── Western (Gampaha) ────────────────────────────────────────────────
  {
    slug: "henarathgoda-botanical-garden",
    name: "Henarathgoda Botanical Garden",
    category: "garden",
    lat: 7.088,
    lng: 80.018,
    district: "gampaha",
    visitRadiusM: 500,
    bestMonths: [],
    shortDescription:
      "Botanic gardens in Gampaha, historically linked to the first rubber seedlings grown in Asia, with shady avenues of old trees.",
    fullDescription:
      "Henarathgoda is quieter than Peradeniya and an easy outing from Colombo. Its tall trees, palms and lawns make it a pleasant escape from the heat.\n\nThe garden is known for its role in introducing rubber to the region.",
    howToGetThere: "In Gampaha town, a short walk or tuk-tuk ride from Gampaha railway station.",
    checkCoords: true,
  },
];
