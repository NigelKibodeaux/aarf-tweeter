# aarf-tweeter
Tweets new dogs from alaskananimalrescuefriends.org

## Usage
1. Clone repo
1. `npm install`
1. Rename twitter_creds.json.dist to twitter_creds.json and put some real twitter credentials in there.
1. Run `npm start` at the desired interval to check for and tweet new dogs. You might want to have a cron job for this.

The first time you run it, it will store the current dogs to disk and not tweet anything. The next time, it will check against that list and tweet any dogs that were added.
