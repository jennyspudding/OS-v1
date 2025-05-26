export interface District {
  name: string;
  postalCode: string;
}

export interface City {
  name: string;
  districts: District[];
}

export interface Province {
  name: string;
  cities: City[];
}

export const indonesiaData: Province[] = [
  {
    name: "BALI",
    cities: [
      {
        name: "DENPASAR",
        districts: [
          { name: "DENPASAR BARAT", postalCode: "80111" },
          { name: "DENPASAR SELATAN", postalCode: "80112" },
          { name: "DENPASAR TIMUR", postalCode: "80113" },
          { name: "DENPASAR UTARA", postalCode: "80114" }
        ]
      },
      {
        name: "BADUNG",
        districts: [
          { name: "KUTA", postalCode: "80361" },
          { name: "MENGWI", postalCode: "80351" },
          { name: "ABIANSEMAL", postalCode: "80352" },
          { name: "PETANG", postalCode: "80353" }
        ]
      }
    ]
  },
  {
    name: "BANGKA BELITUNG",
    cities: [
      {
        name: "PANGKALPINANG",
        districts: [
          { name: "PANGKALPINANG BARAT", postalCode: "33111" },
          { name: "PANGKALPINANG TIMUR", postalCode: "33112" },
          { name: "PANGKALPINANG UTARA", postalCode: "33113" }
        ]
      }
    ]
  },
  {
    name: "BANTEN",
    cities: [
      {
        name: "KAB. TANGERANG",
        districts: [
          { name: "PAGEDANGAN", postalCode: "15330" },
          { name: "LEGOK", postalCode: "15820" },
          { name: "CURUG", postalCode: "15810" },
          { name: "KELAPA DUA", postalCode: "15810" },
          { name: "SERPONG", postalCode: "15310" },
          { name: "CISAUK", postalCode: "15345" }
        ]
      },
      {
        name: "TANGERANG SELATAN",
        districts: [
          { name: "SERPONG", postalCode: "15310" },
          { name: "SERPONG UTARA", postalCode: "15311" },
          { name: "PONDOK AREN", postalCode: "15224" },
          { name: "CIPUTAT", postalCode: "15411" },
          { name: "CIPUTAT TIMUR", postalCode: "15412" },
          { name: "PAMULANG", postalCode: "15417" },
          { name: "SETU", postalCode: "15314" }
        ]
      },
      {
        name: "SERANG",
        districts: [
          { name: "SERANG", postalCode: "42111" },
          { name: "KASEMEN", postalCode: "42191" },
          { name: "WALANTAKA", postalCode: "42183" },
          { name: "CURUG", postalCode: "42175" },
          { name: "CIPOCOK JAYA", postalCode: "42121" },
          { name: "TAKTAKAN", postalCode: "42162" }
        ]
      }
    ]
  },
  {
    name: "BENGKULU",
    cities: [
      {
        name: "BENGKULU",
        districts: [
          { name: "SELEBAR", postalCode: "38212" },
          { name: "GADING CEMPAKA", postalCode: "38171" },
          { name: "TELUK SEGARA", postalCode: "38119" },
          { name: "RATU AGUNG", postalCode: "38222" }
        ]
      }
    ]
  },
  {
    name: "DI YOGYAKARTA",
    cities: [
      {
        name: "YOGYAKARTA",
        districts: [
          { name: "GONDOKUSUMAN", postalCode: "55223" },
          { name: "JETIS", postalCode: "55233" },
          { name: "TEGALREJO", postalCode: "55244" },
          { name: "UMBULHARJO", postalCode: "55161" },
          { name: "KOTAGEDE", postalCode: "55173" },
          { name: "MERGANGSAN", postalCode: "55153" }
        ]
      },
      {
        name: "SLEMAN",
        districts: [
          { name: "DEPOK", postalCode: "55281" },
          { name: "MLATI", postalCode: "55288" },
          { name: "GAMPING", postalCode: "55293" },
          { name: "GODEAN", postalCode: "55264" },
          { name: "MOYUDAN", postalCode: "55563" }
        ]
      }
    ]
  },
  {
    name: "DKI JAKARTA",
    cities: [
      {
        name: "JAKARTA PUSAT",
        districts: [
          { name: "GAMBIR", postalCode: "10110" },
          { name: "SAWAH BESAR", postalCode: "10710" },
          { name: "KEMAYORAN", postalCode: "10610" },
          { name: "SENEN", postalCode: "10410" },
          { name: "CEMPAKA PUTIH", postalCode: "10510" },
          { name: "MENTENG", postalCode: "10310" },
          { name: "TANAH ABANG", postalCode: "10230" },
          { name: "JOHAR BARU", postalCode: "10560" }
        ]
      },
      {
        name: "JAKARTA SELATAN",
        districts: [
          { name: "KEBAYORAN BARU", postalCode: "12110" },
          { name: "KEBAYORAN LAMA", postalCode: "12210" },
          { name: "PESANGGRAHAN", postalCode: "12270" },
          { name: "CILANDAK", postalCode: "12430" },
          { name: "PASAR MINGGU", postalCode: "12510" },
          { name: "JAGAKARSA", postalCode: "12620" },
          { name: "MAMPANG PRAPATAN", postalCode: "12790" },
          { name: "PANCORAN", postalCode: "12810" },
          { name: "TEBET", postalCode: "12810" },
          { name: "SETIA BUDI", postalCode: "12910" }
        ]
      },
      {
        name: "JAKARTA TIMUR",
        districts: [
          { name: "MATRAMAN", postalCode: "13140" },
          { name: "PULOGADUNG", postalCode: "13210" },
          { name: "JATINEGARA", postalCode: "13310" },
          { name: "KRAMAT JATI", postalCode: "13510" },
          { name: "PASAR REBO", postalCode: "13710" },
          { name: "CAKUNG", postalCode: "13910" },
          { name: "DUREN SAWIT", postalCode: "13440" },
          { name: "MAKASAR", postalCode: "13570" },
          { name: "CIRACAS", postalCode: "13740" },
          { name: "CIPAYUNG", postalCode: "13840" }
        ]
      },
      {
        name: "JAKARTA BARAT",
        districts: [
          { name: "TAMBORA", postalCode: "11230" },
          { name: "TAMAN SARI", postalCode: "11150" },
          { name: "GROGOL PETAMBURAN", postalCode: "11470" },
          { name: "CENGKARENG", postalCode: "11730" },
          { name: "KALIDERES", postalCode: "11840" },
          { name: "PAL MERAH", postalCode: "11480" },
          { name: "KEBON JERUK", postalCode: "11530" },
          { name: "KEMBANGAN", postalCode: "11610" }
        ]
      },
      {
        name: "JAKARTA UTARA",
        districts: [
          { name: "PENJARINGAN", postalCode: "14440" },
          { name: "PADEMANGAN", postalCode: "14420" },
          { name: "TANJUNG PRIOK", postalCode: "14310" },
          { name: "KOJA", postalCode: "14210" },
          { name: "KELAPA GADING", postalCode: "14240" },
          { name: "CILINCING", postalCode: "14120" }
        ]
      }
    ]
  },
  {
    name: "GORONTALO",
    cities: [
      {
        name: "GORONTALO",
        districts: [
          { name: "KOTA SELATAN", postalCode: "96128" },
          { name: "KOTA BARAT", postalCode: "96115" },
          { name: "KOTA UTARA", postalCode: "96112" },
          { name: "KOTA TENGAH", postalCode: "96139" }
        ]
      }
    ]
  },
  {
    name: "JAMBI",
    cities: [
      {
        name: "JAMBI",
        districts: [
          { name: "TELANAIPURA", postalCode: "36122" },
          { name: "JAMBI SELATAN", postalCode: "36138" },
          { name: "JAMBI TIMUR", postalCode: "36124" },
          { name: "PASAR JAMBI", postalCode: "36139" }
        ]
      }
    ]
  },
  {
    name: "JAWA BARAT",
    cities: [
      {
        name: "BANDUNG",
        districts: [
          { name: "SUKASARI", postalCode: "40164" },
          { name: "COBLONG", postalCode: "40132" },
          { name: "CIDADAP", postalCode: "40141" },
          { name: "BANDUNG WETAN", postalCode: "40114" },
          { name: "SUMUR BANDUNG", postalCode: "40112" },
          { name: "ANDIR", postalCode: "40181" },
          { name: "CICENDO", postalCode: "40172" },
          { name: "BOJONGLOA KALER", postalCode: "40231" }
        ]
      },
      {
        name: "BEKASI",
        districts: [
          { name: "BEKASI BARAT", postalCode: "17134" },
          { name: "BEKASI TIMUR", postalCode: "17113" },
          { name: "BEKASI SELATAN", postalCode: "17141" },
          { name: "BEKASI UTARA", postalCode: "17122" },
          { name: "BANTARGEBANG", postalCode: "17151" },
          { name: "MUSTIKA JAYA", postalCode: "17158" },
          { name: "MEDAN SATRIA", postalCode: "17132" },
          { name: "PONDOK GEDE", postalCode: "17411" },
          { name: "JATI ASIH", postalCode: "17422" },
          { name: "JATI SAMPURNA", postalCode: "17433" },
          { name: "PONDOK MELATI", postalCode: "17415" },
          { name: "RAWALUMBU", postalCode: "17116" }
        ]
      },
      {
        name: "BOGOR",
        districts: [
          { name: "BOGOR TENGAH", postalCode: "16121" },
          { name: "BOGOR UTARA", postalCode: "16151" },
          { name: "BOGOR SELATAN", postalCode: "16133" },
          { name: "BOGOR TIMUR", postalCode: "16143" },
          { name: "BOGOR BARAT", postalCode: "16119" },
          { name: "TANAH SAREAL", postalCode: "16161" }
        ]
      }
    ]
  },
  {
    name: "JAWA TENGAH",
    cities: [
      {
        name: "SEMARANG",
        districts: [
          { name: "SEMARANG TENGAH", postalCode: "50132" },
          { name: "SEMARANG UTARA", postalCode: "50174" },
          { name: "SEMARANG TIMUR", postalCode: "50125" },
          { name: "SEMARANG SELATAN", postalCode: "50149" },
          { name: "SEMARANG BARAT", postalCode: "50149" },
          { name: "GAYAMSARI", postalCode: "50161" },
          { name: "GENUK", postalCode: "50117" }
        ]
      },
      {
        name: "SOLO",
        districts: [
          { name: "LAWEYAN", postalCode: "57142" },
          { name: "SERENGAN", postalCode: "57155" },
          { name: "PASAR KLIWON", postalCode: "57118" },
          { name: "JEBRES", postalCode: "57126" },
          { name: "BANJARSARI", postalCode: "57132" }
        ]
      }
    ]
  },
  {
    name: "JAWA TIMUR",
    cities: [
      {
        name: "SURABAYA",
        districts: [
          { name: "GUBENG", postalCode: "60281" },
          { name: "WONOKROMO", postalCode: "60243" },
          { name: "TEGALSARI", postalCode: "60262" },
          { name: "GENTENG", postalCode: "60275" },
          { name: "BUBUTAN", postalCode: "60174" },
          { name: "SIMOKERTO", postalCode: "60142" },
          { name: "PABEAN CANTIAN", postalCode: "60162" },
          { name: "SEMAMPIR", postalCode: "60185" },
          { name: "KREMBANGAN", postalCode: "60175" },
          { name: "KENJERAN", postalCode: "60129" }
        ]
      },
      {
        name: "MALANG",
        districts: [
          { name: "KLOJEN", postalCode: "65111" },
          { name: "BLIMBING", postalCode: "65126" },
          { name: "KEDUNGKANDANG", postalCode: "65136" },
          { name: "SUKUN", postalCode: "65147" },
          { name: "LOWOKWARU", postalCode: "65141" }
        ]
      }
    ]
  }
];

// Filter to only show DKI Jakarta and Banten
export const availableProvinces = indonesiaData.filter(province => 
  province.name === "DKI JAKARTA" || province.name === "BANTEN"
);

export function searchLocation(query: string): Province[] {
  if (!query) return availableProvinces;
  
  const lowerQuery = query.toLowerCase();
  return availableProvinces.filter(province => 
    province.name.toLowerCase().includes(lowerQuery) ||
    province.cities.some(city => 
      city.name.toLowerCase().includes(lowerQuery) ||
      city.districts.some(district => 
        district.name.toLowerCase().includes(lowerQuery)
      )
    )
  );
} 