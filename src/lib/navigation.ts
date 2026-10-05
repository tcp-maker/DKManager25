export type AppView = 'team' | 'transfers' | 'matches' | 'stadium' | 'club' | 'economy' | 'table';

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
  economy: 'economy',
  okonomi: 'economy',
  økonomi: 'economy',
  table: 'table',
  tabel: 'table',
};

export const resolveAppView = (hash: string, pathname: string): AppView => {
  const safelyDecode = (value: string) => {
    try {
      return decodeURIComponent(value).toLowerCase();
    } catch {
      return '';
    }
  };
  const hashView = safelyDecode(hash.replace(/^#/, ''));
  const pathView = safelyDecode(pathname.replace(/^\/+/, '').split('/')[0] ?? '');
  return viewAliases[hashView] ?? viewAliases[pathView] ?? 'team';
};
