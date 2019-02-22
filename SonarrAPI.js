const request = require('request');

class SonarrAPI{
    constructor(options) {
        this.hostname = options.hostname;
        this.port = options.port;
        this.apiKey = options.apiKey;
        this.urlBase = options.urlBase;
        this.ssl = options.ssl || false;
        this.username = options.username || null;
        this.password = options.password || null;
        this.auth = true;

        var serverUrl = 'http' + (this.ssl !== false ? 's' : '') + '://' + this.hostname + ':' + this.port;
        this.serverApi = serverUrl + '/api/';

    }


    makeRequest(parametri){

        console.log('-------------------> sto per fare una richiesta alle API sonarr');
        let requestUrl= this.serverApi+parametri.relativeUrl;
        console.log('url 1:'+requestUrl);

        if(parametri.method === 'GET'){
            requestUrl= requestUrl+jsonToQueryString(parametri.parameters);
            console.log('url 2 :'+requestUrl);
        }

        let headers = {
            'X-API-KEY': this.apiKey
        }

        if(parametri.method === 'POST'){
            Object.assign(headers,{
                'Content-Type': 'application/json'
            });
        }

        let options= {
            'url': requestUrl,
            'headers': headers,
            'method': parametri.method,
        }

        if(parametri.method === 'POST'){
            Object.assign(options, {
                'json': parametri.parameters
            });
        }else{
            Object.assign(options,{
                'json': true
            })
        }
        // console.log('----------------->logging options in makeRequest: '+ JSON.stringify(options));

        function promiseRequest(op){
            return new Promise(function(resolve, reject) {
                // Do async job
                // console.log("----------------------------> in promise");
                request(op, function(err, resp, body) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(body);
                    }
                })
            });
        }
        return promiseRequest(options)
            .then(response =>{
            return response;
    }).catch( e => {
            throw new Error(e.message);
    });
    }

    get(relativeUrl, parameters = {}) {
        console.log('------> inside sonarr get method');
        // no Relative url was passed
        if (relativeUrl === undefined) {
            throw new TypeError('Relative URL is not set');
        }
        // parameters isn't an object
        if (typeof parameters !== 'object') {
            throw new TypeError('Parameters must be type object');
        }

        var parametri = {
            'relativeUrl': relativeUrl,
            'method': 'GET',
            'parameters': parameters,
        };
        console.log('---------> logging options in get/post method: '+ JSON.stringify(parametri));
        return this.makeRequest(parametri)
            .then(function(data){
                return data;
            });
    }

    post(relativeUrl, parameters = {}) {
        // No Relative URL was passed
        if (relativeUrl === undefined) {
            throw new TypeError('Relative URL is not set');
        }
        // Paramet isn't an object
        if (typeof parameters !== 'object') {
            throw new TypeError('Parameters must be type object');
        }

        var parametri = {
            'relativeUrl': relativeUrl,
            'method': 'POST',
            'parameters': parameters
        };
        // console.log('---------> logging options in get/post method: '+ JSON.stringify(parametri));
        return this.makeRequest(parametri)
            .then(function (data) {
                return data;
            });
    }



}
function jsonToQueryString(json) {
    return '?' +
        Object
            .keys(json)
            .map(function (key) {
                if (json[key] !== null) {
                    return encodeURIComponent(key) + '=' +
                        encodeURIComponent(json[key]);
                }
            })
            .join('&');
}


module.exports = SonarrAPI;