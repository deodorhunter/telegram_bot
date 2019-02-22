Date.prototype.toUnixTime = function() { return this.getTime()/1000|0 };
Date.time = function() { return new Date().toUnixTime(); }
const ogs = require('open-graph-scraper');
const firebase = require('firebase');
//database settings
const app = firebase.initializeApp ({
    apiKey: "AIzaSyDM39gVN1lRswYGsWBcN4B4bZU7J0Psrek",
    authDomain: "telegram-bot-for-plex.firebaseapp.com",
    databaseURL: "https://telegram-bot-for-plex.firebaseio.com",
    projectId: "telegram-bot-for-plex",
    storageBucket: "telegram-bot-for-plex.appspot.com",
    messagingSenderId: "441793945348"
});
const ref = firebase.database().ref();
const movieRef=ref.child("movies");
const animeRef= ref.child("anime");
const tvRef=ref.child("tvShows");
const sitesRef=ref.child("sites");



function saveBookmark (scrape, database){
    console.log(scrape);

    var response=[];

    // ogs({'url': siteUrl}).then(function(result){
    //
    //         // if (scelta === 'movies') {
    //         //     database = movieRef;
    //         // }
    //         // else if (scelta === 'tv') {
    //         //     database = tvRef;
    //         // }
    //         // else if (scelta === 'anime') {
    //         //     database = animeRef;
    //         // }
    //         //
    //         // scrape=result;
    //         console.log(result);
    // }).catch(function(error){
    //     console.log('in 1: '+error);
    // });
    let promise=new Promise(function(resolve,reject) {
        console.log('---------->inside savebookmark');
            database.child(scrape.ogTitle).once("value", function (snapshot) {
                console.log(snapshot.exists());
                console.log(snapshot.val());
                if (!snapshot.exists()) {
                    database.child(scrape.ogTitle).set({
                        reqStatus: 0,
                        description: scrape.ogDescription,
                        url: scrape.ogUrl,
                        thumbnail: scrape.ogImage.url,
                        addedBy: scrape.addedBy,
                        addedOn: scrape.date,
                    }, function (error) {
                        if (error) console.log(error);
                        else console.log('Data saved successfully');
                    });
                    response.push('[@' + scrape.addedBy.split('/')[0] + '](tg://user?id=' + scrape.addedBy.split('/')[1] + ') Added \"' + scrape.ogTitle + '\" to category \"' + scrape.category + '\"!');
                    console.log(response);
                    // bot.sendMessage(message.chat.id, 'Added \"' + results.data.ogTitle + '\" to category \"' + scelta + '\"!');
                }
                else response.push('It seems '+ snapshot.val().addedBy.split('/')[0] +' already added this bookmark, watch out for updates on ' + scrape.ogTitle);
                // bot.sendMessage(message.chat.id, 'Seems someone else already added this bookmark, watch out for updates for ' + results.data.ogTitle);
            }).then(function () {
                console.log(response);
                if (typeof response === 'undefined') console.log('errorre in savebookmark promise');
                else resolve(response);
            });
        });

        //     else {
        //         sitesRef.push().set({
        //             url: siteUrl,
        //             category: scelta,
        //             addedBy: sender
        //         }, function (error){
        //             if(error) console.log(error);
        //             else console.log('Data saved successfully');
        //         });
        //         bot.sendMessage(message.chat.id,'Added new %{results.ogTitle}, but there was no OG data!');
        //     }


    return promise.then(function (data){
        console.log('------> resturning data from promise'+data);
        return data;
    }).catch(function (error){
        console.log('in returnong promise:'+error);
    })

};

function searchDB(query, database, options){
    // var results=['*Found results*'];

    var results=[];
    var hits=0;
    let p2 = new Promise(function(resolve,reject) {
        database.once("value", function (snapshot) {
            snapshot.forEach(function (data) {
                var key = data.key;
                var myData = data.val();

                console.log(key);

                if (options == 'myBmks') {
                    if (myData.addedBy.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                        if (myData.reqStatus == 0) {
                            results.push('*' + key + '*\n' + myData.description.toString() + '\n\nRichiesta pendente\n\n');
                            results.join('\n');
                            console.log('inside mybmks');
                        }


                        else results.push('*' + key + '*\n' + myData.description.toString() + '\n\nRichiesta pendente\n\n');
                    }
                }
                if (options == 'getlist') {
                    var d = new Date(myData.addedOn * 1000);
                    console.log(d);
                    results.push('*' + key + '*\n' + myData.description + '\n\n➸ Added by: ' + myData.addedBy.split('/')[0] + '\n➸ on: ' + d+'\n\n');
                }

                if(options=='search'){
                    if(key.toLowerCase().indexOf(query.toLowerCase())!==-1){
                        hits++;
                        results.push('➸ ['+key+']' + '('+myData.url+')');
                    }
                }
            });

        }).then(function(){
            console.log('-------------------------->In searchdb function' + results);
            // bot.sendMessage(msg.chat.id, results.join('\n'), {parse_mode: 'Markdown'});
            if(typeof results === "undefined") console.log('error');
            else if(options==='search' && hits === 0)    resolve('Mi spiace, non ho trovato risultati per la tua ricerca. Aggiungi la tua richiesta con /bookmark!')
            else{
                //var response=[];
                // results.forEach(function(entry){
                //     response.push(entry);
                //     response.join('\n');
                // });
                resolve(results);
            }
        });

    });

    return p2.then(function(data){
        console.log('----------->returning from exec of searchdb: '+data);
        return data;
    }).catch(function(error){
        console.log(error);
    });

};

function test1(query){
    var response=[];
    let test=new Promise(function(resolve,reject){
        var loop = [animeRef, movieRef, tvRef];
        loop.forEach(function (db) {
            searchDB(query, db, 'myBmks').then(function (res1) {
                console.log('first promise' + res1);
                var header = '*In ' + db.toString().split('/')[3] + '*\n';
                response.push(header.toUpperCase());
                response.push(res1);
            }).then(function () {
                console.log('insite loop\n'+response);
                resolve(response);
            });
        });
    });

    return test.then(function(data){
        console.log('i resolved test promise:\n'+data);
        return data;
    })



};

function categorySearchDB(database){
    return database.once("value");
};

function modifyDB(msg, query, options) {
    var response;
    let p = new Promise(function ( resolve,reject) {
        ref.orderByKey().once("value", function (snapshot) {
            snapshot.forEach(function (data) {
                var key = data.key;
                console.log(key);
                ref.child(key).orderByKey().once("value", function (snap) {
                    snap.forEach(function (dati) {
                        var myData2 = dati.val();
                        var key2 = dati.key;
                        if (dati.key.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                            console.log(myData2);
                            path = key + '/' + key2;
                            //console.log('found in   ' + path);
                            if(options == 'accept'){
                                ref.child(path).update({
                                    reqStatus: 1
                                });
                                var temp =  key+'/'+ key2 + '/' + myData2.addedBy;
                                response= temp.split('/');
                                //bot.sendMessage(groupId, 'Congratulations, [@' + mention[0] + '](tg://user?id=' + mention[1] + ')! Your request for ' + key2 + ' has been accepted', {parse_mode: "Markdown"})
                            }
                            if(options == 'remove'){
                                ref.child(path).remove();
                                response=key2;
                                // bot.sendMessage(msg.chat.id, 'Request for ' + key2 + ' has been removed!');
                            }

                        }
                    });
                }).then(function(){
                    console.log('i should be logging mention after exec search:'+response);
                    if(typeof response==="undefined") console.log('vuoto');
                    else resolve(response);
                });
            });
        });
    })

    return p.then(function(data){
        console.log('i should be logging data returned by promise:'+data);
        return data;
    })

}

module.exports.ref=ref;
module.exports.movieRef=movieRef;
module.exports.tvRef=tvRef;
module.exports.animeRef=animeRef;
module.exports.sitesRef=sitesRef;
module.exports.categorySearchDB = categorySearchDB;
module.exports.modifyDB=modifyDB;
module.exports.searchDB=searchDB;
module.exports.test=test1;
module.exports.saveBookmark=saveBookmark;
