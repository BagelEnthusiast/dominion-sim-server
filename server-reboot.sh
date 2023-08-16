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