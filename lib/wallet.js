const Client = require('bitcore-wallet-client');

module.exports = ({ bws, mnemonic }) => {
  const client = new Client({
    baseUrl: bws,
    verbose: false
  });

  const importFromMnemonic = () => new Promise((resolve, reject) => {
    client.importFromMnemonic(mnemonic, null, (error) => {
      if (error) {
        return reject(new Error(`Import failed for ${mnemonic}: ${error}`));
      }
      resolve();
    });
  });

  const open = () => new Promise((resolve, reject) => {
    client.openWallet((error, walletInfo) => {
      if (error) {
        return reject(new Error(`Open failed: ${error}`));
      }
      resolve();
    });
  });

  const getFee = () => new Promise((resolve, reject) => {
    client.getFeeLevels('livenet', (error, feeLevels) => {
      if (error) {
        return reject(new Error(`Get fee levels failed: ${error}`));
      }
      resolve(feeLevels);
    });
  })
  .then((feeLevels) => feeLevels[0].feePerKB);

  const createTxProposal = (options) =>
    (feePerKb) => new Promise((resolve, reject) => {
      client.createTxProposal(Object.assign({ feePerKb }, options), (error, proposal) => {
        if (error) {
          return reject(new Error(`Create failed: ${error}`));
        }
        resolve(proposal);
      });
    });

  const signTxProposal = (proposal) => new Promise((resolve, reject) => {
    client.signTxProposal(proposal, (error, proposal) => {
      if (error) {
        return reject(new Error(`Sign failed: ${error}`));
      }
      resolve(proposal);
    });
  });

  const publishTxProposal = (proposal) => new Promise((resolve, reject) => {
    client.publishTxProposal({ txp: proposal }, (error, proposal) => {
      if (error) {
        return reject(new Error(`Publish failed: ${error}`));
      }
      resolve(proposal);
    });
  });

  const broadcastTxProposal = (proposal) => new Promise((resolve, reject) => {
    client.broadcastTxProposal(proposal, (error, proposal) => {
      if (error) {
        return reject(new Error(`Broadcast failed: ${error}`));
      }
      resolve(proposal);
    });
  });

  const send = ({ address, amount, message }) => {
    const outputs = [
      {
        toAddress: address,
        amount,
        message
      }
    ];
    // Allow spending of unconfirmed transaction outputs to mitigate block generation time. This
    // is unnecessary on our permissioned blockhain.
    const excludeUnconfirmedUtxos = false;
    return getFee()
      .then(createTxProposal({ toAddress: address, outputs, message, excludeUnconfirmedUtxos }))
      .then(publishTxProposal)
      .then(signTxProposal)
      .then(broadcastTxProposal);
  };

  return importFromMnemonic()
    .then(open)
    .then(() => ({ send }));
};
