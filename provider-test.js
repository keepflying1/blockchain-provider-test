// Tests node websocket times for new block headers.

// Modules
import Web3 from 'web3';
import * as Alchemy from '@alch/alchemy-web3';			
import AWSWebsocketProvider from "/home/ubuntu/lib/vendors/aws/aws-websocket-provider.js";  // <--- switch with you own AWS config
import * as fs from "fs";


// Connect
const web3 				= await connectWeb3("aws", "wss://nd-gtxbdufelrdspaxzfa5blgojhu.wss.ethereum.managedblockchain.us-east-1.amazonaws.com");   //  <-- switch with your own API endpoint.
const web3Alchemy 		= await connectWeb3("alchemy", "wss://eth-mainnet.alchemyapi.io/v2/IACvpR9Rwo28MK-XhC2x_w-smS9pQdsX");						// <-- switch with your own API endpoint.


// Start a subscription to blockchain.
console.log("Beginning to listen for new block headers.");

var blocks = {};
web3Alchemy.eth.subscribe('newBlockHeaders', async function(error, block) {
	printBlocks("alchemy", block.number, getTimestamp(), Date.now());
});
web3.eth.subscribe('newBlockHeaders', async function(error, block) {
	printBlocks("aws", block.number, getTimestamp(), Date.now());
});



// Print the node info when both have received the same block
function printBlocks(nodeType, blockNumber, timeStamp, epoch) {

	// Build block.blockNumber{}.
	if(blocks[blockNumber] == undefined) {
		blocks[blockNumber] = {};
	}
	if (blocks[blockNumber][nodeType] == undefined) {
		blocks[blockNumber][nodeType] = {};
	}

	// Add block info.
	blocks[blockNumber][nodeType] = {"timeStamp": timeStamp, "epoch": epoch};


	// Declare winner.
	if (Object.keys(blocks[blockNumber]).length == 2) {
		blocks[blockNumber]['blockNumber'] = blockNumber;

		if (blocks[blockNumber]['aws'].epoch < blocks[blockNumber]['alchemy'].epoch) {
			blocks[blockNumber]['winner'] = 'aws';	
		}
		else {
			blocks[blockNumber]['winner'] = 'alchemy';	
		}
		blocks[blockNumber]['differenceMs'] 	= Math.abs(blocks[blockNumber]['aws'].epoch - blocks[blockNumber]['alchemy'].epoch);
		blocks[blockNumber]['nodes'] 			= {aws: blocks[blockNumber].aws.timeStamp, alchemy: blocks[blockNumber].alchemy.timeStamp};
		delete blocks[blockNumber]['aws'];
		delete blocks[blockNumber]['alchemy'];

		console.log(blocks[blockNumber]);

		fs.appendFileSync('node-tests.json', JSON.stringify(blocks[blockNumber])+"\n");
	}

}


// Connect to Web3.
export async function connectWeb3(provider, endpoint) {

	// Connect to provider via either websocket or http. 
	var web3;
	if (provider == "aws") {
		web3 = new Web3(new AWSWebsocketProvider(endpoint));
	}
	else if (provider == "alchemy") {
		web3 = Alchemy.createAlchemyWeb3(endpoint);
	}
	else {
		console.log(`ERROR: Provider must be either 'aws' or 'alchemy', '${provider}' was passed.`);
	}

	return web3;
}


// Get timestamp, the standard ISO time annoys me.
function getTimestamp() {
	var dt = new Date;
	return dt.toISOString().replace(/(-\d{2})T(\d{2}:)/, '$1 $2').replace(/\.(\d+)Z/, ":$1");
}