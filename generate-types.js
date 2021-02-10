const axios = require('axios');
const xmlJs = require('xml-js');

const requestsTypes = {
    PaymentParameters: 'generate',
    ConfirmParameters: 'confirm',
    CancelParameters: 'cancel',
    CardParameters: 'card',
};
const namespaces = {
    ns1: {
        url: 'https://ws.hipay.com/soap/payment-v2',
        types: {
            AffiliateParameters: 'Affiliate',
            TaxeParameters: 'Tax',
            ItemParameters: 'Item',
            AccountInfo: 'AccountInfo',
            Customer: 'Customer',
            Purchase: 'Purchase',
            Shipping: 'Shipping',
            MerchantRiskStatement: 'MerchantRiskStatement',
            PaymentParameters: 'CreateOrderRequest',
            PaymentResponse: 'CreateOrderResult',
        },
    },
    ns2: {
        url: 'https://ws.hipay.com/soap/transaction-v2',
        types: {
            ConfirmParameters: 'CaptureOrderRequest',
            ConfirmResponse: 'CaptureOrderResult',
            CancelParameters: 'CancelOrderRequest',
            CancelResponse: 'CancelOrderResult',
        },
    },
    ns3: {
        url: 'https://ws.hipay.com/soap/refund-v2',
        types: {
            CardParameters: 'RefundOrderRequest',
            CardResponse: 'RefundOrderResult',
        },
    },
};

const interfacesOrder = (name) => {
    let i = 0;
    for (const namespaceId in namespaces) {
        for (const type in namespaces[namespaceId].types) {
            if (namespaces[namespaceId].types[type] === name) {
                return i;
            }
            ++i;
        }
    }
    return -1;
};

const isIgnoredKey = (clazz, key) => {
    if (clazz.indexOf('Request') !== -1) {
        return key === 'wsLogin'
            || key === 'wsPassword'
            || key === 'wsSubAccountLogin'
            || key === 'wsSubAccountId'
            || key === 'merchantReference'
            || key === 'authenticationToken';
    }
    if (clazz.indexOf('Result') !== -1) {
        return key === 'code'
            || key === 'description';
    }
    return false;
};

const tsType = (clazz, key, type) => {
    if (key === 'executionDate') {
        return 'string | Date';
    }
    switch (type) {
        case 'xsd:string':
            return 'string';
        case 'xsd:int':
            return 'number';
        case 'xsd:float':
            return 'Float';
        case 'xsd:boolean':
            return 'boolean';
        case 'tns:ArrayOfDatawrapper':
            return '{ [key: string]: string }';
        case 'tns:ArrayOfAffiliateparameters':
            return 'Affiliate[]';
        case 'tns:ArrayOfItemparameters':
            return 'Item[]';
        case 'tns:ArrayOfTaxeparameters':
            return 'Tax[]';
        case 'tns:AccountInfo':
            return 'AccountInfo';
        case 'tns:Customer':
            return 'Customer';
        case 'tns:Purchase':
            return 'Purchase';
        case 'tns:Shipping':
            return 'Shipping';
        case 'tns:MerchantRiskStatement':
            return 'MerchantRiskStatement';
        default:
            throw new Error('Unsupported type: ' + type + ' (' + clazz + '.' + key + ')');
    }
};

const stringifyObj = (obj) => {
    return JSON.stringify(obj, null, 4).replace(/^(\s+)"([a-zA-Z0-9_]+)"(: )/gm, '$1$2$3').replace(/"/g, '\'');
};

(async () => {
    const intfs = {};
    const definitions = {};

    for (const namespaceId in namespaces) {
        const namespace = namespaces[namespaceId];
        const r = xmlJs.xml2js((await axios.get(namespace.url + '?wsdl')).data, {
            compact: true,
        });

        const types = r.definitions.types['xsd:schema']['xsd:complexType'];
        for (const type of types) {
            const name = namespace.types[type._attributes.name];
            if (!name) {
                continue;
            }

            definitions[name] = {
                ns: namespaceId,
                reqType: requestsTypes[type._attributes.name],
            };

            const intf = ['export interface ' + name + ' {'];
            const elements = type['xsd:all']['xsd:element'];
            for (const element of elements) {
                const eAttr = element._attributes;
                if (isIgnoredKey(name, eAttr.name)) {
                    continue;
                }
                const type = tsType(name, eAttr.name, eAttr.type);
                intf.push('    ' + eAttr.name + (eAttr.nillable === '1' ? '?' : '') + ': ' + type + ';');
            }
            intf.push('}');
            intfs[name] = intf;
        }
    }

    console.log('export type Float = string;\n');
    for (const k of Object.keys(intfs).sort((a, b) => interfacesOrder(a) - interfacesOrder(b))) {
        console.log(intfs[k].join('\n') + '\n');
    }
    console.log('const namespaces: { [key: string]: string } = '
        + stringifyObj(Object.keys(namespaces).reduce((r, k) => {
            r[k] = namespaces[k].url;
            return r;
        }, {}))
        + ';\nexport {namespaces};\n');
    console.log('export interface TypeDefinition {\n'
        + '    ns: string;\n'
        + '    reqType?: string;\n'
        + '}\n');
    console.log('const definitions: { [key: string]: TypeDefinition } = ' + stringifyObj(definitions)
        + ';\nexport {definitions};');
})();
