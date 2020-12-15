# DynastyDashboard

Pre installations:
Install Grunt CLI: npm install -g grunt-cli
Install Netlify CLI: npm install netlify-cli -g
npm install

Run Locally:
grunt default
netlify dev

MFL Doc: https://www63.myfantasyleague.com/2020/api_info?STATE=test&CCAT=export&TYPE=players&L=24385

TODO:
* Is date logic on dynasty 101 cache value?
* Tagging of players with 1:many tags
* Draft Pick Value - Estimated based on current standings
** League Standings: https://www63.myfantasyleague.com/2020/export?TYPE=leagueStandings&L=24385&APIKEY=&JSON=1
* More data
** Roster vs IR spot: https://www63.myfantasyleague.com/2020/export?TYPE=rosters&L=24385&APIKEY=&FRANCHISE=&W=&JSON=1
** Projected Scores: https://www63.myfantasyleague.com/2020/export?TYPE=projectedScores&L=24385&APIKEY=&W=&PLAYERS=&POSITION=&STATUS=&COUNT=&JSON=1
** Injuries: https://api.myfantasyleague.com/2020/export?TYPE=injuries&W=&JSON=1
** Matchup/Schedule: https://api.myfantasyleague.com/2020/export?TYPE=nflSchedule&W=&JSON=1
** BYE Week: https://api.myfantasyleague.com/2020/export?TYPE=nflByeWeeks&W=&JSON=1
* More organization - what columns? Static or Dynamic?
* Starting lineup - Drag and Drop