# authenticate to our thegraph account
   - Run `graph auth https://api.thegraph.com/deploy/ <access-token>`
     to authenticate with the hosted service. You can get the access token from
     https://thegraph.com/explorer/dashboard/.

#First steps when downloaded
   1. to autogenerate the necessary libraries and files necessary tu run the subgraph. Execute every time you change the ```subraph.yaml``` or ```schema.graphql``` or add a new ```abi```:
   ```
   npm run codegen
   ```
   2. to build the subgraph execute:
   ```
   npm run build
   ```
   3. If step 1 and 2 are sucsessfull, to deploy execute:
   ```
   npm run deploy
   ```

#To deploy to a local Grpah:
   0. follow steps from docs
   1. add require URL to graph-cli commands\create and \deploy to make it work if it doesn't work with the standard instructions
   2. add ethereum: 'dev:http://172.20.0.1:8545' to graph-node docker-compose
   3. start ganache as: ganache-cli -h 0.0.0.0
   4. follow instructions from docs