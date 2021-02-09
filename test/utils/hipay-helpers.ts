import {Browser, ElementHandle} from 'puppeteer';
import {
    CancelOrderRequest,
    CancelOrderResult,
    CaptureOrderRequest,
    CaptureOrderResult,
    CreateOrderRequest,
    HipayClient,
    ItemType,
    RefundOrderRequest,
    RefundOrderResult,
} from '../../src';

export const newCreateOrderRequest = (opts?: { callbackUrl?: string, undefinedItems?: boolean }): CreateOrderRequest => {
    return {
        websiteId: parseInt(process.env.HIPAY_WEBSITE_ID),
        categoryId: parseInt(process.env.HIPAY_CATEGORY_ID),
        amount: '14.39',
        currency: 'EUR',
        rating: 'ALL',
        locale: 'en_US',
        customerIpAddress: '127.0.0.1',
        description: 'A beautiful Lamborghini!',
        executionDate: new Date(),
        manualCapture: true,
        urlCallback: opts && opts.callbackUrl ? opts.callbackUrl : 'http://example.com/',
        emailCallback: 'merchant@example.com',
        items: opts && opts.undefinedItems ? undefined : [
            {
                name: 'Lamborghini Aventador S',
                type: ItemType.PRODUCT,
                infos: '',
                amount: '10.00',
                quantity: 1,
                reference: 'LAMBO-AV-S',
                taxes: [{
                    label: 'TVA',
                    amount: '2.00',
                }],
            },
            {
                name: 'Insurance',
                type: ItemType.INSURANCES,
                infos: '',
                amount: '2.39',
                quantity: 1,
                reference: 'LAMBO-INSURANCE',
            },
        ],
        freeData: {
            sessionId: '123456789',
            options: JSON.stringify({fireExtinguisher: true, seatCover: false, color: 'yellow'}),
        },
    };
};

export const createOrderOrThrow = async (hipayClient: HipayClient, req: CreateOrderRequest): Promise<string> => {
    const order = await hipayClient.createOrder(req);
    if (order.error) {
        throw new Error(order.error.description);
    }
    return order.result.redirectUrl;
};

export const captureOrderOrThrow = async (hipayClient: HipayClient, req: CaptureOrderRequest): Promise<CaptureOrderResult> => {
    const order = await hipayClient.captureOrder(req);
    if (order.error) {
        throw new Error(order.error.description);
    }
    return order.result;
};

export const refundOrderOrThrow = async (hipayClient: HipayClient, req: RefundOrderRequest): Promise<RefundOrderResult> => {
    const order = await hipayClient.refundOrder(req);
    if (order.error) {
        throw new Error(order.error.description);
    }
    return order.result;
};

export const cancelOrderOrThrow = async (hipayClient: HipayClient, req: CancelOrderRequest): Promise<CancelOrderResult> => {
    const order = await hipayClient.cancelOrder(req);
    if (order.error) {
        console.log(order.error);
        throw new Error(order.error.description);
    }
    return order.result;
};

export const cards = {
    VISA: '4929890020692236',
    VISA_REJECTED: '4111113333333333',
};

export const client = {
    email: 'hipay-professional-sdk-js@poirier.io',
};

const getJsonProperty = (el: ElementHandle, propertyName: string) => {
  return el.getProperty(propertyName).then((property) => property ? property.jsonValue() : null);
};

export const openBrowserAndPay = async (browser: Browser, orderUrl: string, cardNumber: string, opts: { browserDebug: boolean }) => {
    const page = await browser.newPage();
    try {
        if (opts.browserDebug) {
            await page.setViewport({width: 1400, height: 800});
        }
        await page.goto(orderUrl, {waitUntil: 'load'});

        await page.type('#email', client.email);
        await page.select('#country', 'FR');
        await page.click('#cardTypeVisa');
        await page.type('#tokenCardNumber', cards.VISA);
        await page.type('#tokenCardHolder', 'Card Holder');
        await page.select('#tokenCardExpiryDateMonth', '12');
        await page.select('#tokenCardExpiryDateYear', (new Date().getFullYear() + 5).toString(10));
        await page.type('#tokenCardSecurityCode', '123');
        await page.click('#validate_user_account_create_form');
        const resultElem = await page.waitForSelector('#endSuccessTransactionBlock, #endErrorTransactionBlock, #endCancelTransactionBlock, #main-content .errors .errorsDetail', {timeout: 60 * 1000});
        const resultMsg = ((await getJsonProperty(resultElem, 'textContent')) + '').trim().replace(/\s\s+/g, '$1');
        if ((await getJsonProperty(resultElem, 'id')) === 'endSuccessTransactionBlock') {
            return 'success';
        } else {
            console.log('Payment failed:', resultMsg);
            return 'error';
        }
    } finally {
        if (!opts.browserDebug) {
            await page.close();
        }
    }
};
