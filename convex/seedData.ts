// Datos del Mundial FIFA 2026
// Fase de Grupos - 104 partidos en 16 sedes

export const teams = [
  // Grupo A
  { name: "México", code: "MEX", group: "A" },
  { name: "Sudáfrica", code: "RSA", group: "A" },
  { name: "Corea del Sur", code: "KOR", group: "A" },
  { name: "Por definir A4", code: "TBD", group: "A" },
  
  // Grupo B
  { name: "Canadá", code: "CAN", group: "B" },
  { name: "Catar", code: "QAT", group: "B" },
  { name: "Suiza", code: "SUI", group: "B" },
  { name: "Por definir B4", code: "TBD", group: "B" },
  
  // Grupo C
  { name: "Brasil", code: "BRA", group: "C" },
  { name: "Marruecos", code: "MAR", group: "C" },
  { name: "Haití", code: "HAI", group: "C" },
  { name: "Escocia", code: "SCO", group: "C" },
  
  // Grupo D
  { name: "Estados Unidos", code: "USA", group: "D" },
  { name: "Paraguay", code: "PAR", group: "D" },
  { name: "Australia", code: "AUS", group: "D" },
  { name: "Por definir D4", code: "TBD", group: "D" },
  
  // Grupo E
  { name: "Alemania", code: "GER", group: "E" },
  { name: "Curazao", code: "CUW", group: "E" },
  { name: "Costa de Marfil", code: "CIV", group: "E" },
  { name: "Ecuador", code: "ECU", group: "E" },
  
  // Grupo F
  { name: "Países Bajos", code: "NED", group: "F" },
  { name: "Japón", code: "JPN", group: "F" },
  { name: "Túnez", code: "TUN", group: "F" },
  { name: "Por definir F4", code: "TBD", group: "F" },
  
  // Grupo G
  { name: "Bélgica", code: "BEL", group: "G" },
  { name: "Egipto", code: "EGY", group: "G" },
  { name: "Irán", code: "IRN", group: "G" },
  { name: "Nueva Zelanda", code: "NZL", group: "G" },
  
  // Grupo H
  { name: "España", code: "ESP", group: "H" },
  { name: "Cabo Verde", code: "CPV", group: "H" },
  { name: "Arabia Saudita", code: "KSA", group: "H" },
  { name: "Uruguay", code: "URU", group: "H" },
  
  // Grupo I
  { name: "Argentina", code: "ARG", group: "I" },
  { name: "Colombia", code: "COL", group: "I" },
  { name: "Senegal", code: "SEN", group: "I" },
  { name: "Por definir I4", code: "TBD", group: "I" },
  
  // Grupo J
  { name: "Francia", code: "FRA", group: "J" },
  { name: "Camerún", code: "CMR", group: "J" },
  { name: "Por definir J3", code: "TBD", group: "J" },
  { name: "Por definir J4", code: "TBD", group: "J" },
  
  // Grupo K
  { name: "Inglaterra", code: "ENG", group: "K" },
  { name: "Nigeria", code: "NGA", group: "K" },
  { name: "Por definir K3", code: "TBD", group: "K" },
  { name: "Por definir K4", code: "TBD", group: "K" },
  
  // Grupo L
  { name: "Portugal", code: "POR", group: "L" },
  { name: "Ghana", code: "GHA", group: "L" },
  { name: "Por definir L3", code: "TBD", group: "L" },
  { name: "Por definir L4", code: "TBD", group: "L" },
];

// Fase de Grupos - Partidos oficiales FIFA
export const matches = [
  // ============= JORNADA 1 =============
  
  // 11 de junio 2026
  { homeTeam: "México", awayTeam: "Sudáfrica", date: "2026-06-11T15:00:00Z", group: "A", venue: "Estadio Azteca", city: "Ciudad de México" },
  { homeTeam: "Corea del Sur", awayTeam: "Por definir A4", date: "2026-06-11T22:00:00Z", group: "A", venue: "Estadio Akron", city: "Guadalajara" },
  
  // 12 de junio 2026
  { homeTeam: "Canadá", awayTeam: "Por definir B4", date: "2026-06-12T15:00:00Z", group: "B", venue: "BMO Field", city: "Toronto" },
  { homeTeam: "Estados Unidos", awayTeam: "Paraguay", date: "2026-06-12T21:00:00Z", group: "D", venue: "SoFi Stadium", city: "Los Ángeles" },
  
  // 13 de junio 2026
  { homeTeam: "Catar", awayTeam: "Suiza", date: "2026-06-13T15:00:00Z", group: "B", venue: "Levi's Stadium", city: "San Francisco" },
  { homeTeam: "Brasil", awayTeam: "Marruecos", date: "2026-06-13T18:00:00Z", group: "C", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Haití", awayTeam: "Escocia", date: "2026-06-13T21:00:00Z", group: "C", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Australia", awayTeam: "Por definir D4", date: "2026-06-14T00:00:00Z", group: "D", venue: "BC Place", city: "Vancouver" },
  
  // 14 de junio 2026
  { homeTeam: "Alemania", awayTeam: "Curazao", date: "2026-06-14T13:00:00Z", group: "E", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Países Bajos", awayTeam: "Japón", date: "2026-06-14T16:00:00Z", group: "F", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Costa de Marfil", awayTeam: "Ecuador", date: "2026-06-14T19:00:00Z", group: "E", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Por definir F4", awayTeam: "Túnez", date: "2026-06-14T22:00:00Z", group: "F", venue: "Estadio BBVA", city: "Monterrey" },
  
  // 15 de junio 2026
  { homeTeam: "España", awayTeam: "Cabo Verde", date: "2026-06-15T12:00:00Z", group: "H", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Bélgica", awayTeam: "Egipto", date: "2026-06-15T15:00:00Z", group: "G", venue: "Lumen Field", city: "Seattle" },
  { homeTeam: "Arabia Saudita", awayTeam: "Uruguay", date: "2026-06-15T18:00:00Z", group: "H", venue: "Hard Rock Stadium", city: "Miami" },
  { homeTeam: "Irán", awayTeam: "Nueva Zelanda", date: "2026-06-15T21:00:00Z", group: "G", venue: "SoFi Stadium", city: "Los Ángeles" },
  
  // 16 de junio 2026
  { homeTeam: "Argentina", awayTeam: "Por definir I4", date: "2026-06-16T13:00:00Z", group: "I", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Colombia", awayTeam: "Senegal", date: "2026-06-16T16:00:00Z", group: "I", venue: "Hard Rock Stadium", city: "Miami" },
  { homeTeam: "Francia", awayTeam: "Por definir J4", date: "2026-06-16T19:00:00Z", group: "J", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Camerún", awayTeam: "Por definir J3", date: "2026-06-16T22:00:00Z", group: "J", venue: "AT&T Stadium", city: "Dallas" },
  
  // 17 de junio 2026
  { homeTeam: "Inglaterra", awayTeam: "Por definir K4", date: "2026-06-17T13:00:00Z", group: "K", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Nigeria", awayTeam: "Por definir K3", date: "2026-06-17T16:00:00Z", group: "K", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Portugal", awayTeam: "Por definir L4", date: "2026-06-17T19:00:00Z", group: "L", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Ghana", awayTeam: "Por definir L3", date: "2026-06-17T22:00:00Z", group: "L", venue: "Levi's Stadium", city: "San Francisco" },
  
  // ============= JORNADA 2 =============
  
  // 18 de junio 2026
  { homeTeam: "Sudáfrica", awayTeam: "Corea del Sur", date: "2026-06-18T15:00:00Z", group: "A", venue: "Estadio Azteca", city: "Ciudad de México" },
  { homeTeam: "Por definir A4", awayTeam: "México", date: "2026-06-18T21:00:00Z", group: "A", venue: "Estadio Akron", city: "Guadalajara" },
  { homeTeam: "Por definir B4", awayTeam: "Catar", date: "2026-06-18T18:00:00Z", group: "B", venue: "BMO Field", city: "Toronto" },
  
  // 19 de junio 2026
  { homeTeam: "Suiza", awayTeam: "Canadá", date: "2026-06-19T15:00:00Z", group: "B", venue: "BC Place", city: "Vancouver" },
  { homeTeam: "Marruecos", awayTeam: "Haití", date: "2026-06-19T18:00:00Z", group: "C", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Escocia", awayTeam: "Brasil", date: "2026-06-19T21:00:00Z", group: "C", venue: "Gillette Stadium", city: "Boston" },
  
  // 20 de junio 2026
  { homeTeam: "Paraguay", awayTeam: "Australia", date: "2026-06-20T15:00:00Z", group: "D", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "Por definir D4", awayTeam: "Estados Unidos", date: "2026-06-20T21:00:00Z", group: "D", venue: "Levi's Stadium", city: "San Francisco" },
  { homeTeam: "Curazao", awayTeam: "Costa de Marfil", date: "2026-06-20T18:00:00Z", group: "E", venue: "NRG Stadium", city: "Houston" },
  
  // 21 de junio 2026
  { homeTeam: "Ecuador", awayTeam: "Alemania", date: "2026-06-21T15:00:00Z", group: "E", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Japón", awayTeam: "Por definir F4", date: "2026-06-21T18:00:00Z", group: "F", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Túnez", awayTeam: "Países Bajos", date: "2026-06-21T21:00:00Z", group: "F", venue: "Estadio BBVA", city: "Monterrey" },
  
  // 22 de junio 2026
  { homeTeam: "Cabo Verde", awayTeam: "Arabia Saudita", date: "2026-06-22T15:00:00Z", group: "H", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Uruguay", awayTeam: "España", date: "2026-06-22T21:00:00Z", group: "H", venue: "Hard Rock Stadium", city: "Miami" },
  { homeTeam: "Egipto", awayTeam: "Irán", date: "2026-06-22T18:00:00Z", group: "G", venue: "Lumen Field", city: "Seattle" },
  
  // 23 de junio 2026
  { homeTeam: "Nueva Zelanda", awayTeam: "Bélgica", date: "2026-06-23T15:00:00Z", group: "G", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "Por definir I4", awayTeam: "Colombia", date: "2026-06-23T18:00:00Z", group: "I", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Senegal", awayTeam: "Argentina", date: "2026-06-23T21:00:00Z", group: "I", venue: "Hard Rock Stadium", city: "Miami" },
  
  // 24 de junio 2026
  { homeTeam: "Por definir J4", awayTeam: "Camerún", date: "2026-06-24T15:00:00Z", group: "J", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Por definir J3", awayTeam: "Francia", date: "2026-06-24T21:00:00Z", group: "J", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Por definir K4", awayTeam: "Nigeria", date: "2026-06-24T18:00:00Z", group: "K", venue: "MetLife Stadium", city: "Nueva York" },
  
  // 25 de junio 2026
  { homeTeam: "Por definir K3", awayTeam: "Inglaterra", date: "2026-06-25T15:00:00Z", group: "K", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { homeTeam: "Por definir L4", awayTeam: "Ghana", date: "2026-06-25T18:00:00Z", group: "L", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Por definir L3", awayTeam: "Portugal", date: "2026-06-25T21:00:00Z", group: "L", venue: "Levi's Stadium", city: "San Francisco" },
  
  // ============= JORNADA 3 =============
  
  // 26 de junio 2026
  { homeTeam: "México", awayTeam: "Corea del Sur", date: "2026-06-26T18:00:00Z", group: "A", venue: "Estadio Azteca", city: "Ciudad de México" },
  { homeTeam: "Sudáfrica", awayTeam: "Por definir A4", date: "2026-06-26T18:00:00Z", group: "A", venue: "Estadio Akron", city: "Guadalajara" },
  { homeTeam: "Canadá", awayTeam: "Catar", date: "2026-06-26T21:00:00Z", group: "B", venue: "BMO Field", city: "Toronto" },
  { homeTeam: "Suiza", awayTeam: "Por definir B4", date: "2026-06-26T21:00:00Z", group: "B", venue: "BC Place", city: "Vancouver" },
  
  // 27 de junio 2026
  { homeTeam: "Brasil", awayTeam: "Haití", date: "2026-06-27T15:00:00Z", group: "C", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Marruecos", awayTeam: "Escocia", date: "2026-06-27T15:00:00Z", group: "C", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Estados Unidos", awayTeam: "Australia", date: "2026-06-27T21:00:00Z", group: "D", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "Paraguay", awayTeam: "Por definir D4", date: "2026-06-27T21:00:00Z", group: "D", venue: "Levi's Stadium", city: "San Francisco" },
  { homeTeam: "Alemania", awayTeam: "Costa de Marfil", date: "2026-06-27T18:00:00Z", group: "E", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Ecuador", awayTeam: "Curazao", date: "2026-06-27T18:00:00Z", group: "E", venue: "Lincoln Financial Field", city: "Filadelfia" },
  
  // 28 de junio - Grupo F y G
  { homeTeam: "Países Bajos", awayTeam: "Por definir F4", date: "2026-06-28T15:00:00Z", group: "F", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Japón", awayTeam: "Túnez", date: "2026-06-28T15:00:00Z", group: "F", venue: "Estadio BBVA", city: "Monterrey" },
  { homeTeam: "Bélgica", awayTeam: "Irán", date: "2026-06-28T18:00:00Z", group: "G", venue: "Lumen Field", city: "Seattle" },
  { homeTeam: "Egipto", awayTeam: "Nueva Zelanda", date: "2026-06-28T18:00:00Z", group: "G", venue: "SoFi Stadium", city: "Los Ángeles" },
  { homeTeam: "España", awayTeam: "Arabia Saudita", date: "2026-06-28T21:00:00Z", group: "H", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Uruguay", awayTeam: "Cabo Verde", date: "2026-06-28T21:00:00Z", group: "H", venue: "Hard Rock Stadium", city: "Miami" },
  
  // 29 de junio - Grupos I, J, K, L
  { homeTeam: "Argentina", awayTeam: "Senegal", date: "2026-06-29T15:00:00Z", group: "I", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { homeTeam: "Colombia", awayTeam: "Por definir I4", date: "2026-06-29T15:00:00Z", group: "I", venue: "Hard Rock Stadium", city: "Miami" },
  { homeTeam: "Francia", awayTeam: "Por definir J3", date: "2026-06-29T18:00:00Z", group: "J", venue: "NRG Stadium", city: "Houston" },
  { homeTeam: "Camerún", awayTeam: "Por definir J4", date: "2026-06-29T18:00:00Z", group: "J", venue: "AT&T Stadium", city: "Dallas" },
  { homeTeam: "Inglaterra", awayTeam: "Por definir K3", date: "2026-06-29T21:00:00Z", group: "K", venue: "MetLife Stadium", city: "Nueva York" },
  { homeTeam: "Nigeria", awayTeam: "Por definir K4", date: "2026-06-29T21:00:00Z", group: "K", venue: "Lincoln Financial Field", city: "Filadelfia" },
  
  // 30 de junio - Grupo L
  { homeTeam: "Portugal", awayTeam: "Por definir L3", date: "2026-06-30T15:00:00Z", group: "L", venue: "Gillette Stadium", city: "Boston" },
  { homeTeam: "Ghana", awayTeam: "Por definir L4", date: "2026-06-30T15:00:00Z", group: "L", venue: "Levi's Stadium", city: "San Francisco" },
];
