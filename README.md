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

MAJOR FEATURES:
* Draft
* Lineup

SMALL ENHANCEMENTS
* No login features
** Projected Scores
** Better viewing of all players? Search seems like a lot of clicks. Load top 100?
* Tagging of players with 1:many tags
* More data
** Roster vs IR spot: https://www63.myfantasyleague.com/2020/export?TYPE=rosters&L=24385&APIKEY=&FRANCHISE=&W=&JSON=1
** Matchup/Schedule: https://api.myfantasyleague.com/2020/export?TYPE=nflSchedule&W=&JSON=1
** BYE Week: https://api.myfantasyleague.com/2020/export?TYPE=nflByeWeeks&W=&JSON=1
* Other Rankings Sources
** Weekly
** Rest of Season
** Dynasty