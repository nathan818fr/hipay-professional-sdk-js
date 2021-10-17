export type Float = string;

/**
 * A date stored in an integer as YYYYMMDD.
 *
 * @example 20190925
 */
export type DateInt = number;

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
 * Information about the customer's account on the merchant's website.
 *
 * @see {@link CreateOrderRequest.accountInfo}
 */
export interface AccountInfo {
    /**
     * Customer's account information.
     */
    customer?: Customer;

    /**
     * Customer's purchase information.
     */
    purchase?: Purchase;

    /**
     * Customer's shipping information.
     */
    shipping?: Shipping;
}

/**
 * Customer's account information.
 *
 * @see {@link AccountInfo.customer}
 */
export interface Customer {
    /**
     * Customer's last change on his account.
     */
    accountChange?: DateInt;

    /**
     * Date when the customer created his account on the merchant's website.
     */
    openingAccountDate?: DateInt;

    /**
     * Date when the customer made a password change on his account.
     */
    passwordChange?: DateInt;
}

/**
 * Customer's purchase information.
 *
 * @see {@link AccountInfo.purchase}
 */
export interface Purchase {
    /**
     * Number of purchases with the customer's account during the last six months.
     */
    count?: number;

    /**
     * Number of attempts to add a card into the customer's account in the last 24 hours.
     */
    cardStored24h?: number;

    /**
     * Number of transactions (successful and abandoned) for this customer account across all payment accounts in the
     * previous 24 hours.
     */
    paymentAttempts24h?: number;

    /**
     * Number of transactions (successful and abandoned) for this customer account across all payment accounts in the
     * previous year.
     */
    paymentAttempts1y?: number;
}

/**
 * Customer's shipping information.
 *
 * @see {@link AccountInfo.shipping}
 */
export interface Shipping {
    /**
     * Date when the shipping address used for this transaction was first used.
     */
    shippingUsedDate?: DateInt;

    /**
     * Indicates if the Cardholder Name on the account is identical to the shipping Name used for this transaction.
     */
    nameIndicator?: NameIndicator;

    /**
     * Indicates whether the merchant has experienced suspicious activity (including previous fraud) on the cardholder account.
     */
    suspiciousActivity?: SuspiciousActivity;
}

/**
 * @see {@link Shipping.nameIndicator}
 */
export enum NameIndicator {
    /**
     * Account name identical to shipping Name
     */
    IDENTICAL = 1,

    /**
     * Account name different than shipping Name
     */
    DIFFERENT = 2,
}

/**
 * @see {@link Shipping.suspiciousActivity}
 */
export enum SuspiciousActivity {
    /**
     * No suspicious activity has been observed
     */
    NO_SUSPICIOUS_ACTIVITY = 1,

    /**
     * Suspicious activity has been observed
     */
    SUSPICIOUS_ACTIVITY = 2,
}

/**
 * Merchant's statement about the transaction he wants to proceed.
 *
 * @see {@link CreateOrderRequest.merchantRiskStatement}
 */
export interface MerchantRiskStatement {
    /**
     * Email address to which the goods needs to be sent to.
     */
    emailDeliveryAddress?: string;

    /**
     * Indicates when the goods are willing to be received by the customer.
     */
    deliveryTimeFrame?: DeliveryTimeFrame;

    /**
     * Availability of the goods.
     */
    purchaseIndicator?: PurchaseIndicator;

    /**
     * For a pre-ordered purchase, the expected date that the merchandise will be available.
     */
    preOrderDate?: DateInt;

    /**
     * Unicity of the order for the customer.
     */
    reorderIndicator?: ReorderIndicator;

    /**
     * Address to whom the goods are to be sent
     */
    shippingIndicator?: ShippingIndicator;
}

/**
 * @see {@link MerchantRiskStatement.deliveryTimeFrame}
 */
export enum DeliveryTimeFrame {
    ELECTRONIC_DELIVERY = 1,
    SAME_DAY_SHIPPING = 2,
    OVERNIGHT_SHIPPING = 3,
    TWO_DAY_OR_MORE_SHIPPING = 4,
}

/**
 * @see {@link MerchantRiskStatement.purchaseIndicator}
 */
export enum PurchaseIndicator {
    MERCHANDISE_AVAILABLE = 1,
    FUTURE_AVAILABILITY = 2,
}

/**
 * @see {@link MerchantRiskStatement.reorderIndicator}
 */
export enum ReorderIndicator {
    FIRST_TIME_ORDERED = 1,
    REORDERED = 2,
}

/**
 * @see {@link MerchantRiskStatement.shippingIndicator}
 */
export enum ShippingIndicator {
    /**
     * Ship to cardholder's billing address.
     */
    SHIP_TO_CARDHOLDER_BILLING_ADDRESS = 1,

    /**
     * Ship to another verified address on file with merchant.
     */
    SHIP_TO_VERIFIED_ADDRESS = 2,

    /**
     * Ship to address that is different than the cardholder's billing address.
     */
    SHIP_TO_DIFFERENT_ADDRESS = 3,

    /**
     * Ship to store / pick up at local store.
     */
    SHIP_TO_STORE = 4,

    /**
     *  Digital goods (includes online services, electronic gift cards and redemption codes).
     */
    DIGITAL_GOODS = 5,

    /**
     * Travel and event tickets, not shipped.
     */
    DIGITAL_TRAVEL_EVENT_TICKETS = 6,

    /**
     * Other (gaming, digital services not shipped, e-media subscriptions).
     */
    OTHER = 7,
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
     * The order Notification (callback) URL.
     *
     * This URL will be used by our server to send you information in order to update your database.
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
    freeData?: {[key: string]: string};

    affiliates?: Affiliate[];
    items?: Item[];
    shopId?: string;
    thirdPartySecurity?: string;
    accountInfo?: AccountInfo;
    merchantRiskStatement?: MerchantRiskStatement;
    exemption?: string;
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

    amount: Float;
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

type OrderNotificationOperation = 'authorization' | 'capture' | 'cancellation' | 'refund' | 'reject';
type OrderNotificationStatus = 'ok' | 'nok' | 'cancel' | 'waiting';

/**
 * @see {@link HipayClient.parseNotification}
 */
export interface OrderNotificationResult {
    operation: OrderNotificationOperation;
    status: OrderNotificationStatus;
    date: string;
    time: string;
    transid: string;
    origAmount: Float;
    origCurrency: string;
    idForMerchant?: string;
    emailClient?: string;
    idClient?: string;
    cardCountry?: string;
    ipCountry?: string;
    merchantDatas?: any;
    is3ds?: string;
    paymentMethod?: string;
    customerCountry?: string;
    refundedAmount?: string;
    returnCode?: string;
    returnDescriptionShort?: string;
    returnDescriptionLong?: string;
}

const namespaces: {[key: string]: string} = {
    ns1: 'soap/payment-v2',
    ns2: 'soap/transaction-v2',
    ns3: 'soap/refund-v2',
};
export {namespaces};

export interface TypeDefinition {
    ns: string;
    reqType?: string;
}

const definitions: {[key: string]: TypeDefinition} = {
    Affiliate: {
        ns: 'ns1',
    },
    Tax: {
        ns: 'ns1',
    },
    Item: {
        ns: 'ns1',
    },
    Customer: {
        ns: 'ns1',
    },
    Purchase: {
        ns: 'ns1',
    },
    Shipping: {
        ns: 'ns1',
    },
    AccountInfo: {
        ns: 'ns1',
    },
    MerchantRiskStatement: {
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
