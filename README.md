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
* Projected Scores when not logged in

MAJOR FEATURES:
* Draft
* Lineup

SMALL ENHANCEMENTS
* Encrypt Cookies and un-encrypt in function
* Tagging of players with 1:many tags
* More data
** Roster vs IR spot: https://www63.myfantasyleague.com/2020/export?TYPE=rosters&L=24385&APIKEY=&FRANCHISE=&W=&JSON=1
** Matchup/Schedule: https://api.myfantasyleague.com/2020/export?TYPE=nflSchedule&W=&JSON=1
** BYE Week: https://api.myfantasyleague.com/2020/export?TYPE=nflByeWeeks&W=&JSON=1
* Other Rankings Sources
** Weekly
** Rest of Season
** Dynasty