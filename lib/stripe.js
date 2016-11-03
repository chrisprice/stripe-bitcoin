const stripeFactory = require('stripe');

const satoshisPerBitcoin = 1e8;

module.exports = ({ secretKey }) => {
  const stripe = stripeFactory(secretKey);

  const createCharge = ({ address, amount, source }) =>
    new Promise((resolve, reject) => {
      const cb = (err, charge) => {
        if (err) {
          return reject(err);
        }
        resolve(charge);
      };
      stripe.charges.create({
        source,
        currency: 'gbp',
        amount,
        description: `tuckshop:${address}`,
        expand: ['balance_transaction']
      }, cb);
    });

  const createTransaction = ({ address, amount, source }) =>
    createCharge({ address, amount, source })
      .then(charge => {
        const amountSatoshis = charge['balance_transaction'].net / 100 * satoshisPerBitcoin;
        return { message: charge.id, amount: amountSatoshis, address };
      });

  return { createTransaction };
};
