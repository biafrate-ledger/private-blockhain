/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        let self = this;
        return new Promise((resolve, reject) => {
            resolve(self.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't forget 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    async _addBlock(newBlock) {
        let self = this;
        
            try {
                newBlock.height = self.chain.length;
                let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
                newBlock.time = currentTime
                if (self.chain.length > 0) {
                    newBlock.previousBlockHash = self.chain[self.chain.length - 1].hash;
                }

                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                self.chain.push(newBlock);
                const newChainValidation = await self.validateChain(); 
                console.log(newChainValidation);
                return(newBlock);
            }

            catch (err) {
                console.log(err);
                return(err);
              }
           
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve, reject) => {

            try {
                let message = "";
                let date = "";
                date = new Date().getTime().toString().slice(0,-3);
                message = address + ":" + date + ":starRegistry";
                console.log (message);
                resolve(message);
            }

            catch (err) {
                console.log(err);
                reject(err);
              }
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    async submitStar(address, message, signature, star) {
        let self = this;
        

            let messageTime = parseInt(message.split(':')[1]);
            console.log (messageTime);

            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            console.log(currentTime);

            let isTimeLessThanFiveMin = (currentTime - messageTime < 5*60) ? true : false;
            console.log (isTimeLessThanFiveMin);

            let isSignatureVerified = bitcoinMessage.verify(message, address, signature);
            console.log (isSignatureVerified);

            if (isTimeLessThanFiveMin && isSignatureVerified) {
                try {
                    let data = {
                        address: address,
                        message: message,
                        signature: signature,
                        star: star
                    }
                    console.log (data); 
                    let newBlock = new BlockClass.Block(data);
                    await this._addBlock(newBlock);
                    return(newBlock);
                }
                catch (err) {
                    console.log(err);
                    return(err);
                  }
            }

            else { 
                
                return("invalid request: identity verification is " + isSignatureVerified + " time verification is " + isTimeLessThanFiveMin)}

            
        
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {

            const filteredBlock = self.chain.filter(block => block.hash === hash);
            console.log (filteredBlock)

            if (filteredBlock.length > 0) {
                resolve (filteredBlock[0]);
            }

            else {
                reject ("No block with that hash")
            }
           
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    async getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        
        let starBlocks = self.chain.slice(1);

            try {
                for (const starBlock of starBlocks) {
                    const starBlockData = await starBlock.getBData();
                    if (starBlockData.address === address)
                        {
                            let starBlockDataByOwner = {
                                owner: starBlockData.address,
                                star: starBlockData.star
                            }
                            stars.push(starBlockDataByOwner);
                        }
                }
                return (stars);
            }

            catch (err) {
                console.log(err);
                return(err);
              }
            
        
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    async validateChain() {
        let self = this;
    
        let chainValidation = {
            isChainValid: true,
            errorLog: []
        }

        

            try {
                for (var i = 0; i < self.chain.length; i++) {
                    let blockErrors = {
                        blockHeight: i,
                        isBlockValid: null,
                        isPreviousHashValid: null
                    }

                    const isBlockValid = await self.chain[i].validate();
                    if (isBlockValid !== true)
                        {
                            blockErrors.isBlockValid = isBlockValid;
                            chainValidation.isChainValid = false;
                        }

                    if (i > 0) {
                        const isPreviousHashValid = (self.chain[i].previousBlockHash === self.chain[i-1].hash) ? true : false; 
                        if (isPreviousHashValid !== true) 
                            {
                                blockErrors.isPreviousHashValid = isPreviousHashValid;
                                chainValidtion.isChainValid = false;
                            }
                    } 
                    chainValidation.errorLog.push(blockErrors);  
                }
                return (chainValidation);
            }

            catch (err) {
                console.log(err);
                return(err);
              }
            
    }

}

module.exports.Blockchain = Blockchain;   