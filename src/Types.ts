export type Float = string;

/**
 * An Affiliate which will receive a part of your earnings on the order capture.
 *
 * (not documented by HiPay)
 *
 * @see {@link CreateOrderRequest.affiliates}
 */
export interface Affiliate {
    name: string;
    hipayAccountId: number;
    amount: string;
}

/**
 * A Tax, displayed in order price details.
 *
 * (not documented by HiPay)
 *
 * @see {@link Item.taxes}
 */
export interface Tax {
    /**
     * Tax name.
     */
    label: string;

    /**
     * Tax amount.
     */
    amount: Float;
}

/**
 * @see {@link Item.type}
 */
export enum ItemType {
    INSURANCES = 1,
    FIXED_COSTS = 2,
    SHIPPING_COSTS = 3,
    PRODUCT = 4,
}

/**
 * An Item, displayed in order price details.
 *
 * (not documented by HiPay)
 *
 * @see {@link CreateOrderRequest.items}
 */
export interface Item {
    /**
     * Item name, mandatory but displayed only if {@link Item.type} === {@link ItemType.PRODUCT}.
     */
    name: string;

    /**
     * Item type, it define how HiPay will display this item.
     *
     * @see {@link ItemType}
     */
    type: number;

    infos: string;
    amount: Float;
    quantity: number;
    reference: string;
    taxes?: Tax[];
}

/**
 * @see {@link HipayClient.createOrder}
 */
export interface CreateOrderRequest {
    /**
     * ID of the website created on merchant's account.
     *
     * Get it from the dashboard [Websites](https://professional.hipay.com/product/website).
     */
    websiteId: number;

    /**
     * Category of this order.
     *
     * The order or product categories are attached to, and depend upon, the merchant site's category.
     * You can obtain the list of order and product category ID's for the merchant site at this URL:
     * - Production platform: `https://payment.hipay.com/order/list-categories/id/[PRODUCTION_WEBSITEID]`
     * - Stage platform: `https://test-payment.hipay.com/order/list-categories/id/[STAGE_WEBSITEID]`
     */
    categoryId: number;

    subscriptionId?: string;

    /**
     * The currency specified in your HiPay Professional account.
     *
     * This three-character currency code complies with ISO 4217 (eg. "EUR").
     */
    currency: string;

    /**
     * The total order amount.
     *
     * It should be calculated as a sum of the items purchased, plus the shipping fee (if present),
     * plus the tax fee (if present).
     * This is the final price that the consumer will pay.
     */
    amount: Float;

    /**
     * Age category of your order.
     *
     * Accepted values :
     * - "`+12`" For ages 13 and over
     * - "`+16`" For ages 16 and over
     * - "`+18`" For ages 18 and over
     * - "`ALL`" For all ages
     */
    rating: string;

    /**
     * Locale code of your customer.
     *
     * It may be used for sending confirmation emails to your customer or for displaying payment pages.
     *
     * Examples:
     * - "en_GB" (default)
     * - "fr_FR"
     * - "es_ES"
     * - "it_IT"
     */
    locale?: string;

    /**
     * The IP address of your customer making a purchase.
     */
    customerIpAddress: string;

    /**
     * The order short description.
     */
    description?: string;

    /**
     * Date and time of execution of the payment.
     *
     * Formatted in MySQL DATETIME format `Y-m-dTH:i:s` (eg.: "2014-12-25T10:57:55").
     */
    executionDate: string | Date;

    /**
     * Indicate if you want to capture the payment manually or automatically.
     *
     * - `false`: indicates transaction is sent for authorization, and if approved, is automatically submitted
     * for capture.
     * - `true`: indicates this transaction is sent for authorization only. The transaction will not be sent for
     * settlement until the transaction is submitted for capture manually by the Merchant.
     */
    manualCapture: boolean;

    /**
     * The customer's e-mail address.
     */
    customerEmail?: string;

    /**
     * Merchants' comment concerning the order.
     */
    merchantComment?: string;

    /**
     * Email used by HiPay Professional to post operation notifications.
     */
    emailCallback?: string;

    /**
     * The URL will be used by our server to send you information in order to update your database.
     *
     * [HiPay documentation](https://developer.hipay.com/getting-started/platform-hipay-professional/overview/#server-to-server-notifications)
     */
    urlCallback?: string;

    /**
     * The URL to return your customer to once the payment process is completed successfully.
     */
    urlAccept?: string;

    /**
     * The URL to return your customer to after the acquirer declines the payment.
     */
    urlDecline?: string;

    /**
     * The URL to return your customer to when he or her decides to abort the payment.
     */
    urlCancel?: string;

    /**
     * This URL is where the logo you want to appear on your payment page is located.
     *
     * Important: HTTP**S** protocol is required.
     */
    urlLogo?: string;

    bankReportLabel?: string;

    /**
     * Custom data.
     *
     * You may use these parameters to submit values you wish to receive back in the API response messages or in the
     * notifications (eg. you can use these parameters to get back session data, order content or user info).
     */
    freeData?: { [key: string]: string };

    affiliates?: Affiliate[];
    items?: Item[];
    shopId?: string;
    thirdPartySecurity?: string;
    method?: string;
}

/**
 * @see {@link HipayClient.createOrder}
 */
export interface CreateOrderResult {
    /**
     * Payment page URL.
     *
     * Merchant must redirect the customer's browser to this URL.
     */
    redirectUrl: string;
}

/**
 * @see {@link HipayClient.captureOrder}
 */
export interface CaptureOrderRequest {
    /**
     * The unique identifier of the transaction sent to the merchant on the
     * {@link CreateOrderRequest.urlCallback urlCallback} (Notification) called "transid".
     */
    transactionPublicId?: string;

    amount?: Float;
    currency?: string;
}

/**
 * @see {@link HipayClient.captureOrder}
 */
export interface CaptureOrderResult {
    /**
     * The unique identifier of the transaction.
     */
    transactionPublicId: string;

    merchantReference: string;
}

/**
 * @see {@link HipayClient.cancelOrder}
 */
export interface CancelOrderRequest {
    /**
     * The unique identifier of the transaction sent to the merchant on the
     * {@link CreateOrderRequest.urlCallback urlCallback} (Notification) called "transid".
     */
    transactionPublicId?: string;
}

/**
 * @see {@link HipayClient.cancelOrder}
 */
export interface CancelOrderResult {
    /**
     * The unique identifier of the transaction.
     */
    transactionPublicId: string;

    merchantReference: string;
}

/**
 * @see {@link HipayClient.refundOrder}
 */
export interface RefundOrderRequest {
    /**
     * The unique identifier of the transaction sent to the merchant on the
     * {@link CreateOrderRequest.urlCallback urlCallback} (Notification) called "transid".
     */
    transactionPublicId: string;

    amount?: Float;
}

/**
 * @see {@link HipayClient.refundOrder}
 */
export interface RefundOrderResult {
    /**
     * The unique identifier of the transaction.
     */
    transactionPublicId: string;

    /**
     * Refunded amount.
     */
    amount: Float;

    /**
     * Currency of refunded transaction.
     */
    currency: string;
}

const namespaces: { [key: string]: string } = {
    ns1: 'soap/payment-v2',
    ns2: 'soap/transaction-v2',
    ns3: 'soap/refund-v2',
};
export {namespaces};

export interface TypeDefinition {
    ns: string;
    reqType?: string;
}

const definitions: { [key: string]: TypeDefinition } = {
    Affiliate: {
        ns: 'ns1',
    },
    Tax: {
        ns: 'ns1',
    },
    Item: {
        ns: 'ns1',
    },
    CreateOrderRequest: {
        ns: 'ns1',
        reqType: 'generate',
    },
    CreateOrderResult: {
        ns: 'ns1',
    },
    CaptureOrderRequest: {
        ns: 'ns2',
        reqType: 'confirm',
    },
    CaptureOrderResult: {
        ns: 'ns2',
    },
    CancelOrderRequest: {
        ns: 'ns2',
        reqType: 'cancel',
    },
    CancelOrderResult: {
        ns: 'ns2',
    },
    RefundOrderRequest: {
        ns: 'ns3',
        reqType: 'card',
    },
    RefundOrderResult: {
        ns: 'ns3',
    },
};
export {definitions};
