const request = require('request');

class OmdbAPI{
    constructor(options){
        this.apiKey = options.apiKey;
        this.serverApi = 'http://www.omdbapi.com/?';
    }

    makeRequest(parameters){

        if (parameters.method==='GET'){
            var query = jsonToQueryString(parameters.parameters);
            console.log(query);
        }


        let url= parameters.url+query+'&apikey='+this.apiKey;
        console.log('url in omdbapi request: '+url);
        let options={
            'url': url,
            'method': parameters.method,
            // 'json': true
        }
        if(parameters.method==='GET'){
            Object.assign(options,{
                'json': true
            })
        }
        if(parameters.method==='POST'){
            Object.assign(options,{
                'json': parameters.parameters
            })
        }

        function promiseRequest(opt){
            return new Promise(function(resolve, reject){
                request(opt, function(err, resp, body){
                    if(err){
                        console.log(err);
                        reject(err);
                    }else resolve(body);
                });
            });
        }

        return promiseRequest(options).then(function(response){
            //console.log(response);
            return response;
        }).catch(function (error){
            throw new Error (error.message);
        });
    }


    get(parameters = {}){
        if(typeof parameters === 'undefined')
            throw new TypeError("Parameters for search were not set");

        //let url=this.serverApi + 'apikey='+ this.apiKey + '&'
        let parametri={
            'url': this.serverApi,
            'method': 'GET',
            'parameters': parameters
        }

        return this.makeRequest(parametri).then(function(response){
            return response;
        })
    }

    verifyUrl(url){
        let promise = new Promise(function (resolve, reject){
            request({method: 'HEAD', uri: url}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //console.log(body);
                    resolve('ok');
                }else resolve('bad');
            })
        });
        return promise.then(function(status){
            console.log('-------> status for'+url+'is '+status);
            return status;
        })
    };
}

function jsonToQueryString(json) {
    return Object
            .keys(json)
            .map(function (key) {
                if (json[key] !== null) {
                    return encodeURIComponent(key) + '=' +
                        encodeURIComponent(json[key]);
                }
            })
            .join('&');
}


module.exports = OmdbAPI;