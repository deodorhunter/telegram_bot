//load modules needed
Date.prototype.toUnixTime = function() { return this.getTime()/1000|0 };
Date.time = function() { return new Date().toUnixTime(); }

//imports
const TelegramBot = require('node-telegram-bot-api');
const ogs = require('open-graph-scraper');
const firebase = require('firebase');
const fs = require("fs");
const RadarrMessage = require('./RadarrMessage');
const SonarrMessage = require('./SonarrMessage');
const NodeCache = require('node-cache');
const state = require('./state');
const _ = require('lodash');
const dbFunctions = require('./utils');
const OmdbMessage = require('./OmdbMessage');
const request = require('request');

//local variables
const token='726883745:AAFbQ84Dqe10_-l3phqloxL8RgQQUJSzkaY';
const bot = new TelegramBot(token, {polling:true});
const radarrCache = new NodeCache({ stdTTL: 120, checkperiod: 150 });
const sonarrCache = new NodeCache({ stdTTL: 120, checkperiod: 150 });
const botCache = new NodeCache({ stdTTL: 120, checkperiod: 150 });
const myId = 465815448;
const groupId = '-332791650';
const dioporco='@ana_t_bot';
const ref = dbFunctions.ref;
const movieRef = dbFunctions.movieRef;
const animeRef = dbFunctions.animeRef;
const tvRef = dbFunctions.tvRef;
const sitesRef = dbFunctions.sitesRef;

var omdb = new OmdbMessage();
//global lets
let query;
let sender;
let cat;
let siteUrl;
let accept;
let path;
let remove;
let date;


bot.on('message', function(msg){
    var user = msg.from;
    var chat = msg.chat;
    var message = msg.text;
    var radarr = new RadarrMessage(bot, user, chat, radarrCache);
    var sonarr = new SonarrMessage(bot, user, chat, sonarrCache);

    console.log('Message listened:' + message);

    if (/\/radarr (.+)/g.test(message)) {

        var movie = [];
        var query = message.split(" ");
        for(var i=1; i<query.length; i++){
            movie.push(query[i]);
        }
        return radarr.searchList(movie);
    }

    if (/\/sonarr (.+)/g.test(message)) {

        var query = message.split(' ');
        var serie=[];
        for (var i=1;i<query.length; i++){
            serie.push(query[i]);
        }
        console.log(serie);
        return sonarr.searchList(serie);
    }

    if(/\/omdb (.+)/g.test(message)){
        var query = message.split('omdb ')[1];
        console.log(query);
        return omdb.search(query);
    }

    var radarrCurrentState = radarrCache.get('state' + msg.from.id);
    var sonarrCurrentState = sonarrCache.get('state' + msg.from.id);
    console.log('\nRadarr Current state log: '+radarrCurrentState);
    console.log('\nSonarr Current state log: '+sonarrCurrentState);

    if(radarrCurrentState === state.radarr.CONFIRM){
        return radarr.confirmSelection(message);
    }
    if(radarrCurrentState === state.radarr.PROFILE){
        return radarr.getProfiles(message);
    }
    if(radarrCurrentState === state.radarr.FOLDER){
        return radarr.getFolders(message);
    }
    if(radarrCurrentState === state.radarr.ADD_MOVIE){
       return radarr.addMovie(message);
    }

    if(sonarrCurrentState === state.sonarr.CONFIRM){
        return sonarr.confirmSelection(message);
    }
    if(sonarrCurrentState === state.sonarr.PROFILE){
        return sonarr.getProfiles(message);
    }
    if(sonarrCurrentState === state.sonarr.FOLDER){
        return sonarr.getFolders(message);
    }
    if(sonarrCurrentState === state.sonarr.ADD_SERIES){
        return sonarr.addSeries(message);
    }

});


//help section
bot.onText(/\/help/, (msg,match) =>{
    console.log(msg.chat.id)

    bot.sendMessage(msg.chat.id, 'Sono solo una bottana, questo è quello che faccio (per 50 euro)\n\n'+
            'usa @ana_t_bot + titolo di quello che vuoi cercare, e scegli tra i risultati. Clicca Bookmark it! sotto il risultato selezionato per aggiungerlo\n'+
            '/getlist: uso /getList (anime,movies,tv), restituisce una lista completa degli elementi presenti per categoria\n'+
            '/searchfilm, /searchtv, /searchanime (ricerca), restituisce i match alla keyword nella categoria\n' +
            '/mybmks: restituisce una lista completa di tutti i bookmark personali salvati\n' +
            '/bot: link al bot per chat privata\n'+
            '/lsc: comando segreto#1 (da usare spesso)\n'+
            '/quality: lo stream è in bassa qwualità-impiega troppo tempo in buffer? Leggi perchè e come risolvere!\n'+
            '/help: mostra tutti i comandi\n');
});

//quality
bot.onText(/\/quality/, (msg,match) =>{
    const photo1='https://i.imgur.com/5nL4wzZ.png';
    const photo2='https://i.imgur.com/V09IGUD.png';
    const photo3='https://i.imgur.com/QNdw83X.png';
    const message ='PLEX viene impostato per abbassare la qualità video se rileva poca connessione sul vostro client. Si tratta comunque di una funzione beta, ' +
                'quindi non sempre la stima è accurata. Se siete SICURI che la vostra connessione supporta formati di qualità migliori o il formato del file originale,' +
                ' impostatelo in originale (PREFERITO) o in un formato più elevato, anche perchè minore è la compressione che deve eseguire per riprodurre il vostro file,' +
                ' minore è il carico sul server. Se vedete che lagga, abbassate la qualità del video in maniera opposta. Anche elezionare tracce audio a meno canali/con bitrate minore,' +
                ' soprattutto se non avete impianti 5.1 dove state riproducendo (probabilmente da portatile, quindi sicuramente no)è in grado di diminuire il carico sul server e di' +
                ' velocizzare il buffering, se ne state soffrendo. I formati di compressione sono espressi in qualità e banda necessaria, in seguito come modificare questi parametri:';

    bot.sendMessage(msg.chat.id, message);
    bot.sendPhoto(msg.chat.id, photo3, {caption: 'Come cambiare le impostazioni di connessione del vostro client, mettere esattamente questi valori'});
    bot.sendPhoto(msg.chat.id, photo1, {caption: 'Come cambiare formati audio e video'});
    bot.sendPhoto(msg.chat.id, photo2, {caption: 'Come vedere informazioni riguardo alle dimensioni di video e audio'});
});

//get bot chat
bot.onText(/\/bot/, (msg, match) =>{
    bot.sendMessage(msg.chat.id, 'Mi puoi raggiungere in privato a t.me/ana_t_bot');
});

//get help with linking bookmarks
bot.onText(/\/howtourl/, (msg, match) =>{
    bot.sendMessage(msg.chat.id, 'Usa @imdb in privato per cercare il film/serieTv (al fine di evitare spam), e poi usa il link trovato per aggiungere un bookmark se vuoi!');
});

//il comando che tutti volevano
bot.onText(/\/lsc/, (msg,match) => {
   const photo='https://i.imgur.com/WQxCZ1w.jpg?1';
   bot.sendPhoto(msg.chat.id, photo, {caption:"LUCIA STAI CALMA!"});
});

//change reqStatus of entries, add || (data.status == "administrator") to enable admins or add || (data.status === "creator") for group creator
bot.onText(/\/accept (.+)/, (msg,match) =>{
    // console.log('sono in accept\n voglio entrare se '+myId+' = '+ msg.from.id+' corrispondono');
    bot.getChatMember(msg.chat.id, msg.from.id).then(function(data) {
    if ((data.status == "creator") || msg.from.id==myId ){
        accept=match[1];
        dbFunctions.modifyDB(msg,accept,'accept').then( function(data){
            console.log('i should be loggin data after promise resolve in accept function:'+data);
            //console.log('Congratulations, [@' + data[2] + '](tg://user?id=' + data[3] + ')! Your request for ' + data[1] + ' has been accepted')
            bot.sendMessage(groupId, 'Congratulations, [@' + data[2] + '](tg://user?id=' + data[3] + ')! Your request for ' + data[1] + ' has been accepted', {parse_mode:'Markdown'});
            var keyboard=[['Yes'],['No']];
            var response=['Do you want to add it now to server?'];
            var cbData;
            //console.log(response);
            //console.log(keyboard);

            if(data[0]==='anime'|| data[0]==='tvShows') cbData='/sonarr '+data[1];
            else if (data[0]==='movies') cbData='/radarr '+data[1];
            console.log(cbData);
            bot.sendMessage(msg.chat.id, response.join('\n'), {
                reply_markup: {
                    'inline_keyboard': [[
                        {
                            text: 'Yes',
                            callback_data: cbData
                        }, {
                            text: 'No',
                            callback_data: 'no'
                        }
                    ]]
                }
            });

        }).catch(function(error){
            console.log(error);
        })
    }else    bot.sendMessage(msg.chat.id,'Non hai i diritti per accettare le richieste degli altri utenti!');
});

});

//remove request, add || (data.status == "administrator") to enable admins
bot.onText(/\/remove (.+)/, (msg,match) =>{
    bot.getChatMember(msg.chat.id, msg.from.id).then(function(data) {
        if ((data.status == "creator") || msg.from.id==myId ){
            remove=match[1];
            dbFunctions.modifyDB(msg,remove,'remove').then(function(data){
                bot.sendMessage(myId, 'Request for '+data+'has been successfully removed!');
            }).catch(function(error){
                console.log(error);
            });
        }else    bot.sendMessage(msg.chat.id,'Non hai i diritti per eliminare le richieste degli altri utenti!');
    });
});

//We created an empty let which we will use to store the received URL. Then we use the Telegram API to catch the onText
// event and use a Regular Expressions to separate the URL from the command. This will create an array from which we will
// select the second value (which is [1] because arrays start from zero) and set the variable siteUrl to this value.
// bot.onText(/\/bookmark (.+)/, (msg, match) => {
//     siteUrl = match[1];
//     console.log(siteUrl);
//     var prova = siteUrl.toString();
//     console.log(prova);
//     if (prova === dioporco){
//         console.log("dioporco");
//         return -1;
//     }
//     sender=msg.from.first_name+'/'+msg.from.id;
//     console.log(sender);
//     bot.sendMessage(msg.chat.id,'Got it, in which category?', {
//         reply_markup: {
//             inline_keyboard: [[
//                 {
//                     text: 'Film',
//                     callback_data: 'movies'
//                 },{
//                     text: 'SerieTv',
//                     callback_data: 'tv'
//                 },{
//                     text: 'Anime',
//                     callback_data: 'anime'
//                 }
//             ]]
//         }
//     });
// });

//dump data
// bot.onText(/\/dump/, (msg,match) => {
//
//     date=Date.time();
//     console.log(msg.chat.id);
//     var filename="C:\\Users\\marti\\Google Drive/dumps/dump"+date+".json";
//     ref..orderByChild('addedOn').once("value", function (snapshot){
//         snapshot.forEach(function (data){
//             var myData = data.val();
//             console.log(myData);
//             fs.appendFile(filename, JSON.stringify(myData,null, 4), (err) =>{
//                 if(err){
//                     console.error(err);
//                     return;
//                 }
//                 console.log("File has been created");
//             });
//         });
//         bot.sendMessage(msg.chat.id, "File created on localhost!");
//     });
// });

//returns list of entries, divided by category children
bot.onText(/\/getlist (.+)/, (msg,match) => {
    cat=match[1];
    var tipo = msg.chat.type;
    console.log(tipo);
    var response=['*I found the following results*\n'];
    if(tipo.indexOf("private") !== -1) {
        if (cat == 'movies') {
            dbFunctions.searchDB(null, movieRef, 'getlist').then(function(movieRes){
                movieRes.forEach(function(entry){
                    response.push(entry);
                    response.join('\n');
                });
            }).then(function(){
                bot.sendMessage(msg.chat.id, response.join('\n'), {parse_mode: 'Markdown'});
            });
        }
        else if (cat == 'tv') {
            dbFunctions.searchDB(null, tvRef, 'getlist').then(function(tvRes){
                tvRes.forEach(function(entry){
                    response.push(entry);
                    response.join('\n');
                });
            }).then(function(){
                bot.sendMessage(msg.chat.id, response.join('\n'), {parse_mode: 'Markdown'});
            });
        }
        else if (cat == 'anime') {
            dbFunctions.searchDB(null, animeRef, 'getlist').then(function(animeRes){
                animeRes.forEach(function(entry){
                    response.push(entry);
                    response.join('\n');
                });
            }).then(function(){
                bot.sendMessage(msg.chat.id, response.join('\n'), {parse_mode: 'Markdown'});
            });
        }
    }
    else
        bot.sendMessage(msg.chat.id, msg.from.first_name + ', smettila di spammare coglione, chiedimelo in privato. ' +
            'Se non sai dove trovarmi (oltre a casa di tua mamma), usa /bot');
});

//get user bookmarks, with info on reqStatus
bot.onText(/\/mybmks/, (msg, match) =>{
    var tipo = msg.chat.type;
    console.log(tipo);
    var promises=[];
    var response=[];
    var i=0;
    if(tipo.indexOf("private") !== -1) {
        var loop = [animeRef, movieRef, tvRef];
        loop.forEach(function (db) {
            promises.push(
                dbFunctions.searchDB(msg.from.first_name, db, 'myBmks').then(function (res1) {
                    console.log('first promise' + res1);
                    var header = '*In ' + db.toString().split('/')[3] + '*\n';
                    response.push(header.toUpperCase());
                    response.push(res1);
                }).catch(function (error) {
                    console.log(error);
                }));
        });

        Promise.all(promises).then(function(){
            var send=[];
            response.forEach(function(entry){
                send.push(entry);
                send.join('\n');
            })
            bot.sendMessage(msg.chat.id, send.join('\n'), {parse_mode: 'Markdown'});
        });
    }
    else
        bot.sendMessage(msg.chat.id, msg.from.first_name + ' smettila di spammare coglione, chiedimelo in privato. ' +
        'Se non sai dove trovarmi (oltre a casa di tua mamma), usa /bot');
});


//NoSQL doesn't have %LIKE% queries, shame. Should implement ElasticSearch?
bot.onText(/\/searchfilm (.+)/, (msg, match) => {
    query = match[1];
    dbFunctions.searchDB(query, movieRef, 'search').then(function(res){
        console.log(res);
        var results=['*Found '+res.length+' results*'];
        res.forEach(function(entry){
            results.push(entry);
            results.join('\n');
        });

        bot.sendMessage(msg.chat.id, results.join('\n'),{
            'parse_mode':'Markdown',
            'disable_web_page_preview':true
        } );
    }).catch(function(error){
        console.log(error);
    });
});


bot.onText(/\/searchtv (.+)/, (msg, match) =>{
    query=match[1];
    dbFunctions.searchDB(query, tvRef, 'search').then(function(res){
        console.log(res);
        var results=['*Found '+res.length+' results*'];
        res.forEach(function(entry){
            results.push(entry);
            results.join('\n');
        });

        bot.sendMessage(msg.chat.id, results.join('\n'),{
            'parse_mode':'Markdown',
            'disable_web_page_preview':true
        } );
    }).catch(function(error){
        console.log(error);
    });

});

bot.onText(/\/searchanime (.+)/, (msg, match) =>{
    query=match[1];

    dbFunctions.searchDB(query, animeRef, 'search').then(function(res){
        console.log(res);
        var results=['*Found '+res.length+' results*'];
        res.forEach(function(entry){
            results.push(entry);
            results.join('\n');
        });

        bot.sendMessage(msg.chat.id, results.join('\n'),{
            'parse_mode':'Markdown',
            'disable_web_page_preview':true
        } );
    }).catch(function(error){
        console.log(error);
    });
});

//Now we need the bot to scrape the OG data and save it
//If the bot receives a callback query (meaning that we used the inline keyboard to sent something to him in this case)
// it will receive this information and process it.ogs (Open Graph Scraper) will scrap the URL we passed it into a JSON file.
//If the scraping is successful (we check by using the success flag) it pushes the OG information, along with the site URL,
// to Firebase and sends us a reply letting use know it added the bookmark
bot.on("callback_query", (callbackQuery) => {
    const message = callbackQuery.message;
    var scrape;
    console.log('Inside callback_query');
    console.log(callbackQuery);
    console.log(message);
    if(typeof message==='undefined'){
        console.log('inside new bookmark command');
        var url= callbackQuery.data.split('-')[0];
        var scelta= callbackQuery.data.split('-')[1];
        console.log('url: '+url+' scelta: '+scelta);
        ogs({'url': url}).then(function(results){
            if (results.success) {
                var database;
                if (scelta === 'movie') {
                    database = dbFunctions.movieRef;
                }
                else if (scelta === 'series') {
                    database = dbFunctions.tvRef;
                }
                else if (scelta === 'anime') {
                    database = dbFunctions.animeRef;
                }
                var date=new Date().toUnixTime();
                scrape=results.data;
                Object.assign(scrape, {
                    date: date,
                    addedBy: callbackQuery.from.first_name+'/'+callbackQuery.from.id,
                    category: scelta
                })
                console.log(scrape);
            }
            dbFunctions.saveBookmark(scrape, database).then(function(data){
                console.log('i should wait for function, which returned:'+data);
                //bot.sendMessage(callbackQuery.chat_instance, data.join('\n'));
                bot.answerCallbackQuery(callbackQuery.id);
                bot.editMessageText(data.join('\n'), {inline_message_id: callbackQuery.inline_message_id, parse_mode: 'Markdown'});
            }).catch( function(error){
                console.log('in main :'+error);
            });
        }).catch(e=>{
            console.log(e.message)
        })
    }
    if(message!== 'undefined' && message.text === 'Got it, in which category?')
    {
        var scelta = callbackQuery.data.toString();
        console.log('----->hai scelto: '+scelta);
        ogs({'url': siteUrl}).then(function(results){
            if (results.success) {
                var database;
                if (scelta === 'movies') {
                    database = dbFunctions.movieRef;
                }
                else if (scelta === 'tv') {
                    database = dbFunctions.tvRef;
                }
                else if (scelta === 'anime') {
                    database = dbFunctions.animeRef;
                }
                scrape=results.data;

                Object.assign(scrape, {
                    date: message.date,
                    addedBy: sender,
                    category: scelta
                })
                console.log(scrape);
            }
            dbFunctions.saveBookmark(scrape, database).then(function(data){
                console.log('i should wait for function, which returned:'+data);
                bot.sendMessage(message.chat.id, data.join('\n'));
                bot.answerCallbackQuery(callbackQuery.id);
            }).catch( function(error){
                console.log('in main :'+error);
            });
        })

    }
    else if(message!='undefined' && message.text == 'Do you want to add it now to server?')
    {
        var toDo = callbackQuery.data.toString();
        if(toDo!=='no'){
            var response='Let me do it, sir!';
            var keyboard=[];
            keyboard.push([toDo]);
            bot.sendMessage(message.chat.id, response, {
                selective: 2,
                reply_markup:{
                    'keyboard': keyboard,
                    'one_time_keyboard': true,
                }
            });

        }  else bot.sendMessage(message.chat.id, 'K...');

        bot.answerCallbackQuery(callbackQuery.id);
    }
    //if(message.text.indexOf('Let\'s see what we\'ve got...')!==-1){
    //else if(typeof message === 'undefined'){

    //}

});

bot.on('inline_query', (callbackInlineQuery)=>{
    const query = callbackInlineQuery.query;
    var inline_query_id= callbackInlineQuery.id;
    console.log('------------->id:'+inline_query_id+ 'offset:'+callbackInlineQuery.offset);
    var results=[];
     omdb.search(query, inline_query_id).then(function (data){

        data.forEach(function(element){
            results.push(element);
        })
        console.log('------->Results found'+ JSON.stringify(results));
        bot.answerInlineQuery(inline_query_id,results).catch(e=>{
            console.log(e.message);
        });
    });

});

bot.on('chosen_inline_result', (ctx)=>{
    console.log(ctx);
});

Date.prototype.toUnixTime = function() { return this.getTime()/1000|0 };