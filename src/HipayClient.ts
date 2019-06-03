import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {format as formatUrl, parse as parseUrl} from 'url';
import {js2xml, xml2js} from 'xml-js';
import {
    CancelOrderRequest,
    CancelOrderResult,
    CaptureOrderRequest,
    CaptureOrderResult,
    CreateOrderRequest,
    CreateOrderResult,
    definitions,
    namespaces,
    RefundOrderRequest,
    RefundOrderResult,
    TypeDefinition,
} from './Types';
import {createBodyParameters, getPackageVersion, objectGetOrThrow} from './utils';

const validateStatus = (status: number) => status === 200 || status === 500;
const transformResponse = (data: any) => data;

export class HipayClient {
    private static getEndpoint(env: Environment) {
        if (env === 'production') {
            return 'https://ws.hipay.com/';
        } else if (env === 'stage') {
            return 'https://test-ws.hipay.com/';
        }
        try {
            const url = parseUrl(env);
            if ((url.protocol === 'http:' || url.protocol === 'https:') && url.slashes && !url.search) {
                url.search = null;
                url.query = null;
                url.hash = null;
                return formatUrl(url);
            }
        } catch (ignored) {
        }
        throw new Error('env must be "production", "stage" or a valid http(s) URL');
    }

    private static createBody(data: any, dataType: TypeDefinition): string {
        const body = {
            '_declaration': {_attributes: {version: '1.0', encoding: 'UTF-8'}},
            'SOAP-ENV:Envelope': {
                '_attributes': {
                    'xmlns:SOAP-ENV': 'http://schemas.xmlsoap.org/soap/envelope/',
                    ['xmlns:' + dataType.ns]: namespaces[dataType.ns],
                },
                'SOAP-ENV:Body': {
                    [dataType.ns + ':' + dataType.reqType]: {
                        parameters: createBodyParameters(data),
                    },
                },
            },
        };
        return js2xml(body, {compact: true});
    }

    private readonly _environment: Environment;
    private readonly _endpoint: string;
    private readonly _defaultData: any;
    private readonly _defaultReqOpts: RequestOptions;

    constructor(opts: HipayClientOptions) {
        this._environment = opts.env;
        this._endpoint = HipayClient.getEndpoint(opts.env);
        this._defaultData = {
            wsLogin: opts.login,
            wsPassword: opts.password,
            wsSubAccountLogin: opts.subAccountLogin,
            wsSubAccountId: opts.subAccountId,
        };
        this._defaultReqOpts = {
            timeout: 30 * 1000,
            ...opts.defaultReqOpts,
        };
    }

    public getEnvironment(): Environment {
        return this._environment;
    }

    public getEndpoint(): string {
        return this._endpoint;
    }

    private async request<T>(uri: string, data: any, dataType: TypeDefinition, opts?: RequestOptions): Promise<HipayResponse<T>> {
        const req: AxiosRequestConfig = {
            baseURL: this._endpoint,
            url: uri,
            method: 'post',
            responseType: 'text',
            data: HipayClient.createBody({...this._defaultData, ...data}, dataType),
            validateStatus,
            transformResponse,
            ...this._defaultReqOpts,
            ...opts,
        };
        if (!req.headers) {
            req.headers = {};
        }
        if (typeof req.headers['User-Agent'] === 'undefined') {
            req.headers['User-Agent'] = 'hipay-professional-sdk-js/' + getPackageVersion();
        }
        if (typeof req.headers['Content-Type'] === 'undefined') {
            req.headers['Content-Type'] = 'text/xml;charset=UTF-8';
        }
        if (typeof req.headers.Accept === 'undefined') {
            req.headers.Accept = 'text/xml;charset=UTF-8';
        }

        let httpResponse;
        try {
            httpResponse = await axios.request(req);
        } catch (e) {
            throw new HipayException('Error during HTTP requests to Hipay', e, e.isAxiosError ? e.response : undefined);
        }
        let error: HipayError, result: any;
        try {
            let r: any = xml2js(httpResponse.data, {
                compact: true,
                ignoreDeclaration: true,
                ignoreInstruction: true,
                ignoreAttributes: true,
                ignoreComment: true,
                ignoreCdata: true,
                ignoreDoctype: true,
            });
            r = objectGetOrThrow(r,
                'SOAP-ENV:Envelope',
                'SOAP-ENV:Body',
                'ns1:' + dataType.reqType + 'Response',
                dataType.reqType + 'Result');
            result = {};
            for (const k in r) {
                if (r.hasOwnProperty(k)) {
                    result[k] = r[k] ? r[k]._text : undefined;
                }
            }
            if (result.code !== '0') {
                error = {code: parseInt(result.code), description: result.description};
            } else {
                delete result.code;
                delete result.description;
            }
        } catch (e) {
            throw new HipayException('Error while parsing Hipay\'s response', e, httpResponse);
        }
        const r = error ? {httpResponse, error} : {httpResponse, result};
        Object.defineProperty(r, 'httpResponse', {enumerable: false});
        return r;
    }

    public createOrder(req: CreateOrderRequest, opts?: RequestOptions): Promise<HipayResponse<CreateOrderResult>> {
        return this.request('/soap/payment-v2/generate', req, definitions.CreateOrderRequest, opts);
    }

    public captureOrder(req: CaptureOrderRequest, opts?: RequestOptions): Promise<HipayResponse<CaptureOrderResult>> {
        return this.request('/soap/transaction-v2/confirm', req, definitions.CaptureOrderRequest, opts);
    }

    public cancelOrder(req: CancelOrderRequest, opts?: RequestOptions): Promise<HipayResponse<CancelOrderResult>> {
        return this.request('/soap/transaction-v2/cancel', req, definitions.CancelOrderRequest, opts);
    }

    public refundOrder(req: RefundOrderRequest, opts?: RequestOptions): Promise<HipayResponse<RefundOrderResult>> {
        return this.request('/soap/refund-v2/card', req, definitions.RefundOrderRequest, opts);
    }

    public toString(): string {
        return 'HipayClient{environment=' + this._environment + '}';
    }
}

export interface HipayClientOptions {
    env: Environment;
    login: string;
    password: string;
    subAccountLogin?: string;
    subAccountId?: number;
    defaultReqOpts?: RequestOptions;
}

export type Environment = 'stage' | 'production' | string;

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'baseURL' | 'data' | 'responseType' | 'validateStatus' | 'transformResponse'>;

export interface HipayResponse<T> {
    httpResponse: AxiosResponse;
    error?: HipayError;
    result?: T;
}

export interface HipayError {
    code: number;
    description: string;
}

export class HipayException extends Error {
    public cause?: Error;
    public httpResponse?: AxiosResponse;

    constructor(message: string, cause: Error, httpResponse: any) {
        super(message);
        this.cause = cause;
        this.httpResponse = httpResponse;
    }
}
