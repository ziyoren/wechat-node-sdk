var events = require('events');
var util = require('util');
var crypto = require('crypto');
var XmlParse = require('xml2js').parseString;
var wxCrypto = require('wechat-crypto');
var URL = require('url');
var QS = require('querystring');
var path = require('path');
var fs = require('fs');
var https = require('https');
var zfun = require('ziyo-functions');

const config = require('./config');


//构造函数
var wechat = function (option) {
    if (!isObject(option)) {
        throw new Error('请提供正确的微信公众号配置信息。');
    } else {
        if (isEmpty(option.appid)) throw new Error('appid不能为空');
        if (isEmpty(option.appsecret)) throw new Error('appsecret不能为空');
        if (isEmpty(option.token)) throw new Error('token不能为空');
        if (isEmpty(option.encodingAesKey)) throw new Error('encodingAesKey不能为空');

        this.appid = option.appid;
        this.appsecret = option.appsecret;
        this.token = option.token;
        this.encodingAesKey = option.encodingAesKey;
    }
    this.emitter = new events.EventEmitter(this);
    this.cryptor = new wxCrypto(this.token, this.encodingAesKey, this.appid);
    this.access_token = '';
    this.access_token_previous = '';
    this.version = '0.2.2';

    var me = this;
    var _root = __dirname.split('node_modules/')[0],
        _runtime = path.join(_root, '_runtime');
    this.path = {
        'root': _root,
        'runtime': _runtime,
        'logs': path.join(_runtime, 'logs'),
        'cache': path.join(_runtime, 'cache'),
        'data': path.join(_runtime, 'data')
    };
    buildWorkDir([_runtime, this.path.logs, this.path.cache, this.path.data]);
    setConst(this, config);

    //自动更新 access_token 方法（需要手动调用）
    this.accessTokenTask = function (second) {
        console.log('accessTokenTask runing...', time());
        second = isNaN(second) ? 3600 : second; //默认1小时更新一次access_token
        me.updateAccessToken();
        setInterval(function () {
            me.updateAccessToken();
        }, 1000 * second);
    };

};

util.inherits(wechat, events.EventEmitter); //事件继承

var setConst = function (me, jsonData) {
    if (!isObject(jsonData) || !isObject(me)) return;
    for (var key in jsonData) {
        me[key] = jsonData[key];
    }
};

//微信签名验证
wechat.prototype.checkSignature = function (query) {
    var signature = query.signature;
    var timestamp = query.timestamp;
    var nonce = query.nonce;

    var shasum = crypto.createHash('sha1');
    var arr = [this.token, timestamp, nonce].sort();
    shasum.update(arr.join(''));

    return shasum.digest('hex') === signature;
};

//执行主函数
wechat.prototype.run = function (req, res) {
    return this.valid(req, res);
};

//执行主函数
wechat.prototype.valid = function (req, res) {
    var me = this;
    if (isEmpty(req.query)) { //兼容原生http服务
        var _parsedUrl = URL.parse(req.url);
        var query = QS.parse(_parsedUrl.query);
        req._parsedUrl = _parsedUrl;
        req.query = query;
    }
    me.req = req;
    me.res = res;

    if (req.method == 'POST') {
        me.encrypt_type = req.query.encrypt_type ? req.query.encrypt_type : '';
        var signature = req.query.signature,
            msg_signature = req.query.msg_signature,
            timestamp = req.query.timestamp,
            nonce = req.query.nonce,
            cryptor = me.cryptor;
        loadPost(req, function (err, buf) {
            if (err) {
                me.emit('error', err);
            } else {
                var xml = buf.toString('utf-8');
                //console.log('req.query数据是：', req.query);
                //console.log('接收到的是：', xml);
                if (me.encrypt_type == 'aes') {
                    //aes解密处理
                    XmlParse(xml, function (err, json) {
                        var msg = json.xml;
                        var enstr = msg.Encrypt[0];
                        //验证签名
                        if (msg_signature != cryptor.getSignature(timestamp, nonce, enstr)) {
                            console.log('Invalid signature');
                            res.writeHead(401);
                            res.end('Invalid signature');
                            return;
                        }
                        var _xml = cryptor.decrypt(enstr);
                        me.postXML = _xml.message;
                        me.getRev();
                    });
                } else {
                    me.postXML = xml;
                    me.getRev();
                }
                console.log('收到的XML：', me.postXML);
            }
        });
    } else if (req.query['echostr']) {
        var echostr = req.query['echostr'];
        if (me.checkSignature(req.query)) {
            me.emit('open', true, me, req, res);
            res.end(echostr);
        } else {
            console.log('no access');
            me.emit('open', false, me, req, res);
            res.writeHead(401);
            res.end('no access');
        }
    }
    return me;
};

//处理微信服务器发来的数据
wechat.prototype.getRev = function () {
    var me = this;
    //if (me._receive) return me;
    var postXml = me.postXML;
    if (postXml) {
        XmlParse(postXml, function (err, json) {
            var temp = json.xml;
            var rst = {};
            for (var key in temp) {
                rst[key] = temp[key][0];
            }
            me._receive = rst;
            //注册事件
            me.emit('ready', me, me.req, me.res);
        });
    }
    return me;
};

//获取消息数据
wechat.prototype.getRevData = function () {
    return this._receive ? this._receive : false;
};

//获取消息发送者
wechat.prototype.getRevFrom = function () {
    return this._receive['FromUserName'] ? this._receive['FromUserName'] : false;
};

//获取消息发送者
wechat.prototype.getRevTo = function () {
    return this._receive['ToUserName'] ? this._receive['ToUserName'] : false;
};

//获取消息类型
wechat.prototype.getRevType = function () {
    return this._receive['MsgType'] ? this._receive['MsgType'] : false;
};

//获取消息ID
wechat.prototype.getMsgId = function () {
    return this._receive['MsgId'] ? this._receive['MsgId'] : false;
};

//获取媒体ID
wechat.prototype.getMediaID = function () {
    return this._receive['MediaId'] ? this._receive['MediaId'] : false;
};

//获取消息发送时间
wechat.prototype.getRevCreateTime = function () {
    return this._receive['CreateTime'] ? this._receive['CreateTime'] : false;
};

//获取语音转换的文本
wechat.prototype.getRecognition = function () {
    return this._receive['Recognition'] ? this._receive['Recognition'] : false;
};

//获取消息中的图片
wechat.prototype.getRevPic = function () {
    return ( this.MSGTYPE_IMAGE == this.getRevType() ) ? {
        mediaid: this._receive['MediaId'],
        picurl: this._receive['PicUrl']
    } : false;
};

//获取消息中的链接
wechat.prototype.getRevLink = function () {
    return ( this.MSGTYPE_LINK == this.getRevType() ) ? {
        url: this._receive['Url'],
        title: this._receive['Title'],
        description: this._receive['Description']
    } : false;
};

//获取地理位置
wechat.prototype.getRevGeo = function () {
    return ( this.MSGTYPE_LOCATION == this.getRevType() ) ? {
        x: this._receive['Location_X'],
        y: this._receive['Location_Y'],
        scale: this._receive['Scale'],
        label: this._receive['Label']
    } : false;
};

//获取事件信息
wechat.prototype.getRevEvent = function () {
    var ev = {};
    if (this._receive['Event']) {
        ev['event'] = this._receive['Event'];
    }
    if (this._receive['EventKey']) {
        ev['key'] = this._receive['EventKey'];
    }
    if (Object.keys(ev).length > 0) {
        return ev;
    } else {
        return false;
    }
};

//获取自定义菜单的扫码推事件信息
wechat.prototype.getRevScanInfo = function () {
    //if (this._receive['ScanCodeInfo']){}
};

//获取视频/小视频信息
wechat.prototype.getRevVideo = function () {
    var type = this.getRevType(),
        isVideo = (type == this.MSGTYPE_VIDEO || type == this.MSGTYPE_SHORTVIDEO);
    return isVideo ? {
        MediaId: this.getMediaID(),
        ThumbMediaId: this._receive['ThumbMediaId'] ? this._receive['ThumbMediaId'] : ''
    } : false;
};

//设置待回复的消息体
wechat.prototype.Message = function (json) {
    if (!isObject(json)) {
        console.log('设置发送信息失败，数据格式不正确');
        return false;
    }
    this._msg = json;
    return this;
};

//设置回复消息：文本
wechat.prototype.text = function (text) {
    var $msg = {
        'ToUserName': this.getRevFrom(),
        'FromUserName': this.getRevTo(),
        'MsgType': config.MSGTYPE_TEXT,
        'Content': auto_text_filter(text),
        'CreateTime': time()
    };
    this.Message($msg);
    return this;
};

//设置回复消息：图片
wechat.prototype.image = function (mediaid) {
    var $msg = {
        'ToUserName': this.getRevFrom(),
        'FromUserName': this.getRevTo(),
        'MsgType': config.MSGTYPE_IMAGE,
        'Image': {'MediaId': mediaid},
        'CreateTime': time()
    };
    this.Message($msg);
    return this;
};


//设置回复消息：语音
wechat.prototype.voice = function (mediaid) {
    var $msg = {
        'ToUserName': this.getRevFrom(),
        'FromUserName': this.getRevTo(),
        'MsgType': config.MSGTYPE_VOICE,
        'Voice': {'MediaId': mediaid},
        'CreateTime': time()
    };
    this.Message($msg);
    return this;
};

/**
 * 设置回复消息：视频
 * @param mediaid
 * @param title
 * @param description
 * @returns {wechat}
 */
wechat.prototype.video = function (mediaid, title, description) {
    var $msg = {
        'ToUserName': this.getRevFrom(),
        'FromUserName': this.getRevTo(),
        'MsgType': config.MSGTYPE_VIDEO,
        'Video': {
            'MediaId': mediaid,
            'Title': title,
            'Description': description
        },
        'CreateTime': time()
    };
    this.Message($msg);
    return this;
};

/**
 * 设置回复消息：音乐
 * @param title 标题
 * @param description 描述
 * @param musicurl 音乐网址
 * @param hgmusicurl
 * @param thumbmediaid 音乐图片缩略图的媒体id，非必须
 * @returns {wechat}
 */
wechat.prototype.music = function (title, description, musicurl, hgmusicurl, thumbmediaid) {
    var $msg = {
        'ToUserName': this.getRevFrom(),
        'FromUserName': this.getRevTo(),
        'MsgType': config.MSGTYPE_VIDEO,
        'Music': {
            'Title': title,
            'Description': description,
            'MusicUrl': musicurl,
            'HQMusicUrl': hgmusicurl
        },
        'CreateTime': time()
    };
    if (thumbmediaid) $msg.Music.ThumbMediaId = thumbmediaid;

    this.Message($msg);
    return this;
};

/**
 * 设置回复消息：图文
 * @param newsData
 * 数据结构：
 * [
 *     {
 *          'Title':'msg title 1',
 *  		'Description':'summary text 1',
 *  		'PicUrl':'http://www.domain.com/1.jpg',
 *  		'Url':'http://www.domain.com/1.html'
 *     }, {
 *          //...
 *     }
 * ]
 * @returns {wechat}
 */
wechat.prototype.news = function (newsData) {
    if (!isArray(newsData)) {
        console.log('图文数据格式不正确');
        return;
    }
    var $msg = {
        'ToUserName': this.getRevFrom(),
        'FromUserName': this.getRevTo(),
        'MsgType': config.MSGTYPE_NEWS,
        'CreateTime': time(),
        'ArticleCount': newsData.length,
        'Articles': newsData
    };
    this.Message($msg);
    return this;
};


/**
 * 执行回复方法
 * @param msg
 * @returns {boolean}
 */
wechat.prototype.reply = function (msg) {
    if (isObject(msg)) {
        this._msg = msg;
    }
    if (!isObject(this._msg) || isEmpty(this._msg)) {
        console.log('没有设置回复内容');
        return false;
    }
    var xmlData = xml_encode(this._msg);
    if (this.encrypt_type == 'aes') {
        //加密处理
        var enXml = this.cryptor.encrypt(xmlData),
            timestamp = this.req.query.timestamp,
            nonce = this.req.query.nonce;
        var enJson = {
            ToUserName: this.getRevFrom(),
            Encrypt: enXml,
            MsgSignature: this.cryptor.getSignature(timestamp, nonce, enXml),
            TimeStamp: timestamp,
            Nonce: nonce
        };
        this.Message(enJson);
        xmlData = xml_encode(this._msg);
    }
    //this._msg = {};
    //this._receive = {};
    console.log('回复的报文：', xmlData);
    this.res.end(xmlData);
};

////////////////////////////////////////////////////////////////////////////////////




/////////////////////////////////
/*         主动回复             */
/////////////////////////////////


//更新access_token
wechat.prototype.updateAccessToken = function () {
    var me = this,
        appid = me.appid,
        secret = me.appsecret,
        api_url = `${config.API_URL_PREFIX}${config.AUTH_URL}appid=${appid}&secret=${secret}`;
    var current_access_token = me.access_token;

    function callback(err, data) {
        if (current_access_token != '') {
            me.access_token_previous = current_access_token;
        }
        me.access_token = JSON.parse(data);
        me.access_token.updateTime = time();
        me.cacheAccessToken(me.access_token);
        console.log('updateAccessToken ok.', time(), me.access_token);
    }

    me.httpsGet(api_url, callback);

};


//缓存access_token
wechat.prototype.cacheAccessToken = function (data) {
    this._cache('access_token-' + this.appid, data);
    console.log('access_token cached.')
};


//获取access_token
wechat.prototype.getAccessToken = function (all) {
    all = all || false;
    if (this.access_token == '') {
        this.access_token == this.F('access_token-' + this.appid);
    }
    return all ? this.access_token : this.access_token.access_token;
};


function getApiUrl(api, wechat) {
    var me = wechat, access_token = me.getAccessToken(),
    url = `${me.API_URL_PREFIX}${api}access_token=${access_token}`;
    return url;
}

//获取所有客服列表
wechat.prototype.getCustomServiceList = function (callback) {
    var me = this, access_token = me.getAccessToken(),
        api_url = getApiUrl(me.CUSTOM_SERVICE_GET_KFLIST, me);
    me.httpsGet(api_url, callback);
};


wechat.prototype.KfText = function(message, toUser){
    this.kf_msg = {
        touser : toUser,
        msgtype : 'text',
        text : {
            content: auto_text_filter(message)
        }
    }
    return this;
};


wechat.prototype.KfImage = function(mediaId, toUser){
    this.kf_msg = {
        "touser":toUser,
        "msgtype":"image",
        "image": {
            "media_id":mediaId
        }
    }
    return this;
};


wechat.prototype.KfVoice = function (mediaId, toUser) {
    this.kf_msg = {
        "touser":toUser,
        "msgtype":"voice",
        "voice": {
            "media_id":mediaId
        }
    }
    return this;
};


/**
 * 发送视频消息设置
 * @param mediaId 这个视频ID必须调用上传API生成
 * @param title
 * @param description
 * @param toUser
 * @param thumb_id
 * @returns {wechat}
 * @constructor
 */
wechat.prototype.KfVideo = function (mediaId, thumb_id, title, description, toUser) {
    this.kf_msg = {
        "touser":toUser,
        "msgtype":"video",
        "video": {
            "media_id":mediaId,
            "thumb_media_id":thumb_id,
            "title":title,
            "description":description
        }
    }
    return this;
};



/**
 * 设置客服接口发送的图文消息 (外链接）
 * @param Array newsList 格式如下：
     [
         {
             "title":"Happy Day",
             "description":"Is Really A Happy Day",
             "url":"URL",
             "picurl":"PIC_URL"
         }
     ]
 * @param toUser 即OpenID
 * @returns {wechat}
 * @constructor
 */
wechat.prototype.KfNews = function (newsList, toUser) {
    this.kf_msg = {
        "touser":toUser,
        "msgtype":"news",
        "news":{
            "articles": newsList
        }
    };
    return this;
};


/**
 * 设置客服接口发送的图文消息 (跳转到微信图文消息页面）
 * @param newsList 格式如下：
   [{
         "media_id":"MEDIA_ID"
    }]
 * @param toUser
 * @returns {wechat}
 * @constructor
 */
wechat.prototype.KfMpNews = function (newsList, toUser) {
    this.kf_msg = {
        "touser":toUser,
        "msgtype":"mpnews",
        "mpnews":newsList //todo 待测试
    };
    return this;
};


/**
 * 发送卡券
 * @param cardid
 * @param toUser
 * @returns {wechat}
 */
wechat.prototype.kfWxcard = function (cardid, toUser) {
    this.kf_msg = {
        "touser": toUser,
        "msgtype":"wxcard",
        "wxcard":{
            "card_id":cardid
        }
    };
    return this;
}


/**
 * 音乐消息设置
 * @param musicurl
 * @param title
 * @param description
 * @param toUser
 * @param hqmusicurl
 * @param thumb_media_id
 * @returns {wechat}
 * @constructor
 */
wechat.prototype.KfMusic = function (musicurl, title, description, toUser, hqmusicurl, thumb_media_id) {
    var music = {
        "title": title,
        "description": description,
        "musicurl": musicurl
    };
    if (hqmusicurl){
        music.hqmusicurl = hqmusicurl;
    }
    if (thumb_media_id){
        music.thumb_media_id = thumb_media_id
    }
    this.kf_msg = {
        "touser":toUser,
        "msgtype":"music",
        "music":music
    };
    return this;
}


/**
 * 主动发送消息方法
 * @param message
 * @param callback(err, data, wechat)
 * @returns {boolean}
 */
wechat.prototype.sendMessage = function(callback, message ){
    var msg = message || this.kf_msg;
    if (!isObject(msg)){
        console.log('没有设置发送的消息内容');
        return false;
    }
    var me = this, access_token = me.getAccessToken(),
        api_url = getApiUrl(me.CUSTOM_SEND_URL, me),
        data = JSON.stringify(msg);
    me.httpsPost(api_url, data, callback);
};


wechat.prototype.httpsGet = function (api_url, callback) {
    var me = this;
    https.get(api_url, function (res) {
        var data = '';
        res.on('data', function (d) {
            data += d;
        });
        res.on('end', function (d) {
            callback(null, data, me);
        });
    }).on('error', function (e) {
        callback(e, null, me);
    })
}


wechat.prototype.httpsPost = function (url, data, callback, options) {
    var me = this, _url = URL.parse(url), opt = options || {};
    opt.hostname = _url.hostname;
    opt.port = _url.port;
    opt.path = _url.path;
    opt.method = opt.method || 'POST';
    opt.headers = { 'User-Agent' : 'ziyo.ren/wechat-node-sdk v' + this.version };

    var postData = isObject(data) ? QS.stringify(data) : data;
    if (!isEmpty(postData)){
        opt.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        opt.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    var req = https.request(opt, function (res) {
        var d = [];
        res.on('data', (chunk) => {
            d.push(chunk);
        });
        res.on('end', ()=>{
            var dd = Buffer.concat(d).toString('utf-8');
            try{
                dd = JSON.parse(dd);
                if (dd.errcode != '0'){
                    me.errcode = dd.errcode;
                    me.errmsg = dd.errmsg;
                }else{
                    me.errcode = 0;
                    me.errmsg = 'ok';
                }
                callback(null, dd, me);
            }catch (e){
                me.errcode = -1;
                me.errmsg = e.message;
                callback(e, dd, me);
            }
        })
    });

    req.on('error', function (e) {
        me.errcode = -2;
        me.errmsg = e.message;
        callback(e, null, me);
    });

    if (!isEmpty(postData)){
        req.write(postData);
    }
    req.end();
};


wechat.prototype.F = function (filename, data, filepath) {
    if (isEmpty(filename)) {
        console.log('文件名不能为空。');
        return false;
    }
    filepath = filepath ? filepath : this.path.data;
    var fn = path.join(filepath, filename);
    if (!isEmpty(data)) {
        _write_file(fn, data);
    } else {
        var rst = _read_file(fn);
        rst = JSON.parse(rst);
        return rst.content;
    }
};

wechat.prototype._log = function (filename, message) {
    this.F(filename, message, this.path.logs);
};

wechat.prototype._cache = function (filename, data) {
    this.F(filename, data, this.path.cache)
};

wechat.prototype.getXML = function (jsonData) {
    return xml_encode(isObject(jsonData) ? jsonData : this._msg);
};

//测试方法
wechat.prototype.testCode = function (json) {
    var xml = xml_encode(json);
    //console.log(xml);
    return xml;
};


/*******************************************************************************/
/*                   Tool Functions      Sunline@ZiyoRen                       */
/*******************************************************************************/

/**
 * 获取POST请求的数据
 * @param stream
 * @param callback
 */
var loadPost = zfun.loadPost;


/**
 * JSON对象用键名排序
 * @param json
 * @returns {*}
 */
var ksort = zfun.ksort;


var auto_text_filter = zfun.autoTextFilter;


/**
 * 获取10位时间戳
 * @returns {number|Number}
 */
var time = zfun.time;


/**
 * 简单的生成XML方法
 * @param $json
 * @returns {string}
 */
var xml_encode = zfun.encodeXML;


/**
 * 判断是否为数组
 * @param arr
 * @returns {boolean}
 */
var isArray = zfun.isArray;


/**
 * 判断是否为对象
 * @param obj
 * @returns {boolean}
 */
var isObject = zfun.isObject;


/**
 * 判断是否为字符串
 * @param str
 * @returns {boolean}
 */
var isString = zfun.isString;


/**
 * 判断是否为空
 * @param v
 * @returns {*}
 */
var isEmpty = zfun.isEmpty;


/**
 * 创建指定的工作目录
 * @param paths
 * @returns {{}}
 */
var buildWorkDir = zfun.buildDir;


/**
 * 写文件的基本方法
 * @param name
 * @param data
 * @private
 */
var _write_file = zfun.writeFileSync;


var _read_file = zfun.readFileSync;


var json_merge = zfun.jsonMerge;



module.exports = wechat;
