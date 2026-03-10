// Datos del Mundial FIFA 2026
// Fase de Grupos - 104 partid// Banderas: flagcdn.com SVG para máxima nitidez (vectoriales)

const FLAG_BASE = "https://flagcdn.com";

export const teams = [
  // Grupo A
  { name: "México", code: "MEX", group: "A", flagUrl: `${FLAG_BASE}/mx.svg` },
  { name: "Sudáfrica", code: "RSA", group: "A", flagUrl: `${FLAG_BASE}/za.svg` },
  { name: "Corea del Sur", code: "KOR", group: "A", flagUrl: `${FLAG_BASE}/kr.svg` },
  { name: "Por definir A4", code: "TBD", group: "A" },

  // Grupo B
  { name: "Canadá", code: "CAN", group: "B", flagUrl: `${FLAG_BASE}/ca.svg` },
  { name: "Por definir B2", code: "TBD", group: "B" },
  { name: "Catar", code: "QAT", group: "B", flagUrl: `${FLAG_BASE}/qa.svg` },
  { name: "Suiza", code: "SUI", group: "B", flagUrl: `${FLAG_BASE}/ch.svg` },

  // Grupo C
  { name: "Brasil", code: "BRA", group: "C", flagUrl: `${FLAG_BASE}/br.svg` },
  { name: "Marruecos", code: "MAR", group: "C", flagUrl: `${FLAG_BASE}/ma.svg` },
  { name: "Haití", code: "HAI", group: "C", flagUrl: `${FLAG_BASE}/ht.svg` },
  { name: "Escocia", code: "SCO", group: "C", flagUrl: `${FLAG_BASE}/gb-sct.svg` },

  // Grupo D
  { name: "Estados Unidos", code: "USA", group: "D", flagUrl: `${FLAG_BASE}/us.svg` },
  { name: "Paraguay", code: "PAR", group: "D", flagUrl: `${FLAG_BASE}/py.svg` },
  { name: "Australia", code: "AUS", group: "D", flagUrl: `${FLAG_BASE}/au.svg` },
  { name: "Por definir D4", code: "TBD", group: "D" },

  // Grupo E
  { name: "Alemania", code: "GER", group: "E", flagUrl: `${FLAG_BASE}/de.svg` },
  { name: "Curazao", code: "CUW", group: "E", flagUrl: `${FLAG_BASE}/cw.svg` },
  { name: "Costa de Marfil", code: "CIV", group: "E", flagUrl: `${FLAG_BASE}/ci.svg` },
  { name: "Ecuador", code: "ECU", group: "E", flagUrl: `${FLAG_BASE}/ec.svg` },

  // Grupo F
  { name: "Países Bajos", code: "NED", group: "F", flagUrl: `${FLAG_BASE}/nl.svg` },
  { name: "Japón", code: "JPN", group: "F", flagUrl: `${FLAG_BASE}/jp.svg` },
  { name: "Por definir F3", code: "TBD", group: "F" },
  { name: "Túnez", code: "TUN", group: "F", flagUrl: `${FLAG_BASE}/tn.svg` },

  // Grupo G
  { name: "Bélgica", code: "BEL", group: "G", flagUrl: `${FLAG_BASE}/be.svg` },
  { name: "Egipto", code: "EGY", group: "G", flagUrl: `${FLAG_BASE}/eg.svg` },
  { name: "Irán", code: "IRN", group: "G", flagUrl: `${FLAG_BASE}/ir.svg` },
  { name: "Nueva Zelanda", code: "NZL", group: "G", flagUrl: `${FLAG_BASE}/nz.svg` },

  // Grupo H
  { name: "España", code: "ESP", group: "H", flagUrl: `${FLAG_BASE}/es.svg` },
  { name: "Cabo Verde", code: "CPV", group: "H", flagUrl: `${FLAG_BASE}/cv.svg` },
  { name: "Arabia Saudita", code: "KSA", group: "H", flagUrl: `${FLAG_BASE}/sa.svg` },
  { name: "Uruguay", code: "URU", group: "H", flagUrl: `${FLAG_BASE}/uy.svg` },

  // Grupo I
  { name: "Francia", code: "FRA", group: "I", flagUrl: `${FLAG_BASE}/fr.svg` },
  { name: "Senegal", code: "SEN", group: "I", flagUrl: `${FLAG_BASE}/sn.svg` },
  { name: "Por definir I3", code: "TBD", group: "I" },
  { name: "Noruega", code: "NOR", group: "I", flagUrl: `${FLAG_BASE}/no.svg` },

  // Grupo J
  { name: "Argentina", code: "ARG", group: "J", flagUrl: `${FLAG_BASE}/ar.svg` },
  { name: "Argelia", code: "ALG", group: "J", flagUrl: `${FLAG_BASE}/dz.svg` },
  { name: "Austria", code: "AUT", group: "J", flagUrl: `${FLAG_BASE}/at.svg` },
  { name: "Jordania", code: "JOR", group: "J", flagUrl: `${FLAG_BASE}/jo.svg` },

  // Grupo K
  { name: "Portugal", code: "POR", group: "K", flagUrl: `${FLAG_BASE}/pt.svg` },
  { name: "Por definir K3", code: "TBD", group: "K" },
  { name: "Uzbekistán", code: "UZB", group: "K", flagUrl: `${FLAG_BASE}/uz.svg` },
  { name: "Colombia", code: "COL", group: "K", flagUrl: `${FLAG_BASE}/co.svg` },

  // Grupo L
  { name: "Inglaterra", code: "ENG", group: "L", flagUrl: `${FLAG_BASE}/gb-eng.svg` },
  { name: "Croacia", code: "CRO", group: "L", flagUrl: `${FLAG_BASE}/hr.svg` },
  { name: "Ghana", code: "GHA", group: "L", flagUrl: `${FLAG_BASE}/gh.svg` },
  { name: "Panamá", code: "PAN", group: "L", flagUrl: `${FLAG_BASE}/pa.svg` },
];

// Zona horaria de cada sede en junio 2026 (con horario de verano).
// UTC-4: Eastern (Toronto, NY, Boston, Philly, Miami, Atlanta)
// UTC-5: Central (Houston, Dallas, Kansas City)
// UTC-6: Mexico (Ciudad de México, Guadalajara, Monterrey)
// UTC-7: Pacific (Vancouver, Seattle, San Francisco, Los Ángeles)
const VENUE_UTC_OFFSET: Record<string, number> = {
  "Estadio Azteca": -6,
  "Estadio Akron": -6,
  "Estadio BBVA": -6,
  "BMO Field": -4,
  "BC Place": -7,
  "MetLife Stadium": -4,
  "Gillette Stadium": -4,
  "Lincoln Financial Field": -4,
  "Hard Rock Stadium": -4,
  "Mercedes-Benz Stadium": -4,
  "NRG Stadium": -5,
  "AT&T Stadium": -5,
  "Arrowhead Stadium": -5,
  "Levi's Stadium": -7,
  "SoFi Stadium": -7,
  "Lumen Field": -7,
};

function localToUTC(localTime: string, venue: string): string {
  const offset = VENUE_UTC_OFFSET[venue] ?? -5;
  const offsetStr = offset >= 0 ? `+${String(offset).padStart(2, "0")}:00` : `-${String(-offset).padStart(2, "0")}:00`;
  return new Date(localTime.replace("Z", offsetStr)).toISOString();
}

// Fase de Grupos - Partidos oficiales FIFA (horarios en hora LOCAL de cada sede)
const matchesVenezuela = [
  // ============= JORNADA 1 =============

  // 11 de junio 2026 - Grupos A (Mexico UTC-6)
  { homeTeam: "México", awayTeam: "Sudáfrica", date: "2026-06-11T13:00:00Z", group: "A", venue: "Estadio Azteca", city: "Ciudad de México" },
  { homeTeam: "Corea del Sur", awayTeam: "Por definir A4", date: "2026-06-11T20:00:00Z", group: "A", venue: "Estadio Akron", city: "Guadalajara" },

  // 12 de junio 2026 - Grupos B, D (Toronto UTC-4, LA UTC-7)
  { homeTeam: "Canadá", awayTeam: "Por definir B2", date: "2026-06-12T15:00:00Z", group: "B", venue: "BMO Field", city: "Toronto" },
  { homeTeam: "Estados Unidos", awayTeam: "Paraguay", date: "2026-06-12T18:00:00Z", group: "D", venue: "SoFi Stadium", city: "Los Ángeles" },

  // 13-14 junio 2026 - Grupos B, C, D (Levi's UTC-7, MetLife UTC-4, Gillette UTC-4, BC Place UTC-7)
  { homeTeam: "Catar", awayTeam: "Suiza", date: "2026-06-13T12:00:00Z", group: "B", venue: "Levi's Stadium", city: "San Francisco" },
  { homeTeam: "Brasil", awayTeam: "Marruecos", date: "2026-06-13T18:00:00Z", group: "C", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Haití", awayTeam: "Escocia", date: "2026-06-13T21:00:00Z", group: "C", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Australia", awayTeam: "Por definir D4", date: "2026-06-14T00:00:00Z", group: "D", venue: "BC Place", city: "Vancouver" },

  // 14 de junio 2026 - Grupos E, F (Houston UTC-5, Dallas UTC-5, Philly UTC-4, Monterrey UTC-6)
  { homeTeam: "Alemania", awayTeam: "Curazao", date: "2026-06-14T12:00:00Z", group: "E", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Países Bajos", awayTeam: "Japón", date: "2026-06-14T15:00:00Z", group: "F", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Costa de Marfil", awayTeam: "Ecuador", date: "2026-06-14T18:00:00Z", group: "E", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Por definir F3", awayTeam: "Túnez", date: "2026-06-14T19:00:00Z", group: "F", venue: "Estadio BBVA", city: "Monterrey" },

  // 15 de junio 2026 - Grupos G, H (Atlanta UTC-4, Seattle UTC-7, Miami UTC-4, LA UTC-7)
  { homeTeam: "España", awayTeam: "Cabo Verde", date: "2026-06-15T12:00:00Z", group: "H", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Bélgica", awayTeam: "Egipto", date: "2026-06-15T12:00:00Z", group: "G", venue: "Lumen Field", city: "Seattle" },
  { homeTeam: "Arabia Saudita", awayTeam: "Uruguay", date: "2026-06-15T18:00:00Z", group: "H", venue: "Hard Rock Stadium", city: "Miami" },
  { homeTeam: "Irán", awayTeam: "Nueva Zelanda", date: "2026-06-15T18:00:00Z", group: "G", venue: "SoFi Stadium", city: "Los Ángeles" },

  // 16 de junio 2026 - Grupos I, J (MetLife/Gillette UTC-4, Arrowhead UTC-5, Levi's UTC-7)
  { homeTeam: "Francia", awayTeam: "Senegal", date: "2026-06-16T15:00:00Z", group: "I", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Por definir I3", awayTeam: "Noruega", date: "2026-06-16T18:00:00Z", group: "I", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Argentina", awayTeam: "Argelia", date: "2026-06-16T20:00:00Z", group: "J", venue: "Arrowhead Stadium", city: "Kansas City" },
  { homeTeam: "Austria", awayTeam: "Jordania", date: "2026-06-16T21:00:00Z", group: "J", venue: "Levi's Stadium", city: "San Francisco" },

  // 17 de junio 2026 - Grupos K, L (NRG UTC-5, Estadio Azteca UTC-6, AT&T UTC-5, BMO UTC-4)
  { homeTeam: "Portugal", awayTeam: "Por definir K3", date: "2026-06-17T12:00:00Z", group: "K", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Uzbekistán", awayTeam: "Colombia", date: "2026-06-17T20:00:00Z", group: "K", venue: "Estadio Azteca", city: "Ciudad de México" },
  { homeTeam: "Inglaterra", awayTeam: "Croacia", date: "2026-06-17T15:00:00Z", group: "L", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Ghana", awayTeam: "Panamá", date: "2026-06-17T19:00:00Z", group: "L", venue: "BMO Field", city: "Toronto" },

  // ============= JORNADA 2 =============

  // 18 de junio 2026 - Jornada 2 (Mexico UTC-6, Atlanta UTC-4, Toronto UTC-4)
  { homeTeam: "Sudáfrica", awayTeam: "Corea del Sur", date: "2026-06-18T12:00:00Z", group: "A", venue: "Estadio Azteca", city: "Ciudad de México" },
  { homeTeam: "Por definir A4", awayTeam: "México", date: "2026-06-18T19:00:00Z", group: "A", venue: "Estadio Akron", city: "Guadalajara" },
  { homeTeam: "Por definir B2", awayTeam: "Catar", date: "2026-06-18T15:00:00Z", group: "B", venue: "BMO Field", city: "Toronto" },

  // 19 de junio 2026
  { homeTeam: "Suiza", awayTeam: "Canadá", date: "2026-06-19T12:00:00Z", group: "B", venue: "BC Place", city: "Vancouver" },
  { homeTeam: "Marruecos", awayTeam: "Haití", date: "2026-06-19T18:00:00Z", group: "C", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Escocia", awayTeam: "Brasil", date: "2026-06-19T21:00:00Z", group: "C", venue: "Gillette Stadium", city: "Boston" },

  // 20 de junio 2026
  { homeTeam: "Paraguay", awayTeam: "Australia", date: "2026-06-20T18:00:00Z", group: "D", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "Por definir D4", awayTeam: "Estados Unidos", date: "2026-06-20T21:00:00Z", group: "D", venue: "Levi's Stadium", city: "San Francisco" },
  { homeTeam: "Curazao", awayTeam: "Costa de Marfil", date: "2026-06-20T18:00:00Z", group: "E", venue: "NRG Stadium", city: "Houston" },

  // 21 de junio 2026
  { homeTeam: "Ecuador", awayTeam: "Alemania", date: "2026-06-21T15:00:00Z", group: "E", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Japón", awayTeam: "Por definir F3", date: "2026-06-21T18:00:00Z", group: "F", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Túnez", awayTeam: "Países Bajos", date: "2026-06-21T22:00:00Z", group: "F", venue: "Estadio BBVA", city: "Monterrey" },

  // 22 de junio 2026 - Grupos G, H, I, J
  { homeTeam: "Cabo Verde", awayTeam: "Arabia Saudita", date: "2026-06-22T17:00:00Z", group: "H", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Uruguay", awayTeam: "España", date: "2026-06-22T20:00:00Z", group: "H", venue: "Hard Rock Stadium", city: "Miami" },
  { homeTeam: "Egipto", awayTeam: "Irán", date: "2026-06-22T18:00:00Z", group: "G", venue: "Lumen Field", city: "Seattle" },
  { homeTeam: "Francia", awayTeam: "Por definir I3", date: "2026-06-22T17:00:00Z", group: "I", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Noruega", awayTeam: "Senegal", date: "2026-06-22T20:00:00Z", group: "I", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Argentina", awayTeam: "Austria", date: "2026-06-22T12:00:00Z", group: "J", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Jordania", awayTeam: "Argelia", date: "2026-06-22T21:00:00Z", group: "J", venue: "Levi's Stadium", city: "San Francisco" },

  // 23 de junio 2026 - Grupos G, K, L
  { homeTeam: "Nueva Zelanda", awayTeam: "Bélgica", date: "2026-06-23T18:00:00Z", group: "G", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "Portugal", awayTeam: "Uzbekistán", date: "2026-06-23T12:00:00Z", group: "K", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Colombia", awayTeam: "Por definir K3", date: "2026-06-23T20:00:00Z", group: "K", venue: "Estadio Akron", city: "Guadalajara" },
  { homeTeam: "Inglaterra", awayTeam: "Ghana", date: "2026-06-23T16:00:00Z", group: "L", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Panamá", awayTeam: "Croacia", date: "2026-06-23T19:00:00Z", group: "L", venue: "BMO Field", city: "Toronto" },

  // ============= JORNADA 3 =============

  // 26 de junio 2026 - Jornada 3 Grupos A, B, I
  { homeTeam: "México", awayTeam: "Corea del Sur", date: "2026-06-26T19:00:00Z", group: "A", venue: "Estadio Azteca", city: "Ciudad de México" },
  { homeTeam: "Sudáfrica", awayTeam: "Por definir A4", date: "2026-06-26T19:00:00Z", group: "A", venue: "Estadio Akron", city: "Guadalajara" },
  { homeTeam: "Canadá", awayTeam: "Catar", date: "2026-06-26T15:00:00Z", group: "B", venue: "BMO Field", city: "Toronto" },
  { homeTeam: "Suiza", awayTeam: "Por definir B2", date: "2026-06-26T12:00:00Z", group: "B", venue: "BC Place", city: "Vancouver" },
  { homeTeam: "Noruega", awayTeam: "Francia", date: "2026-06-26T15:00:00Z", group: "I", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Senegal", awayTeam: "Por definir I3", date: "2026-06-26T15:00:00Z", group: "I", venue: "BMO Field", city: "Toronto" },

  // 27 de junio 2026 - Jornada 3 Grupos C, D, E, J, K, L
  { homeTeam: "Brasil", awayTeam: "Haití", date: "2026-06-27T15:00:00Z", group: "C", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Marruecos", awayTeam: "Escocia", date: "2026-06-27T15:00:00Z", group: "C", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Estados Unidos", awayTeam: "Australia", date: "2026-06-27T18:00:00Z", group: "D", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "Paraguay", awayTeam: "Por definir D4", date: "2026-06-27T21:00:00Z", group: "D", venue: "Levi's Stadium", city: "San Francisco" },
  { homeTeam: "Alemania", awayTeam: "Costa de Marfil", date: "2026-06-27T18:00:00Z", group: "E", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Ecuador", awayTeam: "Curazao", date: "2026-06-27T18:00:00Z", group: "E", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Argelia", awayTeam: "Austria", date: "2026-06-27T21:00:00Z", group: "J", venue: "Arrowhead Stadium", city: "Kansas City" },
  { homeTeam: "Jordania", awayTeam: "Argentina", date: "2026-06-27T21:00:00Z", group: "J", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Colombia", awayTeam: "Portugal", date: "2026-06-27T19:30:00Z", group: "K", venue: "Hard Rock Stadium", city: "Miami" },
  { homeTeam: "Por definir K3", awayTeam: "Uzbekistán", date: "2026-06-27T19:30:00Z", group: "K", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Panamá", awayTeam: "Inglaterra", date: "2026-06-27T17:00:00Z", group: "L", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Croacia", awayTeam: "Ghana", date: "2026-06-27T17:00:00Z", group: "L", venue: "Lincoln Financial Field", city: "Filadelfia" },

  // 28 de junio - Grupos F, G, H
  { homeTeam: "Países Bajos", awayTeam: "Por definir F3", date: "2026-06-28T15:00:00Z", group: "F", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Japón", awayTeam: "Túnez", date: "2026-06-28T19:00:00Z", group: "F", venue: "Estadio BBVA", city: "Monterrey" },
  { homeTeam: "Bélgica", awayTeam: "Irán", date: "2026-06-28T18:00:00Z", group: "G", venue: "Lumen Field", city: "Seattle" },
  { homeTeam: "Egipto", awayTeam: "Nueva Zelanda", date: "2026-06-28T18:00:00Z", group: "G", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "España", awayTeam: "Arabia Saudita", date: "2026-06-28T21:00:00Z", group: "H", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Uruguay", awayTeam: "Cabo Verde", date: "2026-06-28T21:00:00Z", group: "H", venue: "Hard Rock Stadium", city: "Miami" },
];

export const matches = matchesVenezuela.map((m) => ({ ...m, date: localToUTC(m.date, m.venue) }));
