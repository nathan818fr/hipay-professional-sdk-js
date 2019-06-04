import * as http from 'http';
import {HipayClient, HipayNotificationResponse} from '../../src';

export class NotificationListener {
    private _hipayClient: HipayClient;
    private _srv: http.Server;

    private _notificationsQueue: { err?: any, result?: HipayNotificationResponse }[] = [];
    private _notificationListener: (notif: { err?: any, result?: HipayNotificationResponse }) => void;

    constructor(hipayClient: HipayClient) {
        this._hipayClient = hipayClient;
    }

    public start(): Promise<void> {
        let errorListener: (e: any) => void;
        return (new Promise<void>((resolve, reject) => {
            this._srv = http.createServer(this.listenReq);
            this._srv.on('error', errorListener = async (e) => {
                await this.stop();
                return reject(e);
            });
            this._srv.listen(process.env.LISTEN_PORT || 80, () => {
                return resolve();
            });
        })).finally(() => {
            if (this._srv) {
                this._srv.off('error', errorListener);
            }
        });
    }

    public stop() {
        return new Promise((resolve) => {
            if (this._srv) {
                this._srv.close(() => {
                    this._srv = undefined;
                    return resolve();
                });
            } else {
                return resolve();
            }
        });
    }

    public clear() {
        this._notificationsQueue = [];
    }

    public poll(): Promise<HipayNotificationResponse> {
        const e = this._notificationsQueue.shift();
        if (e !== undefined) {
            return e.err ? Promise.reject(e.err) : Promise.resolve(e.result);
        }

        return new Promise((resolve, reject) => {
            if (this._notificationListener !== undefined) {
                return reject('already polling');
            }
            const timeout = setTimeout(() => {
                this._notificationListener = undefined;
                return reject(new Error('notification polling timed out'));
            }, 30 * 1000);
            this._notificationListener = ({err, result}) => {
                clearTimeout(timeout);
                this._notificationListener = undefined;
                process.nextTick(() => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
            };
        });
    }

    private listenReq = async (req: http.IncomingMessage, res: http.ServerResponse) => {
        let err, result;
        try {
            // TODO: Log request?
            let body: string;
            if (req.method === 'POST') {
                body = await this.readBody(req);
            }
            if (body && body.indexOf('xml=') === 0) {
                const xmlStr = decodeURIComponent(body.substr(4).replace(/\+/g, ' '));
                result = await this._hipayClient.parseNotification(xmlStr);
            }
        } catch (e) {
            err = e;
        }

        if (process.env.LOG_NOTIFICATIONS === '1') {
            console.log('<< notification:', err ? err : result);
        }

        if (this._notificationListener !== undefined) {
            this._notificationListener({err, result});
        } else {
            this._notificationsQueue.push({err, result});
        }

        res.writeHead(200, {'Content-Type': 'text/plain'});
        return res.end('success');
    };

    private readBody = (req: http.IncomingMessage): Promise<string> => {
        let chunks = '';
        return new Promise((resolve) => {
            req.setEncoding('utf8');
            req.on('data', (chunk) => {
                chunks += chunk;
            });
            req.on('end', () => {
                return resolve(chunks);
            });
        });
    };
}
