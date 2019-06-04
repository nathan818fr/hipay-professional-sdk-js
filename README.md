# hipay-professional-sdk &middot; [![npm version](https://badge.fury.io/js/hipay-professional-sdk.svg)](https://badge.fury.io/js/hipay-professional-sdk)

[HiPay Professional](https://hipay.com/en/hipay-professional) SDK for NodeJS.
You can create orders (payment pages), capture or refund payments and securely
decode Notifications (callbacks / pingbacks) sent by HiPay.

Note for TypeScript users:
This module build and provide its TypeScript declarations files (.d.ts).

## Getting Started

**Node.js** &middot; Install the module with:
```sh
npm i --save hipay-professional-sdk
```

### Quick Example
```javascript
const HipayClient = require('hipay-professional-sdk').HipayClient;

const hipayClient = new HipayClient({
    env: 'production',
    login: 'YOUR_API_LOGIN',
    password: 'YOUR_API_PASSWORD',
});

hipayClient.createOrder({
    websiteId: YOUR_WEBSITE_ID,
    categoryId: YOUR_PRODUCT_CATEGORY,
    currency: 'EUR',
    amount: '4.99',
    rating: 'ALL',
    locale: 'fr_FR',
    customerIpAddress: CUSTOMER_IP,
    description: 'Life subscription to a super service!',
    executionDate: new Date(),
    manualCapture: true,
    urlCallback: 'https://domain.tld/hipay-callback',
}).then((response) => {
    if (response.error) {
        // HiPay reported an error during the request
        console.log(response.error); // {code: number, description: string}
        return;
    }

    // HiPay created the new order, you can redirect your customer to the
    // payment page!
    console.log(response.result); // {redirectUrl: string}
}).catch((err) => {
    // An exception has occurred during the request (network error, ...)
});
```

### Usage

To begin you need to get your API credentials :
- [Login](https://www.hipaydirect.com/auth/login) to the Hipay Professional
dashboard
- Go to the [Toolbox](https://professional.hipay.com/toolbox/)
- Your API credentials will be under "Access to the web service" (and are named
"Login" and "Password")

You must also create a website and get it's ID:
- On the dashboard, go to Products > [Website](https://professional.hipay.com/product/website)
- Click on "Register a new Website", complete the form and validate
- Get your website ID (will be under your website name)

You can now start using this SDK! Usual flow is:
1. Create an order ([HipayClient.createOrder](https://nathan818fr.github.io/hipay-professional-sdk-js/classes/hipayclient.html#createorder))
2. Redirect your customer to the payment page
3. Listen for Notifications (callbacks / pingbacks) calls ([HipayClient.parseNotification](https://nathan818fr.github.io/hipay-professional-sdk-js/classes/hipayclient.html#parsenotification))
4. Capture payments ([HipayClient.captureOrder](https://nathan818fr.github.io/hipay-professional-sdk-js/classes/hipayclient.html#captureorder))

## Documentation

Technical documentation: [https://nathan818fr.github.io/hipay-professional-sdk-js/classes/hipayclient.html]

## Building

This project uses TypeScript. To create javascript sources run:
```sh
npm run build
```

## Testing

For unit tests, a **real payment flow is reproduced** and tested (on the HiPay
staging API):
- An order is created
- A browser is opened on the payment page and make a payment
- A Notification (callback) listener wait for the transaction autorisation
- The order is captured
- A Notification (callback) listener wait for the transaction capture
(and several other complementary tests are performed)

Run the unit tests (no need to run build before, they use the typescript files):
```sh
npm run lint
npm run test
```

## Contributing

Contributions are welcome. Unfortunately there is no documentation on the
codestyle yet, so look at the existing sources and do the same.

The goal is to keep a simple project without unnecessary (non essential)
features.
Don't hesitate to open an issue before to discuss about your idea.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available,
see the [tags on this repository](https://github.com/nathan818fr/hipay-professional-sdk-js/tags).

## Authors

- [Nathan Poirier](https://github.com/nathan818fr) &lt;nathan@poirier.io&gt;

## License

This project is licensed under the Apache-2.0 License - see the
[LICENSE](./LICENSE) file for details.
