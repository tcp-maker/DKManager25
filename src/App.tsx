import React, { useMemo, useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import ConfirmAction from './components/ConfirmAction';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';
import { buildLeagueStandings, getTeamById } from './data/leagues';

const App: React.FC = () => {
  const { gameState, selectTeam, resetGame } = useGame();
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');

  const selectedTeam = gameState.selectedTeam ? (getTeamById(gameState.selectedTeam.id) ?? gameState.selectedTeam) : null;
  const leagueTable = useMemo(
    () => buildLeagueStandings(selectedTeam, gameState.season, gameState.leagueMatches),
    [selectedTeam, gameState.season, gameState.leagueMatches],
  );

  const renderMainView = () => {
    switch (activeView) {
      case 'team':
        return <TeamView />;
      case 'transfers':
        return <TransferMarketView />;
      case 'matches':
        return <MatchView />;
      case 'stadium':
        return <StadiumView />;
      default:
        return <TeamView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={selectTeam} />
      ) : (
        <>
          <nav className="bg-blue-600 text-white p-4">
            <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
              <button onClick={() => setActiveView('team')} className={activeView === 'team' ? 'font-bold' : ''}>Trup</button>
              <button onClick={() => setActiveView('transfers')} className={activeView === 'transfers' ? 'font-bold' : ''}>Transfer</button>
              <button onClick={() => setActiveView('matches')} className={activeView === 'matches' ? 'font-bold' : ''}>Kampe</button>
              <button onClick={() => setActiveView('stadium')} className={activeView === 'stadium' ? 'font-bold' : ''}>Stadion</button>
            </div>
          </nav>

          <div className="max-w-7xl mx-auto px-4 pt-4">
            <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm md:flex md:items-start md:justify-between md:gap-6">
              <div className="mb-4 md:mb-0">
                <p className="text-lg font-semibold text-gray-900">{selectedTeam.name}</p>
                <p className="text-sm text-gray-600">{selectedTeam.league} • Sæson {gameState.season} • Uge {gameState.week}</p>
                <p className="mt-1 text-sm text-gray-500">Nulstil kun spillet, hvis du vil starte helt forfra.</p>
              </div>
              <div className="w-full md:w-80">
                <ConfirmAction
                  label="Nulstil spil"
                  confirmLabel="Bekræft nulstilling"
                  confirmMessage="Dette sletter din nuværende klub, sæson, ligastilling og gemte spiltilstand. Er du sikker på, at du vil starte forfra?"
                  onConfirm={() => {
                    resetGame();
                    setActiveView('team');
                    return null;
                  }}
                  buttonClassName="bg-red-600 hover:bg-red-700 text-white"
                  confirmButtonClassName="bg-red-700 hover:bg-red-800 text-white"
                />
              </div>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2.4fr)_minmax(280px,0.9fr)]">
              <div>{renderMainView()}</div>

              <aside className="xl:sticky xl:top-4 xl:self-start">
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-gray-100 px-4 py-4">
                    <h2 className="text-xl font-bold">Ligatabel</h2>
                    <p className="text-sm text-gray-600">{selectedTeam.league} • Sæson {gameState.season}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Hold</th>
                          <th className="px-3 py-2 text-center">K</th>
                          <th className="px-3 py-2 text-center">+/-</th>
                          <th className="px-3 py-2 text-center">P</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leagueTable.map((team, index) => (
                          <tr
                            key={team.teamId}
                            className={`border-t ${team.teamId === selectedTeam.id ? 'bg-blue-50 font-semibold' : 'bg-white'}`}
                          >
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">{team.teamName}</td>
                            <td className="px-3 py-2 text-center">{team.played}</td>
                            <td className="px-3 py-2 text-center">{team.goalDifference}</td>
                            <td className="px-3 py-2 text-center">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default App;
