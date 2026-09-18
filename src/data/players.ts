import { Player, normalizePlayer } from '../types/players';

const starterPlayers: Player[] = [
  { id: '1', name: 'Peter Vindahl', age: 28, position: 'GK', rating: 78, value: 500000, isForSale: false, abilities: { reflexer: 86, pasninger: 66, teknik: 70 } },
  { id: '2', name: 'Karl-Johan Johnsson', age: 34, position: 'GK', rating: 75, value: 300000, isForSale: true, askingPrice: 350000, abilities: { reflexer: 82, fysik: 74 } },
  { id: '3', name: 'Henrik Dalsgaard', age: 31, position: 'DF', rating: 79, value: 600000, isForSale: false, abilities: { tackling: 85, fysik: 82, pasninger: 68 } },
  { id: '4', name: 'Andreas Bjelland', age: 32, position: 'DF', rating: 76, value: 450000, isForSale: false, abilities: { tackling: 81, teknik: 66 } },
  { id: '5', name: 'Jens Martin Hauge', age: 23, position: 'DF', rating: 71, value: 400000, isForSale: true, askingPrice: 450000, abilities: { fysik: 77, pasninger: 64 } },
  { id: '6', name: 'Markus Halsti', age: 26, position: 'DF', rating: 74, value: 380000, isForSale: false, abilities: { tackling: 79, fysik: 78 } },
  { id: '7', name: 'Kristoffer Olsson', age: 25, position: 'MF', rating: 76, value: 520000, isForSale: false, abilities: { pasninger: 86, teknik: 84 } },
  { id: '8', name: 'Rasmus Nissen', age: 27, position: 'MF', rating: 73, value: 420000, isForSale: false, abilities: { fysik: 73, pasninger: 77 } },
  { id: '9', name: 'Marcus Ingvartsen', age: 24, position: 'MF', rating: 72, value: 450000, isForSale: true, askingPrice: 500000, abilities: { afslutning: 75, teknik: 76 } },
  { id: '10', name: 'Filip Tronild', age: 22, position: 'MF', rating: 68, value: 280000, isForSale: false, abilities: { pasninger: 74, teknik: 72 } },
  { id: '11', name: 'Karlo Bartolec', age: 26, position: 'FW', rating: 80, value: 750000, isForSale: false, abilities: { afslutning: 88, teknik: 84, fysik: 80 } },
  { id: '12', name: 'Tyrik Wonder', age: 24, position: 'FW', rating: 77, value: 600000, isForSale: false, abilities: { afslutning: 84, fysik: 78 } },
  { id: '13', name: 'Samuel Mráz', age: 28, position: 'FW', rating: 74, value: 500000, isForSale: true, askingPrice: 550000, abilities: { afslutning: 80, pasninger: 72 } },
];

const transferMarketPlayers: Player[] = [
  { id: 'buy1', name: 'Pione Sisto', age: 27, position: 'FW', rating: 79, value: 650000, isForSale: false, abilities: { teknik: 87, afslutning: 83, pasninger: 75 } },
  { id: 'buy2', name: 'Paul Onuachu', age: 29, position: 'FW', rating: 81, value: 800000, isForSale: false, abilities: { afslutning: 89, fysik: 88 } },
  { id: 'buy3', name: 'Magnus Andersen', age: 26, position: 'MF', rating: 75, value: 550000, isForSale: false, abilities: { pasninger: 84, teknik: 81 } },
  { id: 'buy4', name: 'Nicolai Vallys', age: 24, position: 'DF', rating: 72, value: 420000, isForSale: false, abilities: { tackling: 76, pasninger: 67 } },
  { id: 'buy5', name: 'Jesper Hansen', age: 30, position: 'GK', rating: 76, value: 380000, isForSale: false, abilities: { reflexer: 83, teknik: 69 } },
];

export const STARTER_PLAYERS = starterPlayers.map(normalizePlayer);

export const TRANSFER_MARKET_PLAYERS = transferMarketPlayers.map(normalizePlayer);
