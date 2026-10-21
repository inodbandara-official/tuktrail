// Towns for the manual location fallback: all 25 district capitals plus common
// traveller bases (`hub: true`). Coordinates are town-centre approximations.
import type { District } from "@/shared/constants/geography";

export interface SeedTown {
  name: string;
  district: District;
  lat: number;
  lng: number;
  hub?: boolean;
}

export const SEED_TOWNS: SeedTown[] = [
  // District capitals
  { name: "Colombo", district: "colombo", lat: 6.9271, lng: 79.8612, hub: true },
  { name: "Gampaha", district: "gampaha", lat: 7.0917, lng: 79.9997 },
  { name: "Kalutara", district: "kalutara", lat: 6.5854, lng: 79.9607 },
  { name: "Kandy", district: "kandy", lat: 7.2906, lng: 80.6337, hub: true },
  { name: "Matale", district: "matale", lat: 7.4675, lng: 80.6234 },
  { name: "Nuwara Eliya", district: "nuwara_eliya", lat: 6.9497, lng: 80.7891, hub: true },
  { name: "Galle", district: "galle", lat: 6.0535, lng: 80.221, hub: true },
  { name: "Matara", district: "matara", lat: 5.9549, lng: 80.555 },
  { name: "Hambantota", district: "hambantota", lat: 6.1241, lng: 81.1185 },
  { name: "Jaffna", district: "jaffna", lat: 9.6615, lng: 80.0255, hub: true },
  { name: "Kilinochchi", district: "kilinochchi", lat: 9.3803, lng: 80.377 },
  { name: "Mannar", district: "mannar", lat: 8.981, lng: 79.9044 },
  { name: "Vavuniya", district: "vavuniya", lat: 8.7514, lng: 80.4971 },
  { name: "Mullaitivu", district: "mullaitivu", lat: 9.2671, lng: 80.8142 },
  { name: "Batticaloa", district: "batticaloa", lat: 7.731, lng: 81.6747 },
  { name: "Ampara", district: "ampara", lat: 7.2975, lng: 81.682 },
  { name: "Trincomalee", district: "trincomalee", lat: 8.5874, lng: 81.2152, hub: true },
  { name: "Kurunegala", district: "kurunegala", lat: 7.4863, lng: 80.3647 },
  { name: "Puttalam", district: "puttalam", lat: 8.0362, lng: 79.8283 },
  { name: "Anuradhapura", district: "anuradhapura", lat: 8.3114, lng: 80.4037, hub: true },
  { name: "Polonnaruwa", district: "polonnaruwa", lat: 7.9403, lng: 81.0188, hub: true },
  { name: "Badulla", district: "badulla", lat: 6.9934, lng: 81.055 },
  { name: "Monaragala", district: "monaragala", lat: 6.8728, lng: 81.3507 },
  { name: "Ratnapura", district: "ratnapura", lat: 6.6828, lng: 80.3992 },
  { name: "Kegalle", district: "kegalle", lat: 7.2513, lng: 80.3464 },

  // Traveller bases and other main towns
  { name: "Negombo", district: "gampaha", lat: 7.2008, lng: 79.8737, hub: true },
  { name: "Mount Lavinia", district: "colombo", lat: 6.839, lng: 79.865 },
  { name: "Sri Jayawardenepura Kotte", district: "colombo", lat: 6.8868, lng: 79.9187 },
  { name: "Moratuwa", district: "colombo", lat: 6.773, lng: 79.8816 },
  { name: "Beruwala", district: "kalutara", lat: 6.479, lng: 79.983 },
  { name: "Bentota", district: "galle", lat: 6.421, lng: 80.006, hub: true },
  { name: "Ambalangoda", district: "galle", lat: 6.235, lng: 80.054 },
  { name: "Hikkaduwa", district: "galle", lat: 6.1395, lng: 80.1063, hub: true },
  { name: "Unawatuna", district: "galle", lat: 6.01, lng: 80.249, hub: true },
  { name: "Koggala", district: "galle", lat: 5.993, lng: 80.33 },
  { name: "Ahangama", district: "galle", lat: 5.973, lng: 80.362 },
  { name: "Weligama", district: "matara", lat: 5.975, lng: 80.429, hub: true },
  { name: "Mirissa", district: "matara", lat: 5.9483, lng: 80.4716, hub: true },
  { name: "Dickwella", district: "matara", lat: 5.966, lng: 80.693 },
  { name: "Deniyaya", district: "matara", lat: 6.344, lng: 80.56 },
  { name: "Tangalle", district: "hambantota", lat: 6.0243, lng: 80.7941, hub: true },
  { name: "Tissamaharama", district: "hambantota", lat: 6.2786, lng: 81.2876, hub: true },
  { name: "Kataragama", district: "monaragala", lat: 6.4134, lng: 81.3346 },
  { name: "Ella", district: "badulla", lat: 6.8667, lng: 81.0466, hub: true },
  { name: "Bandarawela", district: "badulla", lat: 6.8259, lng: 80.9982 },
  { name: "Haputale", district: "badulla", lat: 6.7656, lng: 80.951, hub: true },
  { name: "Wellawaya", district: "monaragala", lat: 6.7357, lng: 81.1028 },
  { name: "Hatton", district: "nuwara_eliya", lat: 6.8916, lng: 80.5955 },
  { name: "Kitulgala", district: "kegalle", lat: 6.9895, lng: 80.4176 },
  { name: "Avissawella", district: "colombo", lat: 6.9533, lng: 80.21 },
  { name: "Embilipitiya", district: "ratnapura", lat: 6.3439, lng: 80.849 },
  { name: "Dambulla", district: "matale", lat: 7.8742, lng: 80.6511, hub: true },
  { name: "Sigiriya", district: "matale", lat: 7.9547, lng: 80.7553, hub: true },
  { name: "Habarana", district: "anuradhapura", lat: 8.035, lng: 80.7486, hub: true },
  { name: "Chilaw", district: "puttalam", lat: 7.5758, lng: 79.7953 },
  { name: "Kalpitiya", district: "puttalam", lat: 8.2296, lng: 79.759, hub: true },
  { name: "Nilaveli", district: "trincomalee", lat: 8.696, lng: 81.191, hub: true },
  { name: "Pasikudah", district: "batticaloa", lat: 7.929, lng: 81.56, hub: true },
  { name: "Arugam Bay", district: "ampara", lat: 6.8406, lng: 81.835, hub: true },
  { name: "Point Pedro", district: "jaffna", lat: 9.8167, lng: 80.2333 },
];
