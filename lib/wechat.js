var events = require('events');
var util=require('util');
var crypto = require('crypto');
var XmlParse = require('xml2js').parseString;
var wxCrypto = require('wechat-crypto');
var URL = require('url');
var QS = require('querystring');

const config = {

//消息类型
    MSGTYPE_TEXT: 'text',
    MSGTYPE_IMAGE: 'image',
    MSGTYPE_LOCATION: 'location',
    MSGTYPE_LINK: 'link',
    MSGTYPE_EVENT: 'event',
    MSGTYPE_MUSIC: 'music',
    MSGTYPE_NEWS: 'news',
    MSGTYPE_VOICE: 'voice',
    MSGTYPE_VIDEO: 'video',
    MSGTYPE_SHORTVIDEO: 'shortvideo',

//各类事件定义
    EVENT_SUBSCRIBE: 'subscribe',       //订阅
    EVENT_UNSUBSCRIBE: 'unsubscribe',   //取消订阅
    EVENT_SCAN: 'SCAN',                 //扫描带参数二维码
    EVENT_LOCATION: 'LOCATION',         //上报地理位置
    EVENT_MENU_VIEW: 'VIEW',                     //菜单 - 点击菜单跳转链接
    EVENT_MENU_CLICK: 'CLICK',                   //菜单 - 点击菜单拉取消息
    EVENT_MENU_SCAN_PUSH: 'scancode_push',       //菜单 - 扫码推事件(客户端跳URL)
    EVENT_MENU_SCAN_WAITMSG: 'scancode_waitmsg', //菜单 - 扫码推事件(客户端不跳URL)
    EVENT_MENU_PIC_SYS: 'pic_sysphoto',          //菜单 - 弹出系统拍照发图
    EVENT_MENU_PIC_PHOTO: 'pic_photo_or_album',  //菜单 - 弹出拍照或者相册发图
    EVENT_MENU_PIC_WEIXIN: 'pic_weixin',         //菜单 - 弹出微信相册发图器
    EVENT_MENU_LOCATION: 'location_select',      //菜单 - 弹出地理位置选择器
    EVENT_SEND_MASS: 'MASSSENDJOBFINISH',        //发送结果 - 高级群发完成
    EVENT_SEND_TEMPLATE: 'TEMPLATESENDJOBFINISH',//发送结果 - 模板消息发送结果
    EVENT_KF_SEESION_CREATE: 'kfcreatesession',  //多客服 - 接入会话
    EVENT_KF_SEESION_CLOSE: 'kfclosesession',    //多客服 - 关闭会话
    EVENT_KF_SEESION_SWITCH: 'kfswitchsession',  //多客服 - 转接会话
    EVENT_CARD_PASS: 'card_pass_check',          //卡券 - 审核通过
    EVENT_CARD_NOTPASS: 'card_not_pass_check',   //卡券 - 审核未通过
    EVENT_CARD_USER_GET: 'user_get_card',        //卡券 - 用户领取卡券
    EVENT_CARD_USER_DEL: 'user_del_card',        //卡券 - 用户删除卡券
    EVENT_MERCHANT_ORDER: 'merchant_order',        //微信小店 - 订单付款通知

//接口地址定义
    API_URL_PREFIX: 'https://api.weixin.qq.com/cgi-bin',
    AUTH_URL: '/token?grant_type:client_credential&',
    MENU_CREATE_URL: '/menu/create?',
    MENU_GET_URL: '/menu/get?',
    MENU_DELETE_URL: '/menu/delete?',
    MENU_ADDCONDITIONAL_URL: '/menu/addconditional?',
    MENU_DELCONDITIONAL_URL: '/menu/delconditional?',
    MENU_TRYMATCH_URL: '/menu/trymatch?',
    GET_TICKET_URL: '/ticket/getticket?',
    CALLBACKSERVER_GET_URL: '/getcallbackip?',
    QRCODE_CREATE_URL: '/qrcode/create?',
    QR_SCENE: 0,
    QR_LIMIT_SCENE: 1,
    QRCODE_IMG_URL: 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket:',
    SHORT_URL: '/shorturl?',
    USER_GET_URL: '/user/get?',
    USER_INFO_URL: '/user/info?',
    USERS_INFO_URL: '/user/info/batchget?',
    USER_UPDATEREMARK_URL: '/user/info/updateremark?',
    GROUP_GET_URL: '/groups/get?',
    USER_GROUP_URL: '/groups/getid?',
    GROUP_CREATE_URL: '/groups/create?',
    GROUP_UPDATE_URL: '/groups/update?',
    GROUP_MEMBER_UPDATE_URL: '/groups/members/update?',
    GROUP_MEMBER_BATCHUPDATE_URL: '/groups/members/batchupdate?',
    CUSTOM_SEND_URL: '/message/custom/send?',
    MEDIA_UPLOADNEWS_URL: '/media/uploadnews?',
    MASS_SEND_URL: '/message/mass/send?',
    TEMPLATE_SET_INDUSTRY_URL: '/template/api_set_industry?',
    TEMPLATE_ADD_TPL_URL: '/template/api_add_template?',
    TEMPLATE_SEND_URL: '/message/template/send?',
    MASS_SEND_GROUP_URL: '/message/mass/sendall?',
    MASS_DELETE_URL: '/message/mass/delete?',
    MASS_PREVIEW_URL: '/message/mass/preview?',
    MASS_QUERY_URL: '/message/mass/get?',
    UPLOAD_MEDIA_URL: 'http://file.api.weixin.qq.com/cgi-bin',
    MEDIA_UPLOAD_URL: '/media/upload?',
    MEDIA_UPLOADIMG_URL: '/media/uploadimg?',//图片上传接口
    MEDIA_GET_URL: '/media/get?',
    MEDIA_VIDEO_UPLOAD: '/media/uploadvideo?',
    MEDIA_FOREVER_UPLOAD_URL: '/material/add_material?',
    MEDIA_FOREVER_NEWS_UPLOAD_URL: '/material/add_news?',
    MEDIA_FOREVER_NEWS_UPDATE_URL: '/material/update_news?',
    MEDIA_FOREVER_GET_URL: '/material/get_material?',
    MEDIA_FOREVER_DEL_URL: '/material/del_material?',
    MEDIA_FOREVER_COUNT_URL: '/material/get_materialcount?',
    MEDIA_FOREVER_BATCHGET_URL: '/material/batchget_material?',
    OAUTH_PREFIX: 'https://open.weixin.qq.com/connect/oauth2',
    OAUTH_AUTHORIZE_URL: '/authorize?',

///多客服相关地址
    CUSTOM_SERVICE_GET_RECORD: '/customservice/getrecord?',
    CUSTOM_SERVICE_GET_KFLIST: '/customservice/getkflist?',
    CUSTOM_SERVICE_GET_ONLINEKFLIST: '/customservice/getonlinekflist?',
    API_BASE_URL_PREFIX: 'https://api.weixin.qq.com', //以下API接口URL需要使用此前缀
    OAUTH_TOKEN_URL: '/sns/oauth2/access_token?',
    OAUTH_REFRESH_URL: '/sns/oauth2/refresh_token?',
    OAUTH_USERINFO_URL: '/sns/userinfo?',
    OAUTH_AUTH_URL: '/sns/auth?',
    CUSTOM_SESSION_CREATE: '/customservice/kfsession/create?',
    CUSTOM_SESSION_CLOSE: '/customservice/kfsession/close?',
    CUSTOM_SESSION_SWITCH: '/customservice/kfsession/switch?',
    CUSTOM_SESSION_GET: '/customservice/kfsession/getsession?',
    CUSTOM_SESSION_GET_LIST: '/customservice/kfsession/getsessionlist?',
    CUSTOM_SESSION_GET_WAIT: '/customservice/kfsession/getwaitcase?',
    CS_KF_ACCOUNT_ADD_URL: '/customservice/kfaccount/add?',
    CS_KF_ACCOUNT_UPDATE_URL: '/customservice/kfaccount/update?',
    CS_KF_ACCOUNT_DEL_URL: '/customservice/kfaccount/del?',
    CS_KF_ACCOUNT_UPLOAD_HEADIMG_URL: '/customservice/kfaccount/uploadheadimg?',

///卡券相关地址
    CARD_CREATE: '/card/create?',
    CARD_DELETE: '/card/delete?',
    CARD_UPDATE: '/card/update?',
    CARD_GET: '/card/get?',
    CARD_USER_GETCARDLIST: '/card/user/getcardlist?',
    CARD_BATCHGET: '/card/batchget?',
    CARD_MODIFY_STOCK: '/card/modifystock?',
    CARD_LOCATION_BATCHADD: '/card/location/batchadd?',
    CARD_LOCATION_BATCHGET: '/card/location/batchget?',
    CARD_GETCOLORS: '/card/getcolors?',
    CARD_QRCODE_CREATE: '/card/qrcode/create?',
    CARD_CODE_CONSUME: '/card/code/consume?',
    CARD_CODE_DECRYPT: '/card/code/decrypt?',
    CARD_CODE_GET: '/card/code/get?',
    CARD_CODE_UPDATE: '/card/code/update?',
    CARD_CODE_UNAVAILABLE: '/card/code/unavailable?',
    CARD_TESTWHILELIST_SET: '/card/testwhitelist/set?',
    CARD_MEETINGCARD_UPDATEUSER: '/card/meetingticket/updateuser?',    //更新会议门票
    CARD_MEMBERCARD_ACTIVATE: '/card/membercard/activate?',      //激活会员卡
    CARD_MEMBERCARD_UPDATEUSER: '/card/membercard/updateuser?',    //更新会员卡
    CARD_MOVIETICKET_UPDATEUSER: '/card/movieticket/updateuser?',   //更新电影票(未加方法)
    CARD_BOARDINGPASS_CHECKIN: '/card/boardingpass/checkin?',     //飞机票-在线选座(未加方法)
    CARD_LUCKYMONEY_UPDATE: '/card/luckymoney/updateuserbalance?',     //更新红包金额

//其他类接口地址
    SEMANTIC_API_URL: '/semantic/semproxy/search?' //语义理解
};


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
                console.log('我收到的是：', xml);
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
                        //注册事件
                        me.emit('ready', me, req, res);
                    });
                }else{
                    me.postXML = xml;
                    me.getRev();
                    //注册事件
                    me.emit('ready', me, req, res);
                }
            }
        });
    }else if ( req.query['echostr'] ){
        var echostr = req.query['echostr'];
        if (me.checkSignature(req.query)) {
            res.end( echostr );
        }else{
            console.log('no access');
            res.writeHead(401);
            res.end('no access');
        }
    }
    me.emit('ready', me, req, res);
    return me;
};

//获取微信服务器发来的数据
wechat.prototype.getRev = function(){
    var me = this;
    if (me._receive) return me;
    var postXml = me.postXML;
    if (postXml){
        XmlParse(postXml, function (err, json) {
            var temp = json.xml;
            var rst = {};
            for (var key in temp){
                rst[key] = temp[key][0];
            }
            me._receive = rst;
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

wechat.prototype.reply = function (msg) {
    if ( isObject(msg) ){
        this._msg = msg;
    }
    if ( !isObject(this._msg) ) {
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
    console.log('encrypt_type：', this.encrypt_type);
    console.log('回复的报文：', xmlData);
    this.res.end(xmlData);
};

wechat.prototype.getXML = function () {
    return xml_encode( this._msg );
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
            if (isArray(v)){
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


module.exports = wechat;
