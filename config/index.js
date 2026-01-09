var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
var __dirname = dirname(fileURLToPath(import.meta.url));
var rootDir = resolve(__dirname, '..');
function loadJson(path) {
    if (!existsSync(path)) {
        return {};
    }
    var content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
}
function deepMerge(target, source) {
    var result = __assign({}, target);
    if (source.api) {
        result.api = __assign(__assign({}, result.api), source.api);
    }
    if (source.dev) {
        result.dev = __assign(__assign({}, result.dev), source.dev);
    }
    if (source.test) {
        result.test = __assign(__assign({}, result.test), source.test);
    }
    return result;
}
var defaultConfig = loadJson(resolve(rootDir, 'config.default.json'));
var userConfig = loadJson(resolve(rootDir, 'config.json'));
export var config = deepMerge(defaultConfig, userConfig);
