const OmdbAPI = require('./OmdbAPI');
const _ = require('lodash');
const request = require('request');

function OmdbMessage() {
    // this.bot      = bot;
    // this.user     = user;
    // this.chat     = chat;

    this.omdb = new OmdbAPI({
        apiKey   : '364676eb'
    });
}

//OmdbMessage.prototype._sendMessage(response){

    //
    // let options = {
    //     reply_markup: {
    //         inline_keyboard: [[
    //             {
    //                 text: 'Bookmark it!',
    //                 callback_data:
    //             }
    // }
//}

OmdbMessage.prototype.search = function (title, queryId){
    var me=this;
    console.log('----->Got title:'+title);
    title='*'+title+'*';
    var response=[];
    var promises=[];
    console.log('readying for wildcard search'+ title);
    let p = new Promise(function(resolve, reject){
        me.omdb.get({'s': title}).then(function(result) {
            //console.log('---------> I found: '+JSON.stringify(result));
            var risultati = result.Search;
            //console.log(risultati);
            _.forEach(risultati, function (n, key) {
                promises.push(
                    me.searchTitle(queryId+'/'+key, n.Title).then(function (dati) {
                        dati.forEach(function(data){
                            var message_text;
                            var responseObject;
                            var category;
                            var ranking = parseInt(data.imdbVotes)+parseInt(data.imdbRating)*100;
                            if(data.Poster!==' ' && data.imdbID!=='undefined') {
                                message_text = '[\u00A0](' + data.Poster + ')\n' +'Let\'s see what we\'ve got here...\n' + '*' + data.Title + ' (' + data.Year + ')*\n' + '[IMDb](https://www.imdb.com/title/' +
                                    data.imdbID + '/)\n' + 'Rating: ' + data.imdbRating + '\n' + 'Genre: ' + data.Genre + '\n\n' +  data.Plot + '\n'
                            }else if(data.Poster===' ' && data.imdbID!=='undefined') {
                                message_text = 'Let\'s see what we\'ve got here...\n' + '*' + data.Title + ' (' + data.Year + ')*\n'+'[IMDb](https://www.imdb.com/title/'+
                                     data.imdbID+'/)\n' +  'Rating: ' + data.imdbRating + '\n' + 'Genre: ' + data.Genre + '\n\n' + data.Plot + '\n';
                            }
                            if(data.Country === 'Japan' && data.Type === 'series'){
                                category='anime';
                                console.log('-----------------------------------------------> CAgetory should be set to anime, right? '+category);
                            }
                            else category=data.Type;

                            if(data.Poster!==' ') {
                                responseObject = {
                                    'type': 'article',
                                    'id': queryId + '/' + key,
                                    'title': data.Title || ' ',
                                    'description': data.Plot,
                                    'input_message_content': {
                                        'message_text': message_text,
                                        'parse_mode': 'Markdown'
                                    },
                                    'rating': data.imdbRating,
                                    'ranking': ranking,
                                    'thumb_url': data.Poster || '',
                                    'reply_markup': {
                                        'inline_keyboard': [[
                                            {
                                                'text': 'Bookmark it!',
                                                'callback_data': 'https://www.imdb.com/title/'+data.imdbID + '-' + category
                                            }
                                        ]]
                                    }
                                }
                            }else{
                                    responseObject={
                                        'type': 'article',
                                        'id': queryId + '/' + key,
                                        'title': data.Title || ' ',
                                        'description': data.Plot,
                                        'input_message_content': {
                                            'message_text': message_text,
                                            'parse_mode': 'Markdown'
                                        },
                                        'rating': data.imdbRating,
                                        'ranking': ranking,
                                        //'thumb_url': data.Poster || '',
                                        'reply_markup': {
                                            'inline_keyboard': [[
                                                {
                                                    'text': 'Bookmark it!',
                                                    'callback_data': 'https://www.imdb.com/title/'+data.imdbID + '-' + category
                                                }
                                            ]]
                                        }
                                }
                            }
                            //console.log(data.id+'has response: '+data.Response);
                            if(data.Response==='True') {
                                response.push(responseObject);
                                //console.log('----------> logging inlineQueryResult: '+JSON.stringify(responseObject));
                            }
                        });

                    })
                );
            });
            Promise.all(promises).then(function () {

                //     return response;
                response.sort(function(a,b){
                    return b.ranking - a.ranking;
                })
                //console.log('---->should loge response array:'+response);
                resolve(response);
            });
        });
    });

    return p.then(function(data){
        //console.log('---------->about to return data'+data);
        return data;
    }).catch(function(error){
        console.log(error);
    });
}

OmdbMessage.prototype.searchTitle = function(index,title){
    var me = this;
    var response=[];
    var promises=[];
    let promise= new Promise(function(resolve, reject){
        me.omdb.get({'t': title}).then(function(data){
            // if(data.Response!=="False") {
                me.omdb.verifyUrl(data.Poster).then(function (status) {
                    if (status === 'bad') {
                        data.Poster = ' ';
                        //console.log(data);
                    }
                    response.push(data);
                    //console.log(response);
                }).then(function () {
                    //console.log('-------------->Inside searchTitle: '+response);
                    resolve(response);
                }).catch(function (e) {
                    console.log(e);
                });
            // }



                // 'title': title,
                // 'description': message,
                // 'thumb_url': data.Poster || '',
            //});

        });

    });

    return promise.then(function(res){
        //console.log('---------> returnng searchTitle: '+JSON.stringify(res));
        return res;
    })
}

module.exports = OmdbMessage;