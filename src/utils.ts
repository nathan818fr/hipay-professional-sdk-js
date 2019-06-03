export const getPackageVersion = () => {
    try {
        const pkg = require(__dirname + '/../package.json');
        return pkg.version || '?';
    } catch (e) {
        return '?';
    }
};

export const objectGetOrThrow = (obj: any, ...keys: string[]) => {
    let r = obj;
    for (const key of keys) {
        r = r[key];
        if (typeof r === 'undefined') {
            throw new Error(key + ' is missing!');
        }
    }
    return r;
};

export const createBodyParameters = (data: any, key?: string): any => {
    if (data === undefined || data === null) {
        return undefined;
    }
    if (typeof data === 'boolean') {
        return data ? 1 : 0;
    }
    if (typeof data === 'object') {
        if (Array.isArray(data)) {
            return {item: data.map((k) => createBodyParameters(k))};
        }
        if (data instanceof Date) {
            return data.toISOString().substr(0, 19); // MySQL DATETIME format (Y-m-dTH:i:s) eg.: 2014-12-25T10:57:55
        }
        if (key === 'freeData') { // TODO: Support custom types using TypeDefinition
            return {item: Object.keys(data).map((k) => ({key: k, value: data[k]}))};
        }
        const parameters: any = {};
        for (const k in data) {
            if (data.hasOwnProperty(k)) {
                parameters[k] = createBodyParameters(data[k], k);
            }
        }
        return parameters;
    }
    return data;
};
