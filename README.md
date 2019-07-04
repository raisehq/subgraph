#Concepts or How it works
- there are three main parts of the subgraph:
   - subgraph.yaml: 
      here we define the schema where the subgraph will know what smartcontracts to get from which addresses and it will do the mapping between the contract abi methods and our own methods deffined in the mapping section.
   - subgraph.graphql:
      Here we define the entities that the subgraph will store in its own database. It will also deffine what queries we will be able to do with graphql
   - mappings:
      Here is deffined the logic that will happen for each event mapped in the subgraph.yaml

- every time you modify something in subgraph.yaml or graphql you have to run the codegen instruction and then the build to check if there are any errors before deployment.
- if you only modify the mappings with only running the build instruction it is enough before deployment.

- As the the subraph.yaml is instatiated with concrete contract addresses if we redeploy new contracts we will need to change the addresses in the yaml. But if we still want to get the old contract events we will have to create a new data-source with the  new address in the yaml, instead of only changeing the address.

# Deployment Instructions

##authenticate to our thegraph account
   - Run `graph auth https://api.thegraph.com/deploy/ <access-token>`
     to authenticate with the hosted service. You can get the access token from
     https://thegraph.com/explorer/dashboard/.

##First steps when downloaded
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

##To deploy to a local Grpah:
   0. follow steps from docs
   1. add require URL to graph-cli commands\create and \deploy to make it work if it doesn't work with the standard instructions
   2. add ethereum: 'dev:http://172.20.0.1:8545' to graph-node docker-compose
   3. start ganache as: ganache-cli -h 0.0.0.0
   4. follow instructions from docs