"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const ENVIRONMENTS = {
    PRODUCTION: 'production',
    STAGING: 'staging',
    SANDBOX: 'sandbox',
};
const BASE_URLS = {
    PRODUCTION: 'https://api.console.eyowo.com',
    STAGING: 'http://52.6.208.160:9193',
    SANDBOX: 'https://api.sandbox.developer.eyowo.com',
};
const FACTORS = { SMS: 'sms' };
class Client {
    constructor({ appKey, appSecret, environment }) {
        this.Auth = {
            validateUser: async ({ mobile }) => {
                const { authData, iv } = this.generateAuthData({
                    message: JSON.stringify({ mobile }),
                });
                try {
                    const req = await this.axiosInstance.post('/v1/users/auth/validate', { authData }, { headers: { 'X-App-Key': this.appKey, 'X-IV': iv } });
                    return req.data;
                }
                catch (error) {
                    if (error.response)
                        return error.response.data;
                    throw error;
                }
            },
            authenticateUser: async ({ mobile, factor, passcode, }) => {
                if (!Object.values(FACTORS).includes(factor)) {
                    throw new Error('Invalid authentication factor');
                }
                const { authData, iv } = this.generateAuthData({
                    message: JSON.stringify({ mobile, factor, passcode }),
                });
                try {
                    const req = await this.axiosInstance.post('/v1/users/auth', { authData }, { headers: { 'X-App-Key': this.appKey, 'X-IV': iv } });
                    return req.data;
                }
                catch (error) {
                    if (error.response)
                        return error.response.data;
                    throw error;
                }
            },
        };
        this.Users = {
            getBalance: async ({ mobile, accessToken, }) => {
                const { authData, iv } = this.generateAuthData({
                    message: JSON.stringify({ mobile }),
                });
                try {
                    const req = await this.axiosInstance.post('/v1/users/balance', { authData }, {
                        headers: {
                            'X-App-Key': this.appKey,
                            'X-IV': iv,
                            'X-App-Wallet-Access-Token': accessToken,
                        },
                    });
                    return req.data;
                }
                catch (error) {
                    if (error.response)
                        return error.response.data;
                    throw error;
                }
            },
            transferToPhone: async ({ mobile, amount, accessToken, }) => {
                const { authData, iv } = this.generateAuthData({
                    message: JSON.stringify({ mobile, amount }),
                });
                try {
                    const req = await this.axiosInstance.post('/v1/users/transfers/phone', { authData }, {
                        headers: {
                            'X-App-Key': this.appKey,
                            'X-IV': iv,
                            'X-App-Wallet-Access-Token': accessToken,
                        },
                    });
                    return req.data;
                }
                catch (error) {
                    if (error.response)
                        return error.response.data;
                    throw error;
                }
            },
        };
        if (!appKey) {
            throw new Error('App key is required');
        }
        if (!appSecret) {
            throw new Error('App secret is required');
        }
        if (environment && !Object.values(ENVIRONMENTS).includes(environment)) {
            throw new Error('Invalid environment');
        }
        this.environment = environment || ENVIRONMENTS.PRODUCTION;
        this.appKey = appKey;
        this.appSecret = appSecret;
        let baseURL = BASE_URLS.PRODUCTION;
        switch (environment) {
            case ENVIRONMENTS.PRODUCTION:
                baseURL = BASE_URLS.PRODUCTION;
                break;
            case ENVIRONMENTS.SANDBOX:
                baseURL = BASE_URLS.SANDBOX;
                break;
            case ENVIRONMENTS.STAGING:
                baseURL = BASE_URLS.STAGING;
                break;
        }
        this.axiosInstance = axios_1.default.create({ baseURL });
    }
    generateAuthData({ message }) {
        const iv = crypto_js_1.default.lib.WordArray.random(16).toString();
        return {
            authData: crypto_js_1.default.AES.encrypt(message, crypto_js_1.default.enc.Base64.parse(this.appSecret), { iv: crypto_js_1.default.enc.Base64.parse(iv) }).toString(),
            iv,
        };
    }
}
exports.Client = Client;
