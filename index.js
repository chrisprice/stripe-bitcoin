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
    app.use(express.static('public'));

    app.get('/:address/:amount', (req, res) => {
      const amount = Number(req.params.amount);
      res.send(`
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
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

    app.get('/applepay/:address/:amount', (req, res) => {
      const amount = Number(req.params.amount);
      res.send(`
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body>
  <form id="apple-pay-form" action="" method="POST">
    <input type="hidden" name="stripeToken"/>
    <style>
      body {
        overflow: hidden;
      }
      #apple-pay-button {
        display: none;
        background-color: black;
        background-image: -webkit-named-image(apple-pay-logo-white);
        background-size: 100% 100%;
        background-origin: content-box;
        background-repeat: no-repeat;
        width: 100%;
        height: 44px;
        padding: 10px 0;
        border-radius: 10px;
      }
    </style>
    <h1>Topup your Scottcoin balance</h1>
    <p>Add funds to your Scottcoin balance using Apple Pay. The standard £0.20 + 1.4% transaction fee applies as with all card transactions.</p>
    <button id="apple-pay-button"></button>
    <script type="text/javascript" src="https://js.stripe.com/v2/"></script>
    <script>
      Stripe.setPublishableKey('${publishableKey}');
      Stripe.applePay.checkAvailability(function(available) {
        if (available) {
          document.getElementById('apple-pay-button').style.display = 'block';
        }
      });
      function beginApplePay(e) {
        var paymentRequest = {
          countryCode: 'GB',
          currencyCode: 'GBP',
          total: {
            label: 'Scottcoin Topup',
            amount: '${(amount / 100).toFixed(2)}'
          },
          requiredShippingContactFields: ['email']
        };
        var session = Stripe.applePay.buildSession(paymentRequest,
          function(result, completion) {
            completion(ApplePaySession.STATUS_SUCCESS);
            var form = document.getElementById('apple-pay-form');
            form.elements.stripeToken.value = result.token.id;
            form.submit();
          },
          function(error) {
            console.log(error.message);
          }
        );
        session.begin();
        e.preventDefault();
      }
      document.getElementById('apple-pay-button')
        .addEventListener('click', beginApplePay);
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
