
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  status: 'active' | 'inactive';
}

export const players: Player[] = [
  { id: '1', firstName: 'Alessio', lastName: 'Argenti', status: 'active' },
  { id: '2', firstName: 'Alessio', lastName: 'Iervolino', status: 'active' },
  { id: '3', firstName: 'Matteo', lastName: 'Medile', status: 'active' },
  { id: '4', firstName: 'Marco', lastName: 'Pitingolo', status: 'active' },
  { id: '5', firstName: 'Alessandro', lastName: 'Contu', status: 'active' },
  { id: '6', firstName: 'Marco', lastName: 'Azzi', status: 'active' },
  { id: '7', firstName: 'Jacopo', lastName: "D'Astolto", status: 'active' },
  { id: '8', firstName: 'Andrea', lastName: 'Camolese', status: 'active' },
  { id: '9', firstName: 'Giacomo', lastName: 'Caggiano', status: 'active' },
  { id: '10', firstName: 'Mario', lastName: 'Bervicato', status: 'active' },
  { id: '11', firstName: 'Luigi', lastName: 'Russo', status: 'active' },
  { id: '12', firstName: 'Vito', lastName: 'Tessitore', status: 'active' },
  { id: '13', firstName: 'Raffaele', lastName: 'Lanzaro', status: 'active' },
  { id: '14', firstName: 'Riccardo', lastName: 'Perna', status: 'active' },
  { id: '15', firstName: 'Nicola', lastName: 'Leuci', status: 'active' },
  { id: '16', firstName: 'Nathan', lastName: 'Habib', status: 'active' },
  { id: '17', firstName: 'Matteo', lastName: 'Cascone', status: 'active' },
  { id: '18', firstName: 'Lucio', lastName: 'De Crescenzo', status: 'active' },
  { id: '19', firstName: 'Gianmichele', lastName: 'Cossu', status: 'active' },
  { id: '20', firstName: 'Daniele', lastName: 'Moscato', status: 'active' },
  { id: '21', firstName: 'Andrea', lastName: 'Argenti', status: 'active' },
  { id: '22', firstName: 'Alessandro', lastName: 'Rossi', status: 'active' },
  { id: '23', firstName: 'Maurizio', lastName: 'Liguori', status: 'active' }
];
