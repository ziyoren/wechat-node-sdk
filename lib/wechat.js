var events = require('events');
var util=require('util');
var crypto = require('crypto');
var XmlParse = require('xml2js').parseString;
var wxCrypto = require('wechat-crypto');
var URL = require('url');
var QS = require('querystring');
var path = require('path');
var fs = require('fs');
var https = require("https");

const config = require('./config').config;


//构造函数
var wechat = function (option) {
    if ( !isObject(option) ) {
        throw new Error('请提供正确的微信公众号配置信息。');
    }else{
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
    //this._const = config;
    var _root = __dirname.split('node_modules/')[0],
        _runtime = path.join(_root, '_runtime');
    this.path = {
        'root' : _root,
        'runtime' :_runtime,
        'logs' : path.join(_runtime, 'logs'),
        'cache' : path.join(_runtime, 'cache'),
        'data' : path.join(_runtime, 'data')
    };
    buildWorkDir([_runtime, this.path.logs, this.path.cache, this.path.data]);
};

util.inherits(wechat, events.EventEmitter); //事件继承

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
    return this.valid( req, res );
};

//执行主函数
wechat.prototype.valid = function(req, res){
    var me=this;
    if (isEmpty(req.query)){ //兼容原生http服务
        var _parsedUrl = URL.parse(req.url);
        var query = QS.parse( _parsedUrl.query );
        req._parsedUrl = _parsedUrl;
        req.query = query;
    }
    me.req = req;
    me.res = res;

    if (req.method == 'POST'){
        me.encrypt_type = req.query.encrypt_type ? req.query.encrypt_type : '';
        var signature = req.query.signature,
            msg_signature = req.query.msg_signature,
            timestamp = req.query.timestamp,
            nonce     = req.query.nonce,
            cryptor   = me.cryptor;
        loadPost(req, function (err, buf) {
            if (err) {
                me.emit('error', err);
            } else {
                var xml = buf.toString('utf-8');
                console.log('req.query数据是：', req.query);
                console.log('接收到的是：', xml);
                if (me.encrypt_type == 'aes') {
                    //aes解密处理
                    XmlParse(xml, function (err, json) {
                        var msg = json.xml;
                        var enstr = msg.Encrypt[0];
                        //验证签名
                        if (msg_signature != cryptor.getSignature(timestamp, nonce, enstr) ){
                            console.log('Invalid signature');
                            res.writeHead(401);
                            res.end('Invalid signature');
                            return;
                        }
                        var _xml = cryptor.decrypt(enstr);
                        me.postXML = _xml.message;
                        me.getRev();
                    });
                }else{
                    me.postXML = xml;
                    me.getRev();
                }
                console.log('收到的XML：', me.postXML);
            }
        });
    }else if ( req.query['echostr'] ){
        var echostr = req.query['echostr'];
        if (me.checkSignature(req.query)) {
            me.emit('ready', me, req, res);
            res.end( echostr );
        }else{
            console.log('no access');
            me.emit('ready', me, req, res);
            res.writeHead(401);
            res.end('no access');
        }
    }
    return me;
};

//处理微信服务器发来的数据
wechat.prototype.getRev = function(){
    var me = this;
    //if (me._receive) return me;
    var postXml = me.postXML;
    if (postXml){
        XmlParse(postXml, function (err, json) {
            var temp = json.xml;
            var rst = {};
            for (var key in temp){
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
wechat.prototype.getRevFrom = function(){
    return this._receive['FromUserName'] ? this._receive['FromUserName'] : false;
};

//获取消息发送者
wechat.prototype.getRevTo = function(){
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

//获取消息发送时间
wechat.prototype.getRevCreateTime = function () {
    return this._receive['CreateTime'] ? this._receive['CreateTime'] : false;
};

//获取消息中的图片
wechat.prototype.getRevPic = function () {
    return this._receive['PicUrl'] ? {
        mediaid:this._receive['MediaId'],
        picurl:this._receive['PicUrl']
    } : false;
};

//获取消息中的链接
wechat.prototype.getRevLink = function () {
    return this._receive['Url'] ? {
        url:this._receive['Url'],
        title:this._receive['Title'],
        description:this._receive['Description']
    } : false;
};

//获取地理位置
wechat.prototype.getRevGeo = function () {
    return this._receive['Location_X'] ? {
        x: this._receive['Location_X'],
        y: this._receive['Location_Y'],
        scale: this._receive['Scale'],
        label: this._receive['Label']
    } : false;
};

//获取地理位置
wechat.prototype.getRevEvent = function () {
    var ev = {};
    if ( this._receive['Event'] ){
        ev['event'] = this._receive['Event'];
    }
    if ( this._receive['EventKey'] ){
        ev['key'] = this._receive['EventKey'];
    }
    if ( Object.keys(ev).length > 0 ){
        return ev;
    }else{
        return false;
    }
};


//获取自定义菜单的扫码推事件信息
wechat.prototype.getRevScanInfo = function () {
    //if (this._receive['ScanCodeInfo']){}
};

//设置待回复的消息体
wechat.prototype.Message = function (json) {
    if (!isObject(json)){
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
            'Title' : title,
            'Description' : description
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
            'Title' : title,
            'Description' : description,
            'MusicUrl' : musicurl,
            'HQMusicUrl' : hgmusicurl
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
wechat.prototype.news = function(newsData) {
    if (!isArray(newsData)){
        console.log('图文数据格式不正确');
        return;
    }
    var $msg = {
        'ToUserName' : this.getRevFrom(),
        'FromUserName':this.getRevTo(),
        'MsgType':config.MSGTYPE_NEWS,
        'CreateTime':time(),
        'ArticleCount':newsData.length,
        'Articles':newsData
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
    if ( isObject(msg) ){
        this._msg = msg;
    }
    if ( !isObject(this._msg) || isEmpty(this._msg) ) {
        console.log('没有设置回复内容');
        return false;
    }
    var xmlData = xml_encode(this._msg);
    if (this.encrypt_type == 'aes'){
        //加密处理
        var enXml = this.cryptor.encrypt(xmlData),
            timestamp = this.req.query.timestamp,
            nonce = this.req.query.nonce;
        var enJson = {
            ToUserName : this.getRevFrom(),
            Encrypt : enXml,
            MsgSignature : this.cryptor.getSignature(timestamp, nonce, enXml),
            TimeStamp : timestamp,
            Nonce : nonce
        };
        this.Message(enJson);
        xmlData = xml_encode(this._msg);
    }
    this._msg = {};
    this._receive = {};
    console.log('回复的报文：', xmlData);
    this.res.end(xmlData);
};


//更新access_token
wechat.prototype.updateAccessToken = function(){
    var me = this,
        appid = this.appid,
        secret = this.appsecret,
        api_url = `${config.API_URL_PREFIX}${config.AUTH_URL}appid=${appid}&secret=${secret}`;
    https.get(api_url, function (res) {
        var data = '';
        res.on('data', function (d) {
            data += d;
        });
        res.on('end', function (d) {
            me.cacheAccessToken(data);
        });
    })
};


//获取access_token
wechat.prototype.getAccessToken = function(){
    return this.F('access_token-' + this.appid);
};


//缓存access_token
wechat.prototype.cacheAccessToken = function (data) {
    this._cache('access_token-' + this.appid, data);
    console.log('access_token cached.')
};


wechat.prototype.F = function (filename, data, filepath) {
    if (isEmpty(filename)){
        console.log('文件名不能为空。');
        return false;
    }
    filepath = filepath ? filepath : this.path.data;
    var fn = path.join(filepath, filename);
    if (!isEmpty(data)) {
        _write_file(fn, data);
    }else {
        var rst = _read_file(fn);
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
    return xml_encode( isObject(jsonData) ? jsonData : this._msg );
};

//测试方法
wechat.prototype.testCode = function(json){
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
var loadPost = function (stream, callback) {
    if (stream.rawBody) {
        callback(null, stream.rawBody);
        return;
    }

    var buffers = [];
    stream.on('data', function (trunk) {
        buffers.push(trunk);
    });
    stream.on('end', function () {
        callback(null, Buffer.concat(buffers));
    });
    stream.once('error', callback);
};


/**
 * JSON对象用键名排序
 * @param json
 * @returns {*}
 */
var ksort = function(json){
    if ( 'object' != typeof json ) return json;

    var tmp = {}, keys = Object.keys(json).sort();
    for (var i=0; i<keys.length; i++){
        tmp[keys[i]] = json[keys[i]];
    }
    return tmp;
};


var auto_text_filter = function(text) {
    return ('string' == typeof text) ? text.replace("\r\n", "\n") : text;
};


/**
 * 获取10位时间戳
 * @returns {number|Number}
 */
var time = function () {
    return parseInt( (new Date()).getTime() / 1000 );
}

/**
 * 生成安全的XML内容
 * @param str
 * @returns {*}
 */
var xmlSafeStr = function (str) {
    if (!isNaN(str)) return str; //Number & bool
    if ('string' != typeof str) return '';
    return '<![CDATA['+ str.replace("/[\\x00-\\x08\\x0b-\\x0c\\x0e-\\x1f]/",'') + ']]>';
};


/**
 * JSON转XML方法
 * @param json
 * @returns {string}
 */
var json_to_xml = function(json){
    var $xml = '';
    for (var k in json){
        var kn;
        if (!isNaN(k)) kn = 'item id="'+ k +'"';
        var $val = json[k];
        $xml += '<' + (kn ? kn : k) + '>';
        $xml += (isArray($val) || isObject($val)) ? json_to_xml($val) : xmlSafeStr($val);
        $xml += '</' + k + '>';
    }
    return $xml;
};


/**
 * 简单的生成XML方法
 * @param $json
 * @returns {string}
 */
var xml_encode = function ($json) {
    var $xml = '<xml>';
    $xml += json_to_xml($json);
    $xml +='</xml>';
    return $xml;
};


/**
 * 判断是否为数组
 * @param arr
 * @returns {boolean}
 */
var isArray = function(arr){
    return (arr instanceof Array);
};


/**
 * 判断是否为对象
 * @param obj
 * @returns {boolean}
 */
var isObject = function (obj) {
    return (obj instanceof Object);
};


/**
 * 判断是否为字符串
 * @param str
 * @returns {boolean}
 */
var isString = function(str){
    return ( 'string' == typeof str );
};


/**
 * 判断是否为空
 * @param v
 * @returns {*}
 */
var isEmpty = function (v) {
    var type = typeof v, empty;
    switch (type) {
        case 'number':
        case 'boolean':
            empty = false;
            break;
        case 'string':
            empty = ( v.length == 0 );
            break;
        case 'object':
            if (null === v) {
                empty = true;
            }else if (isArray(v)){
                empty = v.length == 0;
            }else{
                empty = Object.keys(v).length == 0;
            }
            break;
        case 'function':
            empty = false;
            break;
        default:
            empty = true;
    }
    return empty;
};


/**
 * 创建指定的工作目录
 * @param paths
 * @returns {{}}
 */
var buildWorkDir = function (paths) {
    if (isString(paths)) paths = [paths];
    if (!isArray(paths)){
        console.log('输入的参数格式不正确');
        return;
    }
    var result = {};
    paths.forEach(function (item) {
        if ( !fs.existsSync(item) ){
            fs.mkdirSync(item, 660);
            result[item] = fs.existsSync(item);
        }else{
            result[item] = true;
        }
    });
    console.log(result);
    return result;
};


/**
 * 写文件的基本方法
 * @param name
 * @param data
 * @private
 */
var _write_file = function (name, data) {
    var content = { content : data };
    fs.open(name, 'wx', function(err, fd){
        fs.writeSync(fd, JSON.stringify(content), function(err, written, buffer){
            if (err){
                console.log('写入文件出错：', err);
            }else{
                console.log('订单保存成功！');
            }
            fs.close(fd);
        });
    });
};


var _read_file = function (filename) {
    if (!fs.existsSync(filename)) return '';
    var buf = fs.readFileSync(filename);
    return buf.toString('utf-8');
}


module.exports = wechat;
