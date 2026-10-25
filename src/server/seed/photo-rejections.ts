// Photos rejected in manual review (they do not actually show the place, or are not photos).
// The fetch script never picks these files again; the seed never uses them.
export const PHOTO_REJECTIONS: Record<string, { files: string[]; reason: string }> = {
  "bentota-beach": { files: ["File:TurtlesNesting.jpg"], reason: "Turtle-hatchery close-up, not the beach" },
  buduruwagala: {
    files: [
      "File:Buduruwagala (Détail) - la lampe et le trône.JPG",
      "File:Buduruwagala - Le grand Bouddha.JPG",
    ],
    reason: "Blank rock close-up; carvings not visible",
  },
  "embekke-devale": {
    files: ["File:Embekka Devalaya 48.JPG"],
    reason: "Buddha statue; can not confirm it is Embekke carved hall",
  },
  "hikkaduwa-beach": {
    files: [
      "File:Map of Hikkaduwa Town and its Neighbourhoods--Map of the Southern and Eastern Villages.png",
    ],
    reason: "A map, not a photo",
  },
  "kalpitiya-lagoon": {
    files: ["File:SL Kalpitiya asv2020-01 img6 Dutch fort.jpg"],
    reason: "Old fort wall in town, not the lagoon",
  },
  "kalutara-bodhiya": { files: ["File:Old kalutara bodhi.jpg"], reason: "Faded historical print" },
  "kaudulla-national-park": {
    files: ["File:Thimindu 2009 12 31 Kaudulla Pompadour Green Pigeon 1.jpg"],
    reason: "Bird close-up, not the park",
  },
  "keerimalai-springs": { files: ["File:Overgrown Statues.jpg"], reason: "Temple carvings, not the springs" },
  "mannar-fort": {
    files: [
      "File:AMH-4488-NA Map of Fort Manaer.jpg",
      "File:Het fort Manaar op Ceylon, gezien van de rivier .ar van de Revier (titel op object), RP-T-1902-A-4667.jpg",
    ],
    reason: "18th-century drawing, not a photo",
  },
  "negombo-beach": {
    files: [
      "File:SL Negombo asv2020-01 img02 Dutch canal.jpg",
      "File:Negombo Beach resort pool (Unsplash).jpg",
    ],
    reason: "Canal / hotel pool, not the beach",
  },
  "tangalle-beach": {
    files: [
      "File:Tangalle harbour.jpg",
      "File:Black sea urchins (Stomopneustes variolaris).jpg",
      "File:Collage of Political Posters - Marakolliya Beach - Tangalla - Sri Lanka (13895066708).jpg",
    ],
    reason: "Harbour stupa / sea-urchin close-up, not the beach",
  },
  "udawattakele-forest": {
    files: ["File:Sri Lanka - 029 - Kandy Temple of the Tooth.jpg", "File:About Udawatte Kele.jpg"],
    reason: "Kandy town / information sign, not the forest",
  },
  "wilpattu-national-park": {
    files: ["File:Himantopus himantopus -Wilpattu National Park, Sri Lanka-8.jpg"],
    reason: "Bird close-up, not the park",
  },
  "ella-rock": {
    files: ["File:SL Ella asv2020-01 img29 Dhowa Temple.jpg"],
    reason: "Temple interior, not Ella Rock",
  },
  "japanese-peace-pagoda-rumassala": {
    files: ["File:Japanese peace pagoda in Rumassala,Unawatuna.jpg"],
    reason: "Generic dagoba silhouette; not identifiable",
  },
  "tissa-wewa": { files: ["File:Tissa Wewa.JPG"], reason: "Trees and sky; reservoir not visible" },
  riverston: {
    files: ["File:RIVERSTON SRI LANKA.jpg", "File:Grey-headed Fish Eagle over Riverston Road, Sri Lanka.jpg"],
    reason: "Sunset silhouette; place not identifiable",
  },
  "galle-face-green": {
    files: ["File:Boy leaning on memorial stone on Galle Face Walk, Colombo, Sri Lanka.jpg"],
    reason: "Portrait of a person (higher-res alternative rejected; original kept)",
  },
  "hakgala-botanical-garden": {
    files: ["File:Agave plant.jpg"],
    reason: "Plant close-up, not the garden (higher-res alternative rejected; original kept)",
  },
  "kanniya-hot-springs": {
    files: ["File:Trincomalee Kanniya Hot Springs (3).jpg"],
    reason: "Small shrine, not the wells (higher-res alternative rejected; original kept)",
  },
  kitulgala: {
    files: ["File:Bridge over Kataran Oya (east2west) - panoramio.jpg"],
    reason: "Village road, not representative (higher-res alternative rejected; original kept)",
  },
  "mount-lavinia-beach": {
    files: ["File:162c.Emil Karl Schumacher.jpg"],
    reason: "Historical group photo (higher-res alternative rejected; original kept)",
  },
  "mulkirigala-rock-temple": {
    files: ["File:Adamsberg (Mulkirigala), ingang van de beeldenkamers in de rots, NG-365.jpg"],
    reason: "Painting, not a photo (higher-res alternative rejected; original kept)",
  },
  yapahuwa: {
    files: ["File:A path way to Yapahuwa.jpg"],
    reason: "Path through trees, site not visible (higher-res alternative rejected; original kept)",
  },
};
