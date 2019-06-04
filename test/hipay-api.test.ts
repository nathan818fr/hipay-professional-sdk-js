import {config as loadEnv} from 'dotenv';
import * as ngrok from 'ngrok';
import {Browser, launch as launchBrowser} from 'puppeteer';
import {CreateOrderRequest, HipayClient, HipayNotificationResponse} from '../src';
import {
    captureOrderOrThrow,
    cards,
    client,
    createOrderOrThrow,
    newCreateOrderRequest,
    openBrowserAndPay,
    refundOrderOrThrow,
} from './utils/hipay-helpers';
import {NotificationListener} from './utils/notification-listener';

let hipayClient: HipayClient;
let listener: NotificationListener;
let callbackUrl: string;
let browser: Browser;
let browserDebug = false;

beforeAll(async () => {
    jest.setTimeout(300 * 1000);

    loadEnv();
    if (!process.env.HIPAY_LOGIN
        || !process.env.HIPAY_PASSWORD
        || !process.env.HIPAY_WEBSITE_ID
        || !process.env.HIPAY_CATEGORY_ID
    ) {
        throw new Error('HIPAY_LOGIN, HIPAY_PASSWORD, HIPAY_WEBSITE_ID, HIPAY_CATEGORY_ID must be defined!');
    }

    console.log('Create HipayClient...');
    hipayClient = new HipayClient({
        env: 'stage',
        login: process.env.HIPAY_LOGIN,
        password: process.env.HIPAY_PASSWORD,
    });

    console.log('Setup notification listener...');
    listener = new NotificationListener(hipayClient);
    const addr = await listener.start(0);
    callbackUrl = await ngrok.connect({addr: addr.port, bind_tls: false});

    console.log('Prepare browser...');
    browserDebug = (process.env.BROWSER_DEBUG === '1');
    const args = ['--no-sandbox', '--disable-setuid-sandbox'];
    if (browserDebug) {
        args.push('--window-size=1400,874');
    }
    browser = await launchBrowser({headless: !browserDebug, args});

    console.log('Done!');
});

afterAll(async () => {
    if (listener) {
        await listener.stop();
        listener = undefined;
    }

    if (callbackUrl) {
        await ngrok.disconnect(callbackUrl);
        callbackUrl = undefined;
    }
    await ngrok.kill();

    if (browser && !browserDebug) {
        await browser.close();
        browser = undefined;
    }
});

describe('test payment flow', () => {
    it('authorize, capture and refund', async () => {
        console.log('create order...');
        const order = newCreateOrderRequest({callbackUrl});
        const url = await createOrderOrThrow(hipayClient, order);
        listener.clear();

        console.log('authorize order...');
        expect(await openBrowserAndPay(browser, url, cards.VISA, {browserDebug})).toBe('success');

        console.log('await authorization notification...');
        const authorNotif = await listener.poll();
        expect(authorNotif.result).toBeDefined();
        expect(authorNotif.result.operation).toBe('authorization');
        expect(authorNotif.result.status).toBe('ok');
        expectToMatchOrder(authorNotif, order);
        const transid = authorNotif.result.transid;

        console.log('capture order...');
        const captureRes = await captureOrderOrThrow(hipayClient, {transactionPublicId: transid});
        expect(captureRes.transactionPublicId).toBe(transid);

        console.log('await capture notification...');
        const captureNotif = await listener.poll();
        expect(captureNotif.result).toBeDefined();
        expect(captureNotif.result.operation).toBe('capture');
        expect(captureNotif.result.status).toBe('ok');
        expect(captureNotif.result.transid).toBe(transid);
        expectToMatchOrder(captureNotif, order);

        console.log('refund order...');
        const refundAmount = '9.99';
        const reunfdRes = await refundOrderOrThrow(hipayClient, {transactionPublicId: transid, amount: refundAmount});
        expect(reunfdRes.transactionPublicId).toBe(transid);
        expect(reunfdRes.amount).toBe(refundAmount);
        expect(reunfdRes.currency).toBe(order.currency);

        console.log('await refund notification...');
        const refundNotif = await listener.poll();
        expect(refundNotif.result).toBeDefined();
        expect(refundNotif.result.operation).toBe('refund');
        expect(refundNotif.result.status).toBe('ok');
        expect(refundNotif.result.transid).toBe(transid);
        expect(refundNotif.result.refundedAmount).toBe(refundAmount);
        expectToMatchOrder(refundNotif, order);
    });

    /* // FIXME: Disable currently because HiPay returns error #7 'wsSubAccountId not found' when trying to cancel
    it('authorize and cancel', async () => {
        console.log('create order...');
        const order = newCreateOrderRequest({callbackUrl});
        const url = await createOrderOrThrow(hipayClient, order);
        listener.clear();

        console.log('authorize order...');
        expect(await openBrowserAndPay(browser, url, cards.VISA, {browserDebug})).toBe('success');

        console.log('await authorization notification...');
        const authorNotif = await listener.poll();
        expect(authorNotif.result).toBeDefined();
        expect(authorNotif.result.operation).toBe('authorization');
        expect(authorNotif.result.status).toBe('ok');
        expectToMatchOrder(authorNotif, order);
        const transid = authorNotif.result.transid;

        console.log('cancel order...');
        const cancelRes = await cancelOrderOrThrow(hipayClient, {transactionPublicId: transid});
        expect(cancelRes.transactionPublicId).toBe(transid);

        console.log('await cancellation notification...');
        const cancelNotif = await listener.poll();
        console.log('cancelNotif', cancelNotif);
    });
    */

    it('returns errors', async () => {
        const order = newCreateOrderRequest({callbackUrl});
        order.amount = '';
        order.manualCapture = false;
        const r = await hipayClient.createOrder(order);
        expect(r.error).toBeDefined();
        expect(r.error.code).toBe(3);
        expect(r.error.description).toContain('amount invalid');
    });
});

const expectToMatchOrder = (notif: HipayNotificationResponse, order: CreateOrderRequest) => {
    expect(notif.result.transid).toBeDefined();
    expect(notif.result.origAmount).toBe(order.amount);
    expect(notif.result.origCurrency).toBe(order.currency);
    expect(notif.result.emailClient).toBe(client.email);
    expect(notif.result.merchantDatas).toStrictEqual(order.freeData);
};
