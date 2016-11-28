const readFileSync = require('fs').readFileSync;
const express = require('express');
const bodyParser = require('body-parser');
const wallet = require('./lib/wallet');
const stripe = require('./lib/stripe');

const configPath = process.argv[2];
const { publishableKey, secretKey, mnemonic, bws } = JSON.parse(readFileSync(configPath, 'utf8'));

wallet({ bws, mnemonic })
  .then(({ send }) => {

    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));

    app.get('/:address/:amount', (req, res) => {
      const amount = Number(req.params.amount);
      res.send(`
<!doctype html>
<html>
<body>
  <form action="" method="POST">
    <script
      src="https://checkout.stripe.com/checkout.js" class="stripe-button"
      data-key="${publishableKey}"
      data-amount="${amount}"
      data-name="Tuckshop"
      data-description="Topup"
      data-currency="gbp"
      data-bitcoin="true">
    </script>
  </form>
</body>
</html>`);
    });

    app.post('/:address/:amount', (req, res) => {

      const { address, amount } = req.params;

      stripe({ secretKey })
        .createTransaction({ address, amount, source: req.body.stripeToken })
        .then((transaction) => {
          console.log(`Sending ${transaction.amount} to ${transaction.address} (${transaction.message})`);
          return send(transaction)
            .then(() => transaction);
        })
        .then((transaction) => {
          console.log(`Sent ${transaction.amount} to ${transaction.address} (${transaction.message})`);
          res.sendStatus(200);
        })
        .catch((e) => {
          console.error(e);
          res.sendStatus(500);
        });
    });

    app.listen(3000, () => console.log('Listening on port 3000'));
  })
  .catch(console.error);
