export type Float = string;

export interface Affiliate {
    name: string;
    hipayAccountId: number;
    amount: string;
}

export interface Tax {
    label: string;
    amount: Float;
}

export interface Item {
    name: string;
    type: number;
    infos: string;
    amount: Float;
    quantity: number;
    reference: string;
    taxes?: Tax[];
}

export interface CreateOrderRequest {
    websiteId: number;
    categoryId: number;
    subscriptionId?: string;
    currency: string;
    amount: Float;
    rating: string;
    locale?: string;
    customerIpAddress: string;
    description?: string;
    executionDate: string | Date;
    manualCapture: boolean;
    customerEmail?: string;
    merchantComment?: string;
    emailCallback?: string;
    urlCallback?: string;
    urlAccept?: string;
    urlDecline?: string;
    urlCancel?: string;
    urlLogo?: string;
    bankReportLabel?: string;
    freeData?: { [key: string]: string };
    affiliates?: Affiliate[];
    items?: Item[];
    shopId?: string;
    thirdPartySecurity?: string;
    method?: string;
}

export interface CreateOrderResult {
    redirectUrl: string;
}

export interface CaptureOrderRequest {
    transactionPublicId?: string;
    amount?: Float;
    currency?: string;
}

export interface CaptureOrderResult {
    transactionPublicId: string;
    merchantReference: string;
}

export interface CancelOrderRequest {
    transactionPublicId?: string;
}

export interface CancelOrderResult {
    transactionPublicId: string;
    merchantReference: string;
}

export interface RefundOrderRequest {
    transactionPublicId: string;
    amount: Float;
}

export interface RefundOrderResult {
    currency: string;
    amount: Float;
    transactionPublicId: string;
}

const namespaces: { [key: string]: string } = {
    ns1: 'soap/payment-v2',
    ns2: 'soap/transaction-v2',
    ns3: 'soap/refund-v2'
};
export {namespaces};

export interface TypeDefinition {
    ns: string;
    reqType?: string;
}

const definitions: { [key: string]: TypeDefinition } = {
    Affiliate: {
        ns: 'ns1'
    },
    Tax: {
        ns: 'ns1'
    },
    Item: {
        ns: 'ns1'
    },
    CreateOrderRequest: {
        ns: 'ns1',
        reqType: 'generate'
    },
    CreateOrderResult: {
        ns: 'ns1'
    },
    CaptureOrderRequest: {
        ns: 'ns2',
        reqType: 'confirm'
    },
    CaptureOrderResult: {
        ns: 'ns2'
    },
    CancelOrderRequest: {
        ns: 'ns2',
        reqType: 'cancel'
    },
    CancelOrderResult: {
        ns: 'ns2'
    },
    RefundOrderRequest: {
        ns: 'ns3',
        reqType: 'card'
    },
    RefundOrderResult: {
        ns: 'ns3'
    }
};
export {definitions};
