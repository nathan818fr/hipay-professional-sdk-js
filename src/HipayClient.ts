import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {format as formatUrl, parse as parseUrl} from 'url';
import {xml2js} from 'xml-js';
import {
    CancelOrderRequest,
    CancelOrderResult,
    CaptureOrderRequest,
    CaptureOrderResult,
    CreateOrderRequest,
    CreateOrderResult,
    definitions,
    RefundOrderRequest,
    RefundOrderResult,
    TypeDefinition,
} from './Types';
import {createBody, getPackageVersion, objectGetOrThrow, Omit} from './utils';

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

    private readonly _environment: Environment;
    private readonly _endpoint: string;
    private readonly _defaultData: any;
    private readonly _defaultReqOpts: RequestOptions;

    /**
     * Create a new HipayClient.
     *
     * Get your API credentials (login/password) from the dashboard [Toolbox](https://professional.hipay.com/toolbox/).
     *
     * Important: If you wan't to use the stage environment (for testing) use the sandbox site:
     * [test-professional.hipay.com](https://test-professional.hipay.com/toolbox/)!
     * Test accounts are validated automatically, just enter random (but valid) information at each step
     * (to validate bank information use Bank Name: "HSBC" and IBAN: "FR7630056009271234567890182").
     *
     * @param opts
     */
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

    /**
     * Returns client environment
     */
    public getEnvironment(): Environment {
        return this._environment;
    }

    /**
     * Returns client API endpoint
     */
    public getEndpoint(): string {
        return this._endpoint;
    }

    private async request<T>(uri: string, data: any, dataType: TypeDefinition, opts?: RequestOptions): Promise<HipayResponse<T>> {
        const req: AxiosRequestConfig = {
            baseURL: this._endpoint,
            url: uri,
            method: 'post',
            responseType: 'text',
            data: createBody(this._endpoint, {...this._defaultData, ...data}, dataType),
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

    /**
     * Create a new order.
     *
     * At the time of payment you must create a new order then redirect the customer to the secure payment page hosted
     * by HiPay.
     * When the customer makes the payment the order is authorized and you can {@link HipayClient.captureOrder
     * capture it}.
     *
     * [HiPay documentation](https://developer.hipay.com/getting-started/platform-hipay-professional/overview/#soap-api-resources-request-a-new-order)
     *
     * @param req Requests parameters.
     * @param opts Requests options (you can set default values when creating the client:
     * {@link HipayClientOptions.defaultReqOpts}).
     * @return
     * - *resolved* with an {@link HipayResponse} when the request complete (with {@link HipayResponse.error
     * an error} or {@link HipayResponse.result the result})
     * - *rejected* with an {@link HipayException} when an exception occurs (network error, malformed response, ...)
     */
    public createOrder(req: CreateOrderRequest, opts?: RequestOptions): Promise<HipayResponse<CreateOrderResult>> {
        return this.request('/soap/payment-v2/generate', req, definitions.CreateOrderRequest, opts);
    }

    /**
     * Capture an order.
     *
     * Instruct the payment gateway to capture a previously-authorized transaction, i.e. transfer the funds from the
     * customer's bank account to the merchant's bank account. This transaction is always preceded by an authorization.
     *
     * [HiPay documentation](https://developer.hipay.com/getting-started/platform-hipay-professional/overview/#soap-api-resources-maintenance-operations)
     *
     * @param req Requests parameters.
     * @param opts Requests options (you can set default values when creating the client:
     * {@link HipayClientOptions.defaultReqOpts}).
     * @return
     * - *resolved* with an {@link HipayResponse} when the request complete (with {@link HipayResponse.error
     * an error} or {@link HipayResponse.result the result})
     * - *rejected* with an {@link HipayException} when an exception occurs (network error, malformed response, ...)
     */
    public captureOrder(req: CaptureOrderRequest, opts?: RequestOptions): Promise<HipayResponse<CaptureOrderResult>> {
        return this.request('/soap/transaction-v2/confirm', req, definitions.CaptureOrderRequest, opts);
    }

    /**
     * Cancel an order.
     *
     * [HiPay documentation](https://developer.hipay.com/getting-started/platform-hipay-professional/overview/#soap-api-resources-maintenance-operations)
     *
     * @param req Requests parameters.
     * @param opts Requests options (you can set default values when creating the client:
     * {@link HipayClientOptions.defaultReqOpts}).
     * @return
     * - *resolved* with an {@link HipayResponse} when the request complete (with {@link HipayResponse.error
     * an error} or {@link HipayResponse.result the result})
     * - *rejected* with an {@link HipayException} when an exception occurs (network error, malformed response, ...)
     */
    public cancelOrder(req: CancelOrderRequest, opts?: RequestOptions): Promise<HipayResponse<CancelOrderResult>> {
        return this.request('/soap/transaction-v2/cancel', req, definitions.CancelOrderRequest, opts);
    }

    /**
     * Refund an order.
     *
     * [HiPay documentation](https://developer.hipay.com/getting-started/platform-hipay-professional/overview/#soap-api-resources-refund-an-order)
     *
     * @param req Requests parameters.
     * @param opts Requests options (you can set default values when creating the client:
     * {@link HipayClientOptions.defaultReqOpts}).
     * @return
     * - *resolved* with an {@link HipayResponse} when the request complete (with {@link HipayResponse.error
     * an error} or {@link HipayResponse.result the result})
     * - *rejected* with an {@link HipayException} when an exception occurs (network error, malformed response, ...)
     */
    public refundOrder(req: RefundOrderRequest, opts?: RequestOptions): Promise<HipayResponse<RefundOrderResult>> {
        return this.request('/soap/refund-v2/card', req, definitions.RefundOrderRequest, opts);
    }

    public toString(): string {
        return 'HipayClient{environment=' + this._environment + '}';
    }
}

export interface HipayClientOptions {
    /**
     * API environment (it defines the endpoint that will be used)
     * - `production` set the endpoint to "https://ws.hipay.com/"
     * - `stage` set the endpoint to "https://test-ws.hipay.com/"
     *
     * Note: You can also specify an endpoint URL directly
     */
    env: Environment;

    /**
     * Your API login
     */
    login: string;

    /**
     * Your API password
     */
    password: string;

    /**
     * (not documented by HiPay)
     */
    subAccountLogin?: string;

    /**
     * (not documented by HiPay)
     */
    subAccountId?: number;

    /**
     * Override default requests options.
     *
     * Default:
     * ```typescript
     * {
     *     timeout: 30 * 1000,
     * }
     * ```
     */
    defaultReqOpts?: RequestOptions;
}

export type Environment = 'stage' | 'production' | string;

export interface RequestOptions extends Omit<AxiosRequestConfig, 'url' | 'method' | 'baseURL' | 'data' | 'responseType' | 'validateStatus' | 'transformResponse'> {
    /**
     * The number of milliseconds before the request times out.
     */
    timeout: number;
}

/**
 * API response to a request.
 *
 * If an error has occurred, error is defined and result is undefined.
 * Otherwise, result is defined and error is undefined.
 */
export interface HipayResponse<T> {
    httpResponse: AxiosResponse;

    /**
     * An error (defined only if an error occurred).
     */
    error?: HipayError;

    /**
     * The response result (defined only if no errors occurred).
     */
    result?: T;
}

/**
 * API request error.
 *
 * [HiPay documentation](https://developer.hipay.com/getting-started/platform-hipay-professional/overview/#integration-guidelines-error-handling)
 */
export interface HipayError {
    /**
     * Error code returned by HiPay.
     */
    code: number;

    /**
     * Error cause description.
     */
    description: string;
}

/**
 * API request exception.
 *
 * Unlike {@link HipayError errors}, exceptions are unexpected and unanticipated events (network errors, ...).
 */
export class HipayException extends Error {
    public cause?: Error;
    public httpResponse?: AxiosResponse;

    constructor(message: string, cause: Error, httpResponse: any) {
        super(message);
        this.cause = cause;
        this.httpResponse = httpResponse;
    }
}
