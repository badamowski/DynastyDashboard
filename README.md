# DynastyDashboard

Pre installations:
Install Grunt CLI: npm install -g grunt-cli
Install Netlify CLI: npm install netlify-cli -g
npm install

Run Locally:
grunt default
netlify dev

MFL Doc: https://www63.myfantasyleague.com/2020/api_info?STATE=test&CCAT=export&TYPE=players&L=24385

BUGS:
* Should only call Dynasty 101 once if an error occurs... Update cache with hardcoded value and tier 

MAJOR FEATURES:
* Trade
* Waiver
* Draft
* Lineup
* Usage without login

SMALL ENHANCEMENTS
* Tagging of players with 1:many tags
* More data
** Roster vs IR spot: https://www63.myfantasyleague.com/2020/export?TYPE=rosters&L=24385&APIKEY=&FRANCHISE=&W=&JSON=1
** Projected Scores: https://www63.myfantasyleague.com/2020/export?TYPE=projectedScores&L=24385&APIKEY=&W=&PLAYERS=&POSITION=&STATUS=&COUNT=&JSON=1
** Injuries: https://api.myfantasyleague.com/2020/export?TYPE=injuries&W=&JSON=1
** Matchup/Schedule: https://api.myfantasyleague.com/2020/export?TYPE=nflSchedule&W=&JSON=1
** BYE Week: https://api.myfantasyleague.com/2020/export?TYPE=nflByeWeeks&W=&JSON=1
* Other Rankings Sources
** Weekly
** Rest of Season
** Dynasty
* Include picks in generic player search for compare - most valuable for use without login