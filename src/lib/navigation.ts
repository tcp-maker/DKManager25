export type AppView = 'team' | 'transfers' | 'matches' | 'stadium' | 'club' | 'table';

const viewAliases: Record<string, AppView> = {
  team: 'team',
  trup: 'team',
  transfers: 'transfers',
  transfer: 'transfers',
  matches: 'matches',
  kampe: 'matches',
  stadium: 'stadium',
  stadion: 'stadium',
  club: 'club',
  klub: 'club',
  economy: 'club',
  okonomi: 'club',
  økonomi: 'club',
  table: 'table',
  tabel: 'table',
};

export const resolveAppView = (hash: string, pathname: string): AppView => {
  const hashView = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase();
  const pathView = decodeURIComponent(pathname.replace(/^\/+/, '').split('/')[0] ?? '').toLowerCase();
  return viewAliases[hashView] ?? viewAliases[pathView] ?? 'team';
};
