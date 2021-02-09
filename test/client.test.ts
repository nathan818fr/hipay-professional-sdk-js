import axios from 'axios';
import * as fs from 'fs-extra';
import {HipayClient} from '../src';
import {newCreateOrderRequest} from './utils/hipay-helpers';

jest.mock('axios');

const FAKE_LOGIN = '0ca9872cc65e43f9a3519b8dd3d0f5ce';
const FAKE_PASSWORD = 'f2022629d27c42ada763d7875ca11d9a';
const hipayClient = new HipayClient({env: 'stage', login: FAKE_LOGIN, password: FAKE_PASSWORD});

describe('client', () => {
    it('instantiate and returns basic information', () => {
        const def = {login: 'x', password: 'x'};
        const newClient = (env: string, params?: any) => new HipayClient({...def, env, ...params});
        let client;

        client = newClient('stage');
        expect(client.getEnvironment()).toBe('stage');
        expect(client.getEndpoint()).toBe('https://test-ws.hipay.com/');
        expect(client.toString()).toBe('HipayClient{environment=stage}');

        client = newClient('production');
        expect(client.getEnvironment()).toBe('production');
        expect(client.getEndpoint()).toBe('https://ws.hipay.com/');
        expect(client.toString()).toBe('HipayClient{environment=production}');

        client = newClient('http://custom-endpoint.com/');
        expect(client.getEnvironment()).toBe('http://custom-endpoint.com/');
        expect(client.getEndpoint()).toBe('http://custom-endpoint.com/');
        expect(client.toString()).toBe('HipayClient{environment=http://custom-endpoint.com/}');

        client = newClient('https://custom-endpoint.com/', {subAccountLogin: 'x', subAccountId: 1});
        expect(client.getEnvironment()).toBe('https://custom-endpoint.com/');
        expect(client.getEndpoint()).toBe('https://custom-endpoint.com/');

        expect(newClient('https://custom-endpoint.com/#withhash').getEndpoint()).toBe('https://custom-endpoint.com/');
        expect(() => newClient('bad-endpoint')).toThrow();
        expect(() => newClient('https://custom-endpoint.com/?withquery')).toThrow();
    });

    it('execute requests', async () => {
        const transactionPublicId = '5CF68C1301DC7655';
        let r;

        // createOrder
        // @ts-ignore
        axios.request.mockResolvedValue({data: await snapshot('response_generate.xml')});
        r = await hipayClient.createOrder(newCreateOrderRequest());
        expect(r.error).toBeUndefined();
        expect(r.result).toStrictEqual(await snapshot('response_generate.result.json'));

        // captureOrder
        // @ts-ignore
        axios.request.mockResolvedValue({data: await snapshot('response_capture.xml')});
        r = await hipayClient.captureOrder({transactionPublicId});
        expect(r.error).toBeUndefined();
        expect(r.result).toStrictEqual(await snapshot('response_capture.result.json'));

        // cancelOrder
        // @ts-ignore
        axios.request.mockResolvedValue({data: await snapshot('response_cancel.xml')});
        r = await hipayClient.cancelOrder({transactionPublicId});
        expect(r.error).toBeUndefined();
        expect(r.result).toStrictEqual(await snapshot('response_cancel.result.json'));

        // refundOrder
        // @ts-ignore
        axios.request.mockResolvedValue({data: await snapshot('response_refund.xml')});
        r = await hipayClient.refundOrder({transactionPublicId, amount: '9.99'});
        expect(r.error).toBeUndefined();
        expect(r.result).toStrictEqual(await snapshot('response_refund.result.json'));

        // error
        // @ts-ignore
        axios.request.mockResolvedValue({data: await snapshot('response_generate_error.xml')});
        r = await hipayClient.createOrder(newCreateOrderRequest({undefinedItems: true}));
        expect(r.error).toBeDefined();
        expect(r.error.code).toBe(3);
        expect(r.error.description).toBeDefined();
        expect(r.result).toBeUndefined();

        // invalid content
        // @ts-ignore
        axios.request.mockResolvedValue({data: await snapshot('notification_signed.xml')});
        await expect(hipayClient.createOrder(newCreateOrderRequest())).rejects.toThrow();

        // node error
        // @ts-ignore
        axios.request.mockImplementation(() => {
            throw new Error();
        });
        await expect(hipayClient.createOrder(newCreateOrderRequest())).rejects.toThrow();

        // axios error
        // @ts-ignore
        axios.request.mockImplementation(() => {
            return jest.requireActual('axios').request({url: 'http://10.255.255.1/', timeout: 1});
        });
        await expect(hipayClient.createOrder(newCreateOrderRequest())).rejects.toThrow();
    });

    it('parse notifications', async () => {
        const notif = await hipayClient.parseNotification(await snapshot('notification_hased.xml'));
        expect(notif).toStrictEqual(await snapshot('notification_hased.result.json'));

        await expect(hipayClient.parseNotification('')).rejects.toThrow();
        await expect(hipayClient.parseNotification(await snapshot('notification_incomplete.xml'))).rejects.toThrow();
        await expect(hipayClient.parseNotification(await snapshot('notification_malformed.xml'))).rejects.toThrow();
    });

    it('validate notifications hash/signature', async () => {
        await expect(hipayClient.parseNotification(await snapshot('notification_hased.xml'))).resolves.toBeDefined();
        await expect(hipayClient.parseNotification(await snapshot('notification_bad_hash.xml'))).rejects.toThrow();
        await expect(hipayClient.parseNotification(await snapshot('notification_illegal_hash.xml'))).rejects.toThrow();

        await expect(hipayClient.parseNotification(await snapshot('notification_signed.xml'), {
            checkMd5Content: false,
            checkSignature: true,
        })).resolves.toBeDefined();
        await expect(hipayClient.parseNotification(await snapshot('notification_bad_hash.xml'), {
            checkMd5Content: false,
            checkSignature: true,
        })).rejects.toThrow();
        await expect(hipayClient.parseNotification(await snapshot('notification_illegal_hash.xml'), {
            checkMd5Content: false,
            checkSignature: true,
        })).rejects.toThrow();

        await expect(hipayClient.parseNotification(await snapshot('notification_bad_hash.xml'), {
            checkMd5Content: false,
        })).resolves.toBeDefined();
        await expect(hipayClient.parseNotification(await snapshot('notification_illegal_hash.xml'), {
            checkMd5Content: false,
        })).resolves.toBeDefined();
    });
});

const snapshot = (name: string) => {
    return fs.readFile(__dirname + '/snapshots/' + name, 'utf8').then((data) => {
        if (name.endsWith('.json')) {
            return JSON.parse(data);
        }
        return data;
    });
};
