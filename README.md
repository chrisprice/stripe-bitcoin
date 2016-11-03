A very simplistic Stripe card payment handler for auto-magically exchanging GBP/BTC for ScottCoins. ScottCoins are Scott Logic's permissioned blockchain currency (more accurately/legally tokens), predominantly used for buying Monster Munch from the tuck shop.

To run your own copy, you'll need to create a "hot" wallet (just a wallet with funds in it you'd be happy to potentially lose) and have a Stripe account.

Now create a configuration file -

```json
{
  "mnemonic": "some random collection of words",
  "secretKey": "sk_test_abcdefghijklmnopqrstuvwxyz",
  "publishableKey": "pk_test_abcdefghijklmnopqrstuvwxyz",
  "bws": "https://bws.bitpay.com/bws/api"
}
```

The `mnemonic` should match the backup phrase from your hot wallet, obviously keep this secret. The `secretKey` can be found in your [Stripe account settings](https://dashboard.stripe.com/account/apikeys), again keep it secret. The `publishableKey` can be found in the same place but as the name suggests is less secret. Finally `bws` is the URL the `bitcore-wallet-client` should connect to (we point it at our ScottCoin insance), not necessarily secret.

Now run up the docker image with the configuration file mounted at `/app/config.json` and publish the port behind some form of HTTPS offload. N.B. HTTPS is required to ensure the secret doesn't become un-secret which would allow someone to plunder your hot wallet funds.
