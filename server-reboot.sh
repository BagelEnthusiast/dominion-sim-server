# this is a helper script

###############################
# sshlinode
# cd dominion-sim-server
# ./server-reboot.sh


# to fix?
# sed -i 's/\r//g' server-reboot.sh

###############################

# ensure node is correct version
nvm i $(cat .nvmrc)
nvm use

# stop any existing server process
npm run forever-stop

# update
git pull
nvm i $(cat .nvmrc)
nvm use
npm i

# run
npm run forever-start
