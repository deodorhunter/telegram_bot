
const _ = require('lodash');
const RadarrAPI = require('./RadarrAPI');
const state = require('./state');
const event = require('events');

function RadarrMessage(bot, user, chat, cache) {
    this.bot      = bot;
    this.user     = user;
    this.chat     = chat;
    this.cache    = cache;
    this.adminId  = 465815448;
    this.username = this.user.username || (this.user.first_name + (' ' + this.user.last_name || ''));

    this.radarr = new RadarrAPI({
        hostname : 'localhost',
        apiKey   : 'c19589f6cf3f488fb8d3f17adb423a0d',
        port     : 38083,
        urlBase  : '',
        ssl      : false,
        username : '',
        password : '',
    });
}

RadarrMessage.prototype._sendMessage = function(message, keyboard) {
    var me = this;
    keyboard = keyboard || null;
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





RadarrMessage.prototype.searchList = function(title){
    console.log('----------------> Inside radarr search');
    var me = this;
    me.radarr.get('movie/lookup', {'term': title}).then(function(result){
        console.log('---------------->Searching');
        console.log('----------------> Found '+ result);
        var movie = result;
        var movieList=[], keyboard=[];
        var response = ['I found the following Movies'];
        _.forEach(movie, function (n,key){
            // console.log(movie);
            var cover=null;
            _.forEach(n.images, function (image,index){
                if(image.coverType === 'poster')
                    cover=image.url

            });
            var id = key + 1;
            var keyboardValue = n.title + (n.year ? ' - ' + n.year : '');

            movieList.push({
                'id': id,
                'title': n.title,
                'plot': n.overview,
                'year': n.year,
                'tmdbId': n.tmdbId,
                'titleSlug': n.titleSlug,
                'keyboardValue': keyboardValue,
                'coverUrl': cover
            });

            keyboard.push([keyboardValue]);
            response.push('➸ ['+keyboardValue+'](https://www.themoviedb.org/movie/'+n.tmdbId+')');
        });

        response.push('Seleziona dal menu');

        //set cache
        me.cache.set('movieList' + me.user.id, movieList);
        me.cache.set('state' + me.user.id, state.radarr.CONFIRM);

        return me._sendMessage(response.join('\n'), keyboard);
    })
        .catch(function(error) {
            return me._sendMessage(error);
        });
};

RadarrMessage.prototype.confirmSelection=function(choice){
    var me =this;
    var movieList = me.cache.get('movieList' + me.user.id);

   var movie = _.filter(movieList, function(item){
       return item.keyboardValue === choice;
   })[0];
   console.log(movie);

   me.radarr.get('movie').then(function(result){
       var keyboard = [['Yes'], ['No']];
       var response = ['*' + movie.title + '('+movie.year + ')*\n'];
       response.push(movie.plot + '\n');

       me.cache.set('state'+ me.user.id, state.radarr.PROFILE);
       me.cache.set('movieId' + me.user.id, movie.id);

       return me._sendMessage(response.join('\n'), keyboard);
   }).catch(function(error){
       return me._sendMessage(error);
   })


}
RadarrMessage.prototype.getProfiles = function (name) {

    var me = this;
    // var movieId = me.cache.get('movieId'+me.user.id);

    me.radarr.get('profile').then(function (result){
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

        me.cache.set('state' + me.user.id, state.radarr.FOLDER);
        me.cache.set('movieProfileList' + me.user.id, profileList);

        return me._sendMessage(response.join('\n'), keyboard);
    })
        .catch(function(error) {
            return me._sendMessage(error);
        });
}

RadarrMessage.prototype.getFolders = function (name) {

    var me = this;
    var profileList = me.cache.get('movieProfileList'+me.user.id);

    var profile = _.filter(profileList, function(item){
        return item.name === name;
    })[0];
    // var disks= me.getDiskSpace();
    me.radarr.get('rootfolder').then(function (result) {
        var folderList = [], keyboard = [], disks = [];
        var folders=result
        console.log('About to get disk spaces');
        me.radarr.get('diskspace').then(function (diskSpaceResult) {
            var disk = diskSpaceResult;
            console.log(disk);
            _.forEach(disk, function (n, key) {
                disks.push({
                    'path': n.path,
                    'freeSpace': formatBytes(n.freeSpace),
                    'totalSpace': formatBytes(n.totalSpace)
                });
            });
            console.log('getting disks for ya' + JSON.stringify(disks));

            var response = ['*Found paths:*'];
            _.forEach(folders, function (n, key) {
                _.forEach(disks, function (d, key) {
                    if (n.path.indexOf(d.path) !== -1) {
                        var space = d.freeSpace + '/' + d.totalSpace;
                        folderList.push({'path': n.path, 'folderId': n.id});
                        response.push('➸ ' + n.path + '    (' + space + ')');
                        keyboard.push([n.path]);
                    }
                });
            });
            // console.log('out of folder for each');
            // console.log('disks'+JSON.stringify(disks));
            me.cache.set('movieProfileId' + me.user.id, profile.profileId);
            me.cache.set('movieFolderList' + me.user.id, folderList);
            me.cache.set('state' + me.user.id, state.radarr.ADD_MOVIE);
            return me._sendMessage(response.join('\n'), keyboard);
        });

    }).catch(function(error) {
            return me._sendMessage(error);
    });
}

RadarrMessage.prototype.addMovie =function (folder) {

    var me=this;
    var folderList = me.cache.get('movieFolderList'+me.user.id);
    var movieList = me.cache.get('movieList'+ me.user.id);
    var movieId = me.cache.get('movieId' + me.user.id);
    var qualityProfileId = me.cache.get('movieProfileId' + me.user.id);

    var rootFolderPath = _.filter(folderList, function(item){
        return item.path === folder;
    })[0];
    var movie = _.filter(movieList, function(item){
        return item.id === movieId;
    })[0];

    var postOptions={
        'title': movie.title,
        'qualityProfileId': qualityProfileId,
        'titleSlug' : movie.titleSlug,
        'tmdbId': movie.tmdbId,
        'images': [],
        'year': movie.year,
        'rootFolderPath': rootFolderPath.path,
        'monitored': true
    }

    me.radarr.post('movie',postOptions).then(function(result){
        var cacheItems = [
            'movieId', 'movieList', 'movieProfileId',
            'movieProfileList', 'movieFolderId', 'movieFolderList', 'movieFolderId',
            'movieFolderList', 'state'
        ];
        me.searchMissing();
        return _(cacheItems).forEach(function(item) {
            me.cache.del(item + me.user.id);
        });
    }).catch(function(error){
        return me._sendMessage(error);
    }).finally(function(){
        return me.bot.sendMessage(me.chat.id, movie.title + ' was added to Radarr',{
        'selective': 2,
        'parse_mode': 'Markdown',
        'reply_markup': {
            'hide_keyboard': true,
            'remove_keyboard': true
        }
    });

    })

}

RadarrMessage.prototype.searchMissing = function () {

    var me = this;
    me.radarr.post('command', {'name': 'missingMoviesSearch'})
        .catch(function(error){
            return me._sendMessage(error);
    })
}


function formatBytes(bytes,decimals) {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}






module.exports = RadarrMessage;