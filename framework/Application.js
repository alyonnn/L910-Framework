const http = require('http');
const EventEmitter = require('events');

module.exports = class Application {
    constructor() {
        this.emitter = new EventEmitter();
        this.server = this._createServer();
        this.middlewares = [];
    }

    use(middleware) {
        this.middlewares.push(middleware);
    }

    get(path, handler) { this._addRoute('GET', path, handler); }
    post(path, handler) { this._addRoute('POST', path, handler); }
    put(path, handler) { this._addRoute('PUT', path, handler); }
    patch(path, handler) { this._addRoute('PATCH', path, handler); }
    delete(path, handler) { this._addRoute('DELETE', path, handler); }

    _addRoute(method, path, handler) {
        this.emitter.on(this._getRouteMask(path, method), (req, res) => {
            handler(req, res);
        });
    }

    _getRouteMask(path, method) {
        return `[${path}]:[${method}]`;
    }

    listen(port, callback) {
        this.server.listen(port, callback);
    }

    _createServer() {
        return http.createServer((req, res) => {
            let body = "";
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
                res.send = (data) => {
                    res.writeHead(res.statusCode || 200, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(data);
                };
                res.json = (data) => {
                    res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                };
                res.status = (code) => {
                    res.statusCode = code;
                    return res;
                };

                if (body) {
                    try { req.body = JSON.parse(body); } 
                    catch { req.body = body; }
                }

                this.middlewares.forEach(middleware => middleware(req, res));

                const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
                const pathname = parsedUrl.pathname;
                req.query = Object.fromEntries(parsedUrl.searchParams);
                
                const normalizedPath = (pathname.length > 1 && pathname.endsWith('/')) 
                    ? pathname.slice(0, -1) 
                    : pathname;

                const pathParts = normalizedPath.split('/').filter(Boolean);
                const routeKeys = this.emitter.eventNames();
                let emitted = false;

                for (let key of routeKeys) {
                    const matchPattern = key.match(/\[(.*)\]:\[(.*)\]/);
                    if (!matchPattern) continue;

                    const [, routePath, routeMethod] = matchPattern;
                    const routeParts = routePath.split('/').filter(Boolean);

                    if (routeMethod === req.method && routeParts.length === pathParts.length) {
                        const params = {};
                        const isMatch = routeParts.every((part, i) => {
                            if (part.startsWith(':')) {
                                params[part.slice(1)] = pathParts[i];
                                return true;
                            }
                            return part === pathParts[i];
                        });

                        if (isMatch) {
                            req.params = params;
                            this.emitter.emit(key, req, res);
                            emitted = true;
                            break;
                        }
                    }
                }

                if (!emitted) {
                    console.log(`[404] Маршрут не найден: ${req.method} ${normalizedPath}`);
                    res.status(404).send('Not Found');
                }
            });
        });
    }
}