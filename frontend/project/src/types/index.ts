export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  district?: string;
  subdivision?: string;
}

export interface UserData {
  name: string;
  aadhaarNumber: string;
  address: string;
  location?: LocationData;
  district?: string;
  subdivision?: string;
  homeType: 'new' | 'existing';
  homePlanImage?: File;
  roofTypes?: string[];
  roofAreas: { [key: string]: number };
  roofArea?: number; // For CAD detected roof area
  numberOfDwellers?: number;
  hasOpenSpace?: boolean;
  openSpaceArea?: number;
}

export interface RoofType {
  id: string;
  name: string;
  icon: string;
}

export const ROOF_TYPES: RoofType[] = [
  { id: 'rcc', name: 'RCC', icon: '🏢' },
  { id: 'tile', name: 'Tile', icon: '🏠' },
  { id: 'metal', name: 'Metal Sheet', icon: '🏭' },
  { id: 'other', name: 'Other', icon: '🏘️' }
];

export interface District {
  id: string;
  name: string;
  subdivisions: string[];
}

export const DISTRICTS: District[] = [
  {
    id: 'chennai',
    name: 'Chennai',
    subdivisions: ['Egmore', 'Fort-Tondiarpet', 'Mylapore-Triplicane', 'Mambalam-Guindy', 'Ambattur', 'Madhavaram', 'Sholinganallur', 'Perungudi', 'Alandur', 'Tambaram']
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    subdivisions: ['Coimbatore North', 'Coimbatore South', 'Pollachi', 'Udumalaipettai', 'Mettupalayam', 'Sulur']
  },
  {
    id: 'madurai',
    name: 'Madurai',
    subdivisions: ['Madurai North', 'Madurai South', 'Melur', 'Peraiyur', 'Thirumangalam', 'Usilampatti', 'Vadipatti']
  },
  {
    id: 'tiruchirappalli',
    name: 'Tiruchirappalli',
    subdivisions: ['Srirangam', 'Lalgudi', 'Manachanallur', 'Manapparai', 'Musiri', 'Thottiyam', 'Thiruverumbur', 'Tiruchirappalli West']
  },
  {
    id: 'salem',
    name: 'Salem',
    subdivisions: ['Salem', 'Attur', 'Gangavalli', 'Kadayampatti', 'Mettur', 'Omalur', 'Sankari', 'Vazhapadi', 'Yercaud']
  },
  {
    id: 'tirunelveli',
    name: 'Tirunelveli',
    subdivisions: ['Tirunelveli', 'Ambasamudram', 'Cheranmahadevi', 'Manur', 'Nanguneri', 'Palayamkottai', 'Radhapuram', 'Thisayanvilai']
  },
  {
    id: 'vellore',
    name: 'Vellore',
    subdivisions: ['Vellore', 'Arakkonam', 'Arcot', 'Gudiyatham', 'Katpadi', 'Pernambut', 'Sholinghur', 'Walajah']
  },
  {
    id: 'erode',
    name: 'Erode',
    subdivisions: ['Erode', 'Anthiyur', 'Bhavani', 'Gobichettipalayam', 'Kodumudi', 'Modakurichi', 'Nambiyur', 'Perundurai', 'Sathyamangalam', 'Thalavadi']
  }
]