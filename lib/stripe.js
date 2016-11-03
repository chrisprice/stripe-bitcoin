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
        description: `tuckshop:${address}`
      }, cb);
    });

  const createTransaction = ({ address, amount, source }) =>
    createCharge({ address, amount, source })
      .then(charge => {
        const txFee = Math.round(amount * 0.014 + 20);
        const amountSatoshis = (amount - txFee) / 100 * satoshisPerBitcoin;
        return { message: charge.id, amount: amountSatoshis, address };
      });

  return { createTransaction };
};
