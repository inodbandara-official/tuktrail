// Additional seed places around major traveller bases (added in Phase 3 at the owner's request).
// Same rules as places.ts: original text, no fees/hours/phone numbers, everything unverified,
// `checkCoords` where coordinates are approximate.
import type { SeedPlace } from "./places";

const TEMPLE_DRESS =
  "Cover shoulders and knees. Remove shoes and hats before entering shrine areas, and never pose with your back to a Buddha statue.";
const KOVIL_DRESS =
  "Dress modestly and remove shoes before entering. At some Hindu kovils men are asked to remove their shirts in the inner shrine.";
const MOSQUE_DRESS =
  "Dress modestly, covering arms and legs; women may be asked to cover their hair. Remove shoes before entering and avoid prayer times.";

const SOUTH_WEST_DRY = [12, 1, 2, 3, 4];
const EAST_COAST_DRY = [4, 5, 6, 7, 8, 9];
const CULTURAL_TRIANGLE = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const HILL_COUNTRY = [1, 2, 3, 4];
const UVA_HILLS = [1, 2, 3, 6, 7, 8, 9];
const NORTH = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const SEED_PLACES_MORE: SeedPlace[] = [
  // ── Anuradhapura ─────────────────────────────────────────────────────
  {
    slug: "ruwanwelisaya",
    name: "Ruwanwelisaya",
    category: "temple",
    lat: 8.35,
    lng: 80.3964,
    district: "anuradhapura",
    visitRadiusM: 600,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A gleaming white dagoba in Anuradhapura's sacred city, ringed by a wall of carved elephants and busy with white-clad pilgrims from dawn to dusk.",
    fullDescription:
      "Ruwanwelisaya is one of the most venerated stupas in the Buddhist world and the most active of Anuradhapura's great dagobas. Its huge white dome rises from a raised terrace whose outer wall is lined with sculpted elephants.\n\nPilgrims circle the stupa clockwise with flowers, oil lamps and long cloth offerings. Evenings are especially atmospheric, when the dome is lit and chanting carries across the terrace.",
    dressCode: `${TEMPLE_DRESS} White clothing is customary for pilgrims.`,
    safetyNotes: "The stone terrace gets very hot by midday; carry socks for walking barefoot.",
    howToGetThere:
      "Inside the Anuradhapura sacred area, a short walk or cycle from the Sri Maha Bodhi. Tuk-tuks wait near the main entrances; many visitors hire a bicycle in town.",
  },
  {
    slug: "jetavanaramaya",
    name: "Jetavanaramaya",
    category: "heritage_site",
    lat: 8.3515,
    lng: 80.4035,
    district: "anuradhapura",
    visitRadiusM: 600,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A colossal brick stupa, once among the tallest structures of the ancient world, rising red-brown above the ruins of a vast monastery.",
    fullDescription:
      "Jetavanaramaya is built almost entirely of brick, and its sheer bulk is hard to take in until you stand at its base. The surrounding monastery grounds hold stone pillars, image houses and carved doorways.\n\nUnlike the whitewashed Ruwanwelisaya, Jetavanaramaya has been conserved with its brickwork exposed, giving a sense of how the great stupas were built.",
    dressCode: TEMPLE_DRESS,
    howToGetThere:
      "On the eastern side of the sacred city, easy to combine with Ruwanwelisaya by bicycle or tuk-tuk.",
  },
  {
    slug: "abhayagiri-dagoba",
    name: "Abhayagiri Dagoba",
    category: "heritage_site",
    lat: 8.3709,
    lng: 80.3953,
    district: "anuradhapura",
    visitRadiusM: 900,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "The centrepiece of a once-great monastery in Anuradhapura's northern forest, with moonstones, guardstones and ponds scattered among the trees.",
    fullDescription:
      "Abhayagiri was the seat of one of the most influential monastic communities of ancient Sri Lanka. Its huge stupa stands among shady woodland dotted with ruins.\n\nNearby you can find some of the finest carved moonstones and guardstones on the island, and a museum that helps explain the monastery's history. The area is quieter than the southern part of the sacred city.",
    dressCode: TEMPLE_DRESS,
    howToGetThere:
      "In the northern part of the sacred city. Cycling the loop from the Sri Maha Bodhi through Abhayagiri and Kuttam Pokuna is a popular half-day route.",
  },
  {
    slug: "isurumuniya",
    name: "Isurumuniya Rock Temple",
    category: "temple",
    lat: 8.3377,
    lng: 80.3864,
    district: "anuradhapura",
    visitRadiusM: 500,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A small rock temple beside a lotus pond, known for its delicate stone carvings, including the much-loved figures of the 'Isurumuniya Lovers'.",
    fullDescription:
      "Isurumuniya is built against a boulder overlooking a pond, where carved elephants appear to bathe in the rock face. A small museum displays some of the finest carvings associated with the site.\n\nSteps lead up to the top of the rock, a good spot for sunset over the nearby Tissa Wewa reservoir.",
    dressCode: TEMPLE_DRESS,
    howToGetThere:
      "South-west of the main sacred area, a short tuk-tuk or bicycle ride from the Sri Maha Bodhi.",
  },
  {
    slug: "kuttam-pokuna",
    name: "Kuttam Pokuna (Twin Ponds)",
    category: "heritage_site",
    lat: 8.3773,
    lng: 80.3958,
    district: "anuradhapura",
    visitRadiusM: 500,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A pair of elegantly stepped stone bathing ponds built for the monks of Abhayagiri, a fine example of ancient Sri Lankan hydraulic craftsmanship.",
    fullDescription:
      "The twin ponds sit side by side in the woods north of Abhayagiri. Water was channelled in through underground conduits and filtered before reaching the pools.\n\nLook for the carved water spouts and the five-headed cobra figure near the larger pond.",
    howToGetThere: "At the northern edge of the Abhayagiri monastery complex; easiest by bicycle or tuk-tuk.",
  },

  // ── Colombo ──────────────────────────────────────────────────────────
  {
    slug: "viharamahadevi-park",
    name: "Viharamahadevi Park",
    category: "garden",
    lat: 6.9137,
    lng: 79.8614,
    district: "colombo",
    visitRadiusM: 600,
    bestMonths: [],
    shortDescription:
      "Colombo's largest public park, a shady green space in front of the Town Hall with a large Buddha statue, fountains and children's play areas.",
    fullDescription:
      "Viharamahadevi Park is where Colombo comes to breathe. Big rain trees shade the lawns and paths, and families gather here in the evenings and at weekends.\n\nThe park sits between the white-domed Town Hall and the National Museum, so it's easy to fold into a day of sightseeing.",
    howToGetThere:
      "In Cinnamon Gardens, central Colombo, opposite the Town Hall. Buses and tuk-tuks stop around its edges.",
  },
  {
    slug: "independence-memorial-hall",
    name: "Independence Memorial Hall",
    category: "heritage_site",
    lat: 6.904,
    lng: 79.8686,
    district: "colombo",
    visitRadiusM: 500,
    bestMonths: [],
    shortDescription:
      "A grand open pavilion built to mark Sri Lanka's independence, its design inspired by the royal audience hall of Kandy.",
    fullDescription:
      "The memorial hall stands at the head of Independence Square, surrounded by lawns and walking paths that fill with joggers early in the morning and in the evening.\n\nIts carved stone columns and tiered roof echo Kandyan architecture. A small museum beneath the hall covers the independence era.",
    howToGetThere: "In Cinnamon Gardens, Colombo 7, a short tuk-tuk ride from Viharamahadevi Park.",
  },
  {
    slug: "red-mosque-colombo",
    name: "Jami Ul-Alfar Mosque (Red Mosque)",
    category: "heritage_site",
    lat: 6.9387,
    lng: 79.8509,
    district: "colombo",
    visitRadiusM: 300,
    bestMonths: [],
    shortDescription:
      "A striking red-and-white candy-striped mosque in the crowded market streets of Pettah, one of Colombo's most photographed buildings.",
    fullDescription:
      "The Red Mosque rises above the bustle of Pettah's wholesale markets, its patterned brickwork and domes impossible to miss.\n\nIt remains an active place of worship. Pettah's surrounding streets are worth exploring on foot for spices, textiles and street food.",
    dressCode: MOSQUE_DRESS,
    safetyNotes: "Pettah's streets are very crowded; keep valuables secure.",
    howToGetThere: "In Pettah on Second Cross Street, a short walk from Colombo Fort railway station.",
  },
  {
    slug: "seema-malaka",
    name: "Seema Malaka",
    category: "temple",
    lat: 6.917,
    lng: 79.8565,
    district: "colombo",
    visitRadiusM: 400,
    bestMonths: [],
    shortDescription:
      "A serene meditation pavilion floating on Beira Lake, linked by walkways and lined with seated Buddha statues, especially lovely at dusk.",
    fullDescription:
      "Seema Malaka sits on platforms in Beira Lake and is managed by the nearby Gangaramaya Temple. Its clean lines and open wooden pavilions make it calmer than its famous parent temple.\n\nThe walk across the water and the view of the city skyline behind make it a favourite for evening photographs.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "On Beira Lake, a few minutes' walk from Gangaramaya Temple.",
  },
  {
    slug: "mount-lavinia-beach",
    name: "Mount Lavinia Beach",
    category: "beach",
    lat: 6.839,
    lng: 79.863,
    district: "colombo",
    visitRadiusM: 1200,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "Colombo's nearest proper beach: a long strip of sand south of the city, lined with seafood restaurants and best at sunset.",
    fullDescription:
      "Mount Lavinia is where city residents head for a beach evening. The sand runs past a historic seafront hotel on its headland, and simple restaurants set tables close to the water after dark.\n\nIt's more of a place to eat, walk and watch the sunset than a swimming beach.",
    safetyNotes:
      "Currents can be strong, especially during the south-west monsoon. Swim with caution or not at all.",
    howToGetThere:
      "South of central Colombo. Mount Lavinia railway station on the coastal line is a short walk from the sand.",
  },
  {
    slug: "dutch-hospital-colombo",
    name: "Old Dutch Hospital",
    category: "heritage_site",
    lat: 6.9339,
    lng: 79.8434,
    district: "colombo",
    visitRadiusM: 300,
    bestMonths: [],
    shortDescription:
      "One of Colombo's oldest buildings, a restored colonial-era hospital in the Fort district now home to restaurants and shops around shady courtyards.",
    fullDescription:
      "The Old Dutch Hospital's thick walls, verandas and courtyards survive in the middle of Colombo's business district. Restored as a dining and shopping precinct, it's a pleasant place to escape the heat.\n\nIt pairs well with a walk around the Fort area's other colonial buildings.",
    howToGetThere: "In Colombo Fort, a short walk from the Fort railway station.",
  },

  // ── Jaffna ───────────────────────────────────────────────────────────
  {
    slug: "jaffna-public-library",
    name: "Jaffna Public Library",
    category: "heritage_site",
    lat: 9.6619,
    lng: 80.0134,
    district: "jaffna",
    visitRadiusM: 400,
    bestMonths: NORTH,
    shortDescription:
      "An elegant white library building near Jaffna Fort, rebuilt after its destruction in 1981 and now a powerful symbol of the north's cultural life.",
    fullDescription:
      "The library's graceful domed building stands in landscaped grounds near the fort. Its burning in 1981 destroyed a huge collection of irreplaceable manuscripts and books, and its restoration carries deep meaning for the people of Jaffna.\n\nIt's a working library, so visit quietly and respectfully.",
    howToGetThere: "In central Jaffna, a short walk from Jaffna Fort and the clock tower.",
  },
  {
    slug: "keerimalai-springs",
    name: "Keerimalai Springs",
    category: "other",
    lat: 9.816,
    lng: 80.006,
    district: "jaffna",
    visitRadiusM: 600,
    bestMonths: NORTH,
    shortDescription:
      "Freshwater springs on the northern coast, held sacred and channelled into seaside bathing pools beside an ancient Shiva temple.",
    fullDescription:
      "Keerimalai's springs rise right beside the sea, and pilgrims and locals come to bathe in the stone-walled pools, believed to have healing properties.\n\nThe nearby Naguleswaram Kovil is one of the island's important Shiva temples.",
    dressCode: "Bathing areas are separated for men and women; dress modestly.",
    howToGetThere:
      "On the north coast of the Jaffna peninsula, reachable by bus or tuk-tuk from Jaffna town.",
  },
  {
    slug: "point-pedro",
    name: "Point Pedro (Sakkotai Cape)",
    category: "viewpoint",
    lat: 9.8355,
    lng: 80.2125,
    district: "jaffna",
    visitRadiusM: 1500,
    bestMonths: NORTH,
    shortDescription:
      "The northernmost tip of Sri Lanka, a quiet stretch of rocky shore near the fishing town of Point Pedro, marked by a small cape monument.",
    fullDescription:
      "There isn't much to 'do' at Point Pedro, and that's the point: fishing boats, a lighthouse, wind off the sea and the feeling of standing at the very top of the island.\n\nThe drive there crosses the flat, palmyra-dotted landscape of the Jaffna peninsula.",
    howToGetThere:
      "At the north-eastern tip of the Jaffna peninsula. Buses run from Jaffna town to Point Pedro.",
    checkCoords: true,
  },
  {
    slug: "nainativu-nagapooshani-amman",
    name: "Nainativu Nagapooshani Amman Kovil",
    category: "temple",
    lat: 9.626,
    lng: 79.7737,
    district: "jaffna",
    visitRadiusM: 800,
    bestMonths: NORTH,
    shortDescription:
      "A colourful Hindu temple on the small island of Nainativu, reached by ferry, which shares the island with an important Buddhist shrine.",
    fullDescription:
      "Nainativu is sacred to both Hindus and Buddhists. The Nagapooshani Amman Kovil, with its tall decorated gopuram, draws pilgrims from across Sri Lanka and beyond. A short walk away, the Nagadeepa Vihara is revered by Buddhists.\n\nThe ferry ride across the shallow lagoon waters is part of the experience.",
    dressCode: KOVIL_DRESS,
    howToGetThere:
      "Drive or bus across the causeways from Jaffna to Kurikadduwan jetty on Punkudutivu, then take the ferry to Nainativu.",
    checkCoords: true,
  },

  // ── Galle ────────────────────────────────────────────────────────────
  {
    slug: "unawatuna-beach",
    name: "Unawatuna Beach",
    category: "beach",
    lat: 6.0098,
    lng: 80.2496,
    district: "galle",
    visitRadiusM: 1000,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A sheltered, crescent-shaped bay just east of Galle, with calm water in season and a lively strip of cafés and guesthouses.",
    fullDescription:
      "Unawatuna's bay is protected by a reef, which usually keeps the water gentle in the dry season and makes it one of the south coast's most popular swimming beaches.\n\nA small temple sits on rocks at the western end, and walking trails lead over the headland to quieter coves.",
    safetyNotes: "Seas get rough during the south-west monsoon (roughly May–October).",
    howToGetThere:
      "A short tuk-tuk ride from Galle along the coast road; buses towards Matara stop at the Unawatuna junction.",
  },
  {
    slug: "jungle-beach-galle",
    name: "Jungle Beach",
    category: "beach",
    lat: 6.0187,
    lng: 80.239,
    district: "galle",
    visitRadiusM: 600,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A small cove tucked beneath the forested Rumassala headland, reached by a short walk through the trees and good for snorkelling in calm weather.",
    fullDescription:
      "Jungle Beach feels hidden away, though it can get busy on weekends. Trees come down almost to the water, and on calm days the clear water is good for snorkelling.\n\nA path links it with the Japanese Peace Pagoda on the hill above.",
    safetyNotes: "Facilities are limited and the path down is steep in places.",
    howToGetThere:
      "Signposted from the Rumassala road near Unawatuna; a short walk down from the end of the road.",
    checkCoords: true,
  },
  {
    slug: "japanese-peace-pagoda-rumassala",
    name: "Japanese Peace Pagoda, Rumassala",
    category: "viewpoint",
    lat: 6.0178,
    lng: 80.2381,
    district: "galle",
    visitRadiusM: 500,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A white peace pagoda on the Rumassala hill overlooking Galle harbour and the fort, with wide views across the bay at sunset.",
    fullDescription:
      "The pagoda was built by Japanese monks as one of many peace pagodas around the world. Its terraces look out over the sea towards Galle Fort.\n\nIt's a peaceful spot in the late afternoon, and combines well with a visit to Jungle Beach below.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "On the Rumassala headland between Galle and Unawatuna, reachable by tuk-tuk.",
    checkCoords: true,
  },
  {
    slug: "galle-lighthouse",
    name: "Galle Lighthouse",
    category: "viewpoint",
    lat: 6.0242,
    lng: 80.2193,
    district: "galle",
    visitRadiusM: 400,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "The white lighthouse at the south-eastern corner of Galle Fort's ramparts, one of the most recognisable sights in the old town.",
    fullDescription:
      "Galle's lighthouse rises above the fort walls next to a small beach and the Meeran Mosque. The ramparts around it are a classic spot for photographs and sunset walks.\n\nThe lighthouse is usually admired from outside rather than climbed.",
    howToGetThere: "Inside Galle Fort, at the end of Lighthouse Street. Walkable from anywhere in the fort.",
  },
  {
    slug: "hikkaduwa-beach",
    name: "Hikkaduwa Beach",
    category: "beach",
    lat: 6.139,
    lng: 80.101,
    district: "galle",
    visitRadiusM: 1500,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A long, busy beach town north of Galle, known for surf breaks, a shallow coral reef and sea turtles that feed close to shore.",
    fullDescription:
      "Hikkaduwa has been a traveller favourite for decades. The beach runs for kilometres, with a reef that shelters a lagoon-like stretch for snorkelling.\n\nTurtles are often seen in the shallows. Please don't feed or touch them, however common the practice looks.",
    safetyNotes: "Rough seas and currents in the south-west monsoon. Don't touch turtles or coral.",
    howToGetThere:
      "On the coastal road and railway between Colombo and Galle; Hikkaduwa has its own station.",
  },

  // ── Matara ───────────────────────────────────────────────────────────
  {
    slug: "dondra-lighthouse",
    name: "Dondra Head Lighthouse",
    category: "viewpoint",
    lat: 5.92,
    lng: 80.5893,
    district: "matara",
    visitRadiusM: 600,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A tall white lighthouse on Dondra Head, the southernmost point of Sri Lanka, looking out over open ocean towards Antarctica.",
    fullDescription:
      "Dondra Head is where the island ends. The lighthouse stands among coconut palms near the cape, with rocky shore and waves below.\n\nThe nearby town of Dondra is also known for its historic Devinuwara temple.",
    howToGetThere: "A few kilometres east of Matara town, off the coastal road. Tuk-tuks run from Matara.",
    checkCoords: true,
  },
  {
    slug: "paravi-duwa-temple",
    name: "Paravi Duwa Temple",
    category: "temple",
    lat: 5.9437,
    lng: 80.548,
    district: "matara",
    visitRadiusM: 400,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A small Buddhist temple on a rocky islet just off Matara's beach, reached by a suspension footbridge.",
    fullDescription:
      "The temple on 'Pigeon Island' (Paravi Duwa) is a short, pleasant stop in Matara. The footbridge sways gently above the water on the way across.\n\nIt's a good place to watch the waves and the life of Matara's seafront.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "On the seafront in Matara town, near the main beach; walkable from the town centre.",
    checkCoords: true,
  },
  {
    slug: "weligama-bay",
    name: "Weligama Bay",
    category: "beach",
    lat: 5.973,
    lng: 80.429,
    district: "matara",
    visitRadiusM: 1500,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A wide, gently curving bay with soft, consistent waves, one of the most popular places in Sri Lanka to learn to surf.",
    fullDescription:
      "Weligama's long sandy bay has beginner-friendly waves for much of the season, and surf schools line the beach.\n\nYou may also see stilt fishermen along this stretch of coast, though many now pose for photographs rather than fish.",
    safetyNotes: "Board traffic can be heavy; stay clear of surf lessons if you're swimming.",
    howToGetThere: "On the coastal road and railway between Galle and Matara; Weligama has its own station.",
  },
  {
    slug: "coconut-tree-hill",
    name: "Coconut Tree Hill",
    category: "viewpoint",
    lat: 5.9395,
    lng: 80.4614,
    district: "matara",
    visitRadiusM: 400,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "A small headland near Mirissa covered in tall coconut palms, famous for sunrise and sunset photographs over the ocean.",
    fullDescription:
      "The palm-covered headland has become one of the south coast's most photographed spots. Early morning is the quietest time to visit.\n\nThe ground is private land in places; follow local signs and be considerate.",
    safetyNotes: "Cliff edges are unfenced.",
    howToGetThere: "At the eastern end of Mirissa; walkable from Mirissa beach along the coast.",
    checkCoords: true,
  },

  // ── Ella & Badulla ───────────────────────────────────────────────────
  {
    slug: "little-adams-peak",
    name: "Little Adam's Peak",
    category: "hike",
    lat: 6.8663,
    lng: 81.061,
    district: "badulla",
    visitRadiusM: 1000,
    bestMonths: UVA_HILLS,
    shortDescription:
      "An easy, rewarding walk from Ella through tea gardens to a grassy summit with sweeping views over the Ella Gap.",
    fullDescription:
      "Little Adam's Peak is the gentlest of Ella's classic hikes. A clear path leads through tea estates and up a final set of steps to the ridge.\n\nThe views stretch over hills and down to the plains. Sunrise and late afternoon are the best times.",
    safetyNotes: "Some steps are steep; take care in wet weather.",
    howToGetThere:
      "Walk from Ella town along the Passara road; the trail starts beside a hotel entrance and is signposted.",
  },
  {
    slug: "dunhinda-falls",
    name: "Dunhinda Falls",
    category: "waterfall",
    lat: 7.0153,
    lng: 81.0574,
    district: "badulla",
    visitRadiusM: 600,
    bestMonths: [10, 11, 12, 1, 2],
    shortDescription:
      "A tall, misty waterfall north of Badulla, reached by a forest path and named for the fine spray it throws into the air.",
    fullDescription:
      "Dunhinda's name refers to the smoky mist that rises from the falls. A walking path through forest leads from the road to a viewing platform.\n\nThe falls are most impressive after the rains.",
    safetyNotes: "The path can be slippery; don't climb on rocks near the falls.",
    howToGetThere: "North of Badulla town; a short drive or tuk-tuk ride, then a walk down to the falls.",
  },
  {
    slug: "muthiyangana-temple",
    name: "Muthiyangana Raja Maha Vihara",
    category: "temple",
    lat: 6.9846,
    lng: 81.0556,
    district: "badulla",
    visitRadiusM: 400,
    bestMonths: UVA_HILLS,
    shortDescription:
      "An ancient and much-revered temple in the heart of Badulla, one of the sixteen great Buddhist pilgrimage sites of Sri Lanka.",
    fullDescription:
      "Muthiyangana is one of the solosmasthana, the sixteen sacred places traditionally associated with visits by the Buddha. Its white stupa and shrine rooms sit within Badulla town.\n\nThe temple is busy on full moon days, when devotees come with flowers and oil lamps.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "In Badulla town, a short walk from the town centre.",
  },
  {
    slug: "diyaluma-falls",
    name: "Diyaluma Falls",
    category: "waterfall",
    lat: 6.7322,
    lng: 81.0298,
    district: "badulla",
    visitRadiusM: 1500,
    bestMonths: [1, 2, 3, 6, 7, 8],
    shortDescription:
      "One of Sri Lanka's highest waterfalls, plunging off an escarpment near Koslanda, with natural rock pools at the top reached on foot.",
    fullDescription:
      "Diyaluma drops in one long ribbon from the cliff edge, visible from the main road. A trail climbs to the upper falls, where a series of pools sits right above the drop.\n\nThe views from the top are spectacular, but the edges are dangerous.",
    safetyNotes:
      "The upper pools are close to a sheer drop. Stay well back from the edge and avoid the pools after rain or if the water is high.",
    howToGetThere:
      "Beside the Haputale–Wellawaya road near Koslanda. Many visitors come by tuk-tuk or car from Ella or Haputale.",
    checkCoords: true,
  },

  // ── Kandy ────────────────────────────────────────────────────────────
  {
    slug: "bahirawakanda-buddha",
    name: "Bahirawakanda Buddha Statue",
    category: "viewpoint",
    lat: 7.2935,
    lng: 80.629,
    district: "kandy",
    visitRadiusM: 400,
    bestMonths: [1, 2, 3, 4, 7, 8],
    shortDescription:
      "A large white seated Buddha on a hilltop above Kandy, visible across the city, with panoramic views over the lake and surrounding hills.",
    fullDescription:
      "The Bahirawakanda statue watches over Kandy from its ridge. The temple terrace gives one of the best views over the city, the lake and the Temple of the Tooth.\n\nIt's a steep walk up, or a short tuk-tuk ride.",
    dressCode: TEMPLE_DRESS,
    howToGetThere:
      "On the hill west of central Kandy; a steep walk or quick tuk-tuk ride from the town centre.",
  },
  {
    slug: "kandy-lake",
    name: "Kandy Lake",
    category: "lake",
    lat: 7.2925,
    lng: 80.642,
    district: "kandy",
    visitRadiusM: 800,
    bestMonths: [1, 2, 3, 4, 7, 8],
    shortDescription:
      "The ornamental lake at the heart of Kandy, built by the last king of Kandy, with a shady lakeside walk past the Temple of the Tooth.",
    fullDescription:
      "Kandy Lake gives the city its shape. A footpath runs around the shore beneath large trees, passing the Temple of the Tooth and the old royal buildings.\n\nThe low cloud-patterned wall along the north shore is a well-known detail. Walk the loop in the early morning or at dusk.",
    howToGetThere: "In central Kandy; the lakeside path starts a few minutes' walk from the clock tower.",
  },
  {
    slug: "udawattakele-forest",
    name: "Udawattakele Forest Reserve",
    category: "national_park",
    lat: 7.2985,
    lng: 80.642,
    district: "kandy",
    visitRadiusM: 1000,
    bestMonths: [1, 2, 3, 4, 7, 8],
    shortDescription:
      "A protected forest on the hill behind the Temple of the Tooth, once the royal pleasure garden, with walking trails, birds and monkeys.",
    fullDescription:
      "Udawattakele is a pocket of forest right on Kandy's doorstep. Trails wind through tall trees past a small pond and hermitages used by meditating monks.\n\nIt's a good place for birdwatching early in the morning.",
    safetyNotes: "Walk in daylight and preferably with company; monkeys can snatch food.",
    howToGetThere: "Entrance a short walk uphill from the Temple of the Tooth, north of Kandy Lake.",
    checkCoords: true,
  },
  {
    slug: "gadaladeniya-temple",
    name: "Gadaladeniya Temple",
    category: "temple",
    lat: 7.2614,
    lng: 80.5598,
    district: "kandy",
    visitRadiusM: 400,
    bestMonths: [1, 2, 3, 4, 7, 8],
    shortDescription:
      "A 14th-century stone temple on a rocky outcrop west of Kandy, showing strong South Indian architectural influence.",
    fullDescription:
      "Gadaladeniya is built largely of stone, unusual among Sri Lankan temples, and its design reflects South Indian styles of the period.\n\nIt's often visited with Lankatilaka and Embekke as part of a 'three temples' loop from Kandy.",
    dressCode: TEMPLE_DRESS,
    howToGetThere:
      "West of Kandy near Pilimatalawa. Easiest by tuk-tuk or car as part of the three-temples loop.",
    checkCoords: true,
  },
  {
    slug: "lankatilaka-temple",
    name: "Lankatilaka Temple",
    category: "temple",
    lat: 7.2584,
    lng: 80.5629,
    district: "kandy",
    visitRadiusM: 400,
    bestMonths: [1, 2, 3, 4, 7, 8],
    shortDescription:
      "A tall, whitewashed image house perched on a rock in the hills west of Kandy, with painted interiors and wide views.",
    fullDescription:
      "Lankatilaka stands on a granite outcrop, its multi-storey shrine visible from afar. Inside, murals and statues fill the image house.\n\nThe climb up the rock-cut steps offers views across paddy fields and hills.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "Near Gadaladeniya, west of Kandy; part of the three-temples loop by tuk-tuk or car.",
    checkCoords: true,
  },
  {
    slug: "embekke-devale",
    name: "Embekke Devale",
    category: "heritage_site",
    lat: 7.238,
    lng: 80.573,
    district: "kandy",
    visitRadiusM: 400,
    bestMonths: [1, 2, 3, 4, 7, 8],
    shortDescription:
      "A shrine famous for its intricately carved wooden pillars, each decorated with dancers, wrestlers, animals and mythical creatures.",
    fullDescription:
      "Embekke's drummers' hall is a masterpiece of Kandyan woodcarving. Every pillar carries a different design, and it's worth looking closely at each one.\n\nThe village setting is quiet and rural.",
    dressCode: TEMPLE_DRESS,
    howToGetThere: "South-west of Kandy; the third stop on the three-temples loop, best by tuk-tuk or car.",
    checkCoords: true,
  },

  // ── Nuwara Eliya ─────────────────────────────────────────────────────
  {
    slug: "victoria-park-nuwara-eliya",
    name: "Victoria Park",
    category: "garden",
    lat: 6.97,
    lng: 80.769,
    district: "nuwara_eliya",
    visitRadiusM: 500,
    bestMonths: HILL_COUNTRY,
    shortDescription:
      "A neat colonial-era park in the centre of Nuwara Eliya with flower beds, lawns and a stream, at its most colourful in the April season.",
    fullDescription:
      "Victoria Park is a calm green space in the middle of the hill station. Flower beds and old trees line its paths, and birdwatchers come for highland species.\n\nIt's busiest during the April holiday season.",
    howToGetThere: "In central Nuwara Eliya, beside the main road and a short walk from the bus stand.",
  },
  {
    slug: "hakgala-botanical-garden",
    name: "Hakgala Botanical Garden",
    category: "garden",
    lat: 6.9265,
    lng: 80.8198,
    district: "nuwara_eliya",
    visitRadiusM: 800,
    bestMonths: HILL_COUNTRY,
    shortDescription:
      "Terraced cool-climate gardens on the slopes below Hakgala rock, with rose gardens, ferns and highland forest views.",
    fullDescription:
      "Hakgala's gardens climb a hillside beneath a striking rock face. Roses, temperate plants and tree ferns thrive in the cool air.\n\nMist often drifts through in the afternoon, which adds to the atmosphere.",
    howToGetThere:
      "On the road from Nuwara Eliya towards Welimada; buses and tuk-tuks run from Nuwara Eliya.",
  },
  {
    slug: "seetha-amman-temple",
    name: "Seetha Amman Temple",
    category: "temple",
    lat: 6.9235,
    lng: 80.816,
    district: "nuwara_eliya",
    visitRadiusM: 400,
    bestMonths: HILL_COUNTRY,
    shortDescription:
      "A small, brightly painted Hindu temple beside a stream near Hakgala, linked by tradition to Sita from the Ramayana.",
    fullDescription:
      "Local tradition associates this area with Sita's captivity in the Ramayana, and the temple draws many pilgrims, especially from India.\n\nThe colourful shrine sits beside a stream in a quiet valley.",
    dressCode: KOVIL_DRESS,
    howToGetThere: "Beside the Nuwara Eliya–Welimada road, close to Hakgala Botanical Garden.",
    checkCoords: true,
  },
  {
    slug: "st-clairs-falls",
    name: "St Clair's Falls",
    category: "waterfall",
    lat: 6.936,
    lng: 80.642,
    district: "nuwara_eliya",
    visitRadiusM: 1000,
    bestMonths: [5, 6, 7, 8, 9],
    shortDescription:
      "A broad, two-tiered waterfall tumbling through tea country near Talawakele, best seen from viewpoints along the main road.",
    fullDescription:
      "St Clair's is one of the widest waterfalls in the hill country, falling in two main tiers across a green valley of tea.\n\nThe nearby Devon Falls can be seen from another roadside viewpoint, so the two are usually visited together.",
    howToGetThere: "Beside the Hatton–Nuwara Eliya road near Talawakele, with roadside viewpoints.",
    checkCoords: true,
  },
  {
    slug: "devon-falls",
    name: "Devon Falls",
    category: "waterfall",
    lat: 6.9295,
    lng: 80.6295,
    district: "nuwara_eliya",
    visitRadiusM: 1000,
    bestMonths: [5, 6, 7, 8, 9],
    shortDescription:
      "A tall, slender waterfall dropping into a tea-covered valley, named after an early colonial planter, visible from the Hatton road.",
    fullDescription:
      "Devon Falls is a single long plunge best seen from a roadside viewpoint across the valley. A tea centre nearby has a terrace looking towards the falls.\n\nIt's an easy stop on the drive between Hatton and Nuwara Eliya.",
    howToGetThere: "Visible from the Hatton–Nuwara Eliya road near Talawakele.",
    checkCoords: true,
  },

  // ── Hambantota ───────────────────────────────────────────────────────
  {
    slug: "bundala-national-park",
    name: "Bundala National Park",
    category: "wildlife",
    lat: 6.1987,
    lng: 81.2357,
    district: "hambantota",
    visitRadiusM: 8000,
    bestMonths: [9, 10, 11, 12, 1, 2, 3],
    shortDescription:
      "Coastal lagoons and scrub that are one of Sri Lanka's best places for birds, especially migrant waders and flamingos in the northern winter.",
    fullDescription:
      "Bundala's lagoons and salt pans draw huge numbers of water birds, and the park is internationally recognised as a wetland of importance.\n\nJeep safaris also turn up crocodiles, elephants and, in season, flamingos. It's less crowded than nearby Yala.",
    safetyNotes: "Visit only with a licensed safari jeep and stay in the vehicle.",
    howToGetThere:
      "Between Hambantota and Tissamaharama; safari jeeps run from Tissamaharama and nearby hotels.",
    checkCoords: true,
  },
  {
    slug: "tissa-wewa",
    name: "Tissa Wewa",
    category: "lake",
    lat: 6.292,
    lng: 81.288,
    district: "hambantota",
    visitRadiusM: 1200,
    bestMonths: [2, 3, 4, 5, 6, 7],
    shortDescription:
      "An ancient reservoir beside Tissamaharama town, fringed with trees full of birds and especially peaceful at sunrise.",
    fullDescription:
      "Tissa Wewa is one of the old irrigation tanks of the south, and its bund makes a lovely walk or cycle at dawn and dusk.\n\nWater birds, monitor lizards and the occasional crocodile are common sights.",
    safetyNotes: "Don't swim: crocodiles live in the reservoir.",
    howToGetThere: "On the edge of Tissamaharama town, walkable from most guesthouses.",
    checkCoords: true,
  },
  {
    slug: "rekawa-beach",
    name: "Rekawa Beach",
    category: "wildlife",
    lat: 6.05,
    lng: 80.85,
    district: "hambantota",
    visitRadiusM: 1500,
    bestMonths: ALL_YEAR,
    shortDescription:
      "A wild beach east of Tangalle where a community conservation project watches over nesting sea turtles at night.",
    fullDescription:
      "Several species of sea turtle come ashore to nest at Rekawa. Local guides lead small night-time watches, keeping disturbance to a minimum.\n\nBy day the beach is empty and beautiful, though the sea is usually too rough for swimming.",
    safetyNotes:
      "No flash photography or torches near turtles; follow the guides' instructions. Swimming is not advised.",
    howToGetThere:
      "East of Tangalle; reachable by tuk-tuk. Night turtle watches are arranged on site or through guesthouses.",
    checkCoords: true,
  },
  {
    slug: "hummanaya-blowhole",
    name: "Hummanaya Blowhole",
    category: "viewpoint",
    lat: 5.964,
    lng: 80.718,
    district: "hambantota",
    visitRadiusM: 500,
    bestMonths: [5, 6, 7, 8, 9],
    shortDescription:
      "A natural blowhole in the rocks near Kudawella, where waves force spray high into the air with a loud whoosh.",
    fullDescription:
      "Hummanaya is named for the sound the water makes as it bursts upwards. It is most dramatic when the sea is rough, which is usually during the south-west monsoon.\n\nSteps lead down from the road to viewing areas.",
    safetyNotes: "Rocks are wet and slippery; keep well back from the spray area.",
    howToGetThere:
      "Near Kudawella fishing village between Dickwella and Tangalle; tuk-tuks run from either town.",
    checkCoords: true,
  },
  {
    slug: "ussangoda",
    name: "Ussangoda",
    category: "viewpoint",
    lat: 6.098,
    lng: 80.986,
    district: "hambantota",
    visitRadiusM: 1500,
    bestMonths: ALL_YEAR,
    shortDescription:
      "An unusual clifftop plateau of red earth and low scrub above the ocean, protected as a national park and wrapped in local legend.",
    fullDescription:
      "Ussangoda's bare reddish ground and sparse vegetation look nothing like the surrounding coast, and local stories tie the place to the Ramayana.\n\nThe cliff edge looks down over empty beaches and turtle nesting grounds.",
    safetyNotes: "Exposed and very hot by midday; cliff edges are unfenced.",
    howToGetThere: "Off the coastal road between Tangalle and Hambantota, near Nonagama.",
    checkCoords: true,
  },
  {
    slug: "tangalle-beach",
    name: "Tangalle Beach",
    category: "beach",
    lat: 6.023,
    lng: 80.79,
    district: "hambantota",
    visitRadiusM: 1500,
    bestMonths: SOUTH_WEST_DRY,
    shortDescription:
      "Long, quiet golden beaches around Tangalle, backed by palms and simple guesthouses, much less developed than the west of the south coast.",
    fullDescription:
      "The coast around Tangalle is made up of a series of wide bays and empty sand. It's a place to slow down.\n\nThe sea here can be powerful, so pick swimming spots carefully.",
    safetyNotes: "Strong waves and undertow on many stretches; ask locally before swimming.",
    howToGetThere:
      "Tangalle is on the main southern coastal road; buses connect it to Matara and Hambantota.",
  },

  // ── Polonnaruwa ──────────────────────────────────────────────────────
  {
    slug: "gal-vihara",
    name: "Gal Vihara",
    category: "heritage_site",
    lat: 7.9659,
    lng: 81.0045,
    district: "polonnaruwa",
    visitRadiusM: 400,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "Four great Buddha figures carved from a single granite face in Polonnaruwa, including a serene reclining Buddha, among Sri Lanka's finest sculptures.",
    fullDescription:
      "Gal Vihara is the highlight of the Polonnaruwa ancient city for many visitors. The seated, standing and reclining images are carved directly into the rock, their calm expressions remarkably well preserved.\n\nThe figures are protected by a shelter, and it's an active place of worship.",
    dressCode: TEMPLE_DRESS,
    howToGetThere:
      "At the northern end of the Polonnaruwa ancient city; most visitors cycle or take a tuk-tuk between sites.",
  },
  {
    slug: "parakrama-samudra",
    name: "Parakrama Samudra",
    category: "lake",
    lat: 7.923,
    lng: 80.992,
    district: "polonnaruwa",
    visitRadiusM: 2000,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A vast ancient reservoir beside Polonnaruwa, built by King Parakramabahu I, still watering the surrounding rice fields today.",
    fullDescription:
      "Parakrama Samudra ('Sea of Parakrama') is so large it feels like an inland sea. Its bund road is a beautiful place for sunset.\n\nThe reservoir shows the scale of the irrigation works that supported Polonnaruwa.",
    safetyNotes: "Don't swim: the reservoir is home to crocodiles.",
    howToGetThere: "On the western edge of Polonnaruwa town; the bund road runs along its shore.",
    checkCoords: true,
  },
  {
    slug: "kaudulla-national-park",
    name: "Kaudulla National Park",
    category: "national_park",
    lat: 8.152,
    lng: 80.905,
    district: "polonnaruwa",
    visitRadiusM: 8000,
    bestMonths: [8, 9, 10, 11, 12],
    shortDescription:
      "A park around an ancient reservoir north of Polonnaruwa where large elephant herds gather, often when nearby Minneriya's waters are high.",
    fullDescription:
      "Kaudulla forms part of an elephant corridor with Minneriya. Herds move between the parks with the water levels, and safari drivers follow them.\n\nThe open grassland around the tank gives good views of elephants, along with water birds and other wildlife.",
    safetyNotes: "Visit only with a licensed safari jeep and stay in the vehicle.",
    howToGetThere: "Off the Habarana–Trincomalee road; jeeps run from Habarana and Polonnaruwa.",
    checkCoords: true,
  },

  // ── Dambulla ─────────────────────────────────────────────────────────
  {
    slug: "pidurangala-rock",
    name: "Pidurangala Rock",
    category: "hike",
    lat: 7.9655,
    lng: 80.761,
    district: "matale",
    visitRadiusM: 800,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "The rock next to Sigiriya, climbed past a reclining Buddha to a summit with the best view of Sigiriya itself, especially at sunrise.",
    fullDescription:
      "Pidurangala sits just north of Sigiriya and is home to a temple at its base. The path climbs through forest and past an old reclining Buddha before a short scramble over boulders to the top.\n\nThe summit looks straight across at Sigiriya.",
    dressCode: "Cover shoulders and knees through the temple grounds at the base.",
    safetyNotes: "The final section is a rocky scramble; bring a torch for sunrise climbs.",
    howToGetThere: "A short tuk-tuk ride or walk from Sigiriya village; the trail starts at the temple.",
  },
  {
    slug: "nalanda-gedige",
    name: "Nalanda Gedige",
    category: "heritage_site",
    lat: 7.67,
    lng: 80.638,
    district: "matale",
    visitRadiusM: 400,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A small, unusual stone temple combining Hindu and Buddhist styles, set beside a reservoir south of Dambulla.",
    fullDescription:
      "Nalanda Gedige is built of stone in a style that blends South Indian Hindu architecture with Buddhist elements, which makes it a puzzle for historians.\n\nIt was moved and rebuilt on its current site when the surrounding area was flooded for a reservoir.",
    howToGetThere: "Just off the Matale–Dambulla road; a short detour by car or tuk-tuk.",
    checkCoords: true,
  },
  {
    slug: "kandalama-lake",
    name: "Kandalama Lake",
    category: "lake",
    lat: 7.889,
    lng: 80.7,
    district: "matale",
    visitRadiusM: 2000,
    bestMonths: CULTURAL_TRIANGLE,
    shortDescription:
      "A large reservoir east of Dambulla surrounded by forest and rock outcrops, with views towards Sigiriya and good birdwatching.",
    fullDescription:
      "Kandalama's waters and wooded shores are a peaceful contrast to the busy cultural sites nearby.\n\nEarly mornings bring mist over the water and lots of birdlife.",
    safetyNotes: "Don't swim; crocodiles live in the reservoir.",
    howToGetThere: "East of Dambulla town; reachable by tuk-tuk or car.",
    checkCoords: true,
  },

  // ── Trincomalee ──────────────────────────────────────────────────────
  {
    slug: "nilaveli-beach",
    name: "Nilaveli Beach",
    category: "beach",
    lat: 8.69,
    lng: 81.195,
    district: "trincomalee",
    visitRadiusM: 1500,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A long, wide stretch of pale sand north of Trincomalee, calm in the dry season and the departure point for boats to Pigeon Island.",
    fullDescription:
      "Nilaveli's beach runs for kilometres, quiet even in season. The water is usually calm from around May to September.\n\nBoats leave from here for snorkelling at Pigeon Island National Park.",
    safetyNotes: "Seas are rough during the north-east monsoon (roughly November–February).",
    howToGetThere: "North of Trincomalee on the coast road; buses and tuk-tuks run from Trincomalee.",
  },
  {
    slug: "uppuveli-beach",
    name: "Uppuveli Beach",
    category: "beach",
    lat: 8.604,
    lng: 81.211,
    district: "trincomalee",
    visitRadiusM: 1200,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A relaxed beach just north of Trincomalee town, with guesthouses, beach restaurants and gentle water in the dry season.",
    fullDescription:
      "Uppuveli is the most convenient beach for visitors staying in Trincomalee. It's lively in the evenings, with seafood barbecues on the sand.\n\nThe Commonwealth War Cemetery is nearby.",
    safetyNotes: "Rough seas in the north-east monsoon.",
    howToGetThere: "A short tuk-tuk ride north of Trincomalee town.",
  },
  {
    slug: "fort-frederick-trincomalee",
    name: "Fort Frederick",
    category: "heritage_site",
    lat: 8.581,
    lng: 81.24,
    district: "trincomalee",
    visitRadiusM: 800,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A colonial fort on the Trincomalee peninsula, still partly in military use, where spotted deer wander and the road leads up to Koneswaram Temple.",
    fullDescription:
      "Fort Frederick's gateway and walls date from the colonial period. Deer graze beneath the trees inside, and the road through the fort climbs to Swami Rock.\n\nParts of the fort are military areas, so follow signs and don't photograph restricted sites.",
    safetyNotes: "Some areas are restricted; follow signs and staff instructions.",
    howToGetThere:
      "On the peninsula east of Trincomalee town; walk or tuk-tuk through the gate towards Koneswaram.",
  },
  {
    slug: "kanniya-hot-springs",
    name: "Kanniya Hot Springs",
    category: "other",
    lat: 8.614,
    lng: 81.19,
    district: "trincomalee",
    visitRadiusM: 500,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "Seven small square wells fed by warm springs, each a slightly different temperature, where visitors splash water over themselves.",
    fullDescription:
      "The Kanniya wells are a popular stop on the road out of Trincomalee. Each well is shallow, so the custom is to pour buckets of the warm water over yourself rather than bathe.\n\nThe site has religious significance and is managed with that in mind.",
    dressCode: "Dress modestly; you may get wet, so wear something suitable.",
    howToGetThere: "Inland from Trincomalee off the Anuradhapura road; a short drive or tuk-tuk ride.",
    checkCoords: true,
  },
  {
    slug: "marble-beach-trincomalee",
    name: "Marble Beach",
    category: "beach",
    lat: 8.513,
    lng: 81.212,
    district: "trincomalee",
    visitRadiusM: 800,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A sheltered bay south of Trincomalee with remarkably clear, calm water, popular with families for swimming on weekends.",
    fullDescription:
      "Marble Beach is known for its glassy water in the dry season. The bay is tucked away within an area managed by the air force, which runs the facilities.\n\nWeekdays are much quieter than weekends.",
    safetyNotes: "Access is through a managed area; follow staff instructions.",
    howToGetThere: "South of Trincomalee via China Bay; best by tuk-tuk or car.",
    checkCoords: true,
  },
  {
    slug: "pathirakali-amman-kovil",
    name: "Pathirakali Amman Kovil",
    category: "temple",
    lat: 8.5735,
    lng: 81.229,
    district: "trincomalee",
    visitRadiusM: 400,
    bestMonths: EAST_COAST_DRY,
    shortDescription:
      "A vividly decorated Hindu temple in Trincomalee town, its gopuram and ceilings covered in brightly painted figures.",
    fullDescription:
      "Pathirakali Amman Kovil is dedicated to the goddess Kali. Its colourful tower and painted ceilings are full of detail.\n\nIt's an active temple; visit outside the busiest puja times if you can.",
    dressCode: KOVIL_DRESS,
    howToGetThere: "In Trincomalee town, near the sports ground, a short walk from the centre.",
    checkCoords: true,
  },
];
