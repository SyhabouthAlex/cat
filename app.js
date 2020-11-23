const abiDecoder = require('abi-decoder');
const axios = require('axios');

const birthEvent = [
    {
        "anonymous":false,
        "inputs":[
            {
                "indexed":false,
                "name":"owner",
                "type":"address"
            },
            {
                "indexed":false,
                "name":"kittyId",
                "type":"uint256"
            },
            {
                "indexed":false,
                "name":"matronId",
                "type":"uint256"
            },
            {
                "indexed":false,
                "name":"sireId",
                "type":"uint256"
            },
            {
                "indexed":false,
                "name":"genes",
                "type":"uint256"
            }
        ],
        "name":"Birth",
        "type":"event"
    }
];
abiDecoder.addABI(birthEvent);

const cryptoKittiesAddress = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d";
const birthTopic = "0x0a5311bd2a6608f08a180df2ee7c5946819a649b204b554bb8e39825b2c50ad5";
const startBlock = 6607985;
const endBlock = 7028323;

async function getBirths(currentBlock, address, topic) {
    const catBirths = {};

    const currentBlockHex = currentBlock.toString(16);
    const endBlockHex = currentBlock + 5000 < endBlock ? (currentBlock + 5000).toString(16) : endBlock.toString(16);
    const response = await axios.post("https://mainnet.infura.io/v3/c950404a25dd4a85b0f2761d4e364316", {
        "jsonrpc": "2.0",
        "id": 1, 
        "method": "eth_getLogs",
        "params": [{
            "address": address,
            "fromBlock": `0x${currentBlockHex}`,
            "toBlock": `0x${endBlockHex}`,
            "topics": [topic]
        }]
    });
    const decodedLogs = abiDecoder.decodeLogs(response.data.result)
    for (const log of decodedLogs) {
        const matronId = log.events[2].value;
        if (matronId !== "0") {
            if (!(matronId in catBirths)) catBirths[matronId] = 1;
            else catBirths[matronId]++;
        }
    }

    return {
        catBirths, 
        births: decodedLogs.length
    };
}

async function getBirthsInRange(startBlock, endBlock, address, topic) {
    const allCatBirths = {};
    let mostBirths = 0;
    let mostBirthsCat = null;
    let totalBirths = 0;

    const promises = [];
    for (let i = startBlock; i < endBlock; i += 5000) {
        promises.push(getBirths(i, address, topic));
    }

    const result = await Promise.all(promises);
    
    for (const values of result) {
        totalBirths += values["births"];
        for (const cat in values["catBirths"]) {
            if (!(cat in allCatBirths)) allCatBirths[cat] = values["catBirths"][cat]
            else allCatBirths[cat] += values["catBirths"][cat]

            if (allCatBirths[cat] > mostBirths) {
                mostBirths = allCatBirths[cat];
                mostBirthsCat = cat;
            }
        }
    }
    console.log(mostBirths, mostBirthsCat, totalBirths)
}

getBirthsInRange(startBlock, endBlock, cryptoKittiesAddress, birthTopic);