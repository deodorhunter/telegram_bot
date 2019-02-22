
const _ = require('lodash');
const SonarrAPI = require('./SonarrAPI');
const state = require('./state');
const event = require('events');

function SonarrMessage(bot, user, chat, cache) {
    this.bot      = bot;
    this.user     = user;
    this.chat     = chat;
    this.cache    = cache;
    this.adminId  = 465815448;
    this.username = this.user.username || (this.user.first_name + (' ' + this.user.last_name || ''));

    this.sonarr = new SonarrAPI({
        hostname : 'localhost',
        apiKey   : '76342ecd18d24b38bf76e8fe484b81f6',
        port     : 38082,
        urlBase  : '',
        ssl      : false,
        username : '',
        password : '',
    });
}

SonarrMessage.prototype._sendMessage = function(message, keyboard) {
    var me = this;
    keyboard = keyboard || null;
    console.log(message);
    var options;
    if (message instanceof Error ) {
        message = message.message;
        options = {
            'parse_mode': 'Markdown',
            'reply_markup': {
                'hide_keyboard': true
            }
        };

    } else {
        options = {
            // 'disable_web_page_preview': true,
            'parse_mode': 'Markdown',
            'selective': 2,
            'reply_markup':
                {
                    'keyboard': keyboard,
                    // 'one_time_keyboard': true,
                    'remove_keyboard': true
                }
        };
    }

    return me.bot.sendMessage(this.chat.id, message, options);
};





SonarrMessage.prototype.searchList = function(title){
    console.log('----------------> Inside sonarr search');
    var me = this;
    me.sonarr.get('series/lookup', {'term': title}).then(function(result){
        console.log('---------------->Searching');
        console.log('----------------> Found '+ result);
        var serie = result;
        var seriesList=[], keyboard=[];
        var response = ['I found the following series'];
        _.forEach(serie, function (n,key){

            console.log(n.seasons);
            var cover=null;
            _.forEach(n.images, function (image,index){
                if(image.coverType === 'poster')
                    cover=image.url

            });
            var id = key + 1;
            var keyboardValue = n.title + (n.year ? ' - ' + n.year : '');

            seriesList.push({
                'id': id,
                'title': n.title,
                'plot': n.overview,
                'year': n.year,
                'tvdbId': n.tvdbId,
                'titleSlug': n.titleSlug,
                'seasons': n.seasons,
                'keyboardValue': keyboardValue,
                'coverUrl': cover
            });

            keyboard.push([keyboardValue]);
            response.push('➸ ['+keyboardValue+'](https://www.thetvdb.com/series/'+n.tvdbId+')');
        });

        response.push('Seleziona dal menu');

        //set cache
        me.cache.set('seriesList' + me.user.id, seriesList);
        me.cache.set('state' + me.user.id, state.sonarr.CONFIRM);

        return me._sendMessage(response.join('\n'), keyboard);
    })
        .catch(function(error) {
            me._clearCache().then(function(data){
                return me._sendMessage(error);
            })
        });
};

SonarrMessage.prototype.confirmSelection=function(choice){
    console.log('----------> inside sonarr confirm selection');
    var me =this;
    var seriesList = me.cache.get('seriesList' + me.user.id);

    var serie = _.filter(seriesList, function(item){
        return item.keyboardValue === choice;
    })[0];
    console.log(serie);

    me.sonarr.get('series').then(function(result){
        var keyboard = [['Yes'], ['No']];
        var response = ['*' + serie.title + '('+serie.year + ')*\n'];
        response.push(serie.plot + '\n');

        me.cache.set('state'+ me.user.id, state.sonarr.PROFILE);
        me.cache.set('seriesId' + me.user.id, serie.id);

        return me._sendMessage(response.join('\n'), keyboard);
    }).catch(function(error){
        me._clearCache().then(function(data){
            return me._sendMessage(error);
        })
    })


}
SonarrMessage.prototype.getProfiles = function (name) {

    var me = this;
    // var movieId = me.cache.get('movieId'+me.user.id);

    me.sonarr.get('profile').then(function (result){
        var profiles = result;
        var profileList=[], keyboard=[],keyboardRow=[];

        var response = ['*Found ' + profiles.length + ' profiles*'];
        _.forEach(profiles, function (n,key){
            profileList.push({ 'name': n.name, 'profileId': n.id });
            response.push('➸ ' + n.name);

            keyboardRow.push(n.name);
            if (keyboardRow.length === 2) {
                keyboard.push(keyboardRow);
                keyboardRow = [];
            }
        });

        me.cache.set('state' + me.user.id, state.sonarr.FOLDER);
        me.cache.set('seriesProfileList' + me.user.id, profileList);

        return me._sendMessage(response.join('\n'), keyboard);
    })
        .catch(function(error) {
            me._clearCache().then(function(data){
                return me._sendMessage(error);
            })
        });
}

SonarrMessage.prototype.getFolders = function (name) {

    var me = this;
    var profileList = me.cache.get('seriesProfileList'+me.user.id);

    var profile = _.filter(profileList, function(item){
        return item.name === name;
    })[0];

    me.sonarr.get('rootfolder').then(function (result){
        console.log('Request for folders returned results')
        var folders = result;
        var folderList=[], keyboard=[],disks=[];
        console.log('About to get disk spaces');
        me.sonarr.get('diskspace').then(function(diskSpaceResult){
            var disk = diskSpaceResult;
            console.log(disk);
            _.forEach(disk, function(n,key){
                disks.push({
                    'path': n.path,
                    'freeSpace': formatBytes(n.freeSpace),
                    'totalSpace': formatBytes(n.totalSpace)
                });
            });
            console.log('getting disks for ya'+JSON.stringify(disks));

            var response = ['*Found paths:*'];
            _.forEach(folders, function (n,key){
                _.forEach(disks, function(d, key){
                    if(n.path.indexOf(d.path) !== -1){
                        var space = d.freeSpace+'/'+d.totalSpace;
                        folderList.push({ 'path': n.path, 'folderId': n.id });
                        response.push('➸ ' + n.path+ '    ('+space+')');
                        keyboard.push([n.path ]);
                    }
                });
            });
            // console.log('out of folder for each');
            // console.log('disks'+JSON.stringify(disks));
            me.cache.set('seriesProfileId' + me.user.id, profile.profileId);
            me.cache.set('seriesFolderList' + me.user.id, folderList);
            me.cache.set('state' + me.user.id, state.sonarr.ADD_SERIES);
            return me._sendMessage(response.join('\n'), keyboard);
        })

    }).catch(function(error) {
        me._clearCache().then(function(data){
            return me._sendMessage(error);
        })

    });
}

SonarrMessage.prototype.addSeries =function (folder) {

    console.log('----------------> inside addSeries 1');
    var me=this;
    var folderList = me.cache.get('seriesFolderList'+me.user.id);
    var seriesList = me.cache.get('seriesList'+ me.user.id);
    var serieId = me.cache.get('seriesId' + me.user.id);
    var qualityProfileId = me.cache.get('seriesProfileId' + me.user.id);

    var rootFolderPath = _.filter(folderList, function(item){
        return item.path === folder;
    })[0];

    var serie = _.filter(seriesList, function(item){
        return item.id === serieId;
    })[0];

    console.log(serie);


    var postOptions={
        'title': serie.title,
        'qualityProfileId': qualityProfileId,
        'titleSlug' : serie.titleSlug,
        'tvdbId': serie.tvdbId,
        'images': [],
        'seasons': serie.seasons,
        'rootFolderPath': rootFolderPath.path,
    }
    console.log('----------------> inside addSeries: set postoptions');
    console.log(JSON.stringify(postOptions));

    me.sonarr.post('series',postOptions).then(function(result){
        return me._clearCache();
    }).catch(function(error){
           me._clearCache().then(function(){
               return me._sendMessage(error);
           })
    }).finally(function(){
        console.log('About to end and return message');
        me.searchMissing();
        return me.bot.sendMessage(me.chat.id, serie.title + ' was added to Sonarr',{
        'selective': 2,
        'parse_mode': 'Markdown',
        'reply_markup': {
            'hide_keyboard': true,
            'remove_keyboard': true
        }
    });

    })

}

SonarrMessage.prototype.searchMissing = function () {

    var me = this;
    me.sonarr.post('command', {'name': 'missingEpisodesSearch'})
        .catch(function(error){
            return me._sendMessage(error);
        })
}

SonarrMessage.prototype._clearCache = function () {

    var me = this;
    var cacheItems = [
        'seriesId', 'seriesList', 'seriesProfileId',
        'seriesProfileList', 'seriesFolderId', 'seriesFolderList', 'seriesFolderId',
        'seriesFolderList', 'state'
    ];
    return _(cacheItems).forEach(function(item) {
        me.cache.del(item + me.user.id);
    });
}


function formatBytes(bytes,decimals) {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}






module.exports = SonarrMessage;