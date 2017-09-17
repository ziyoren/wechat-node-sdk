/**
 * Created by sunline on 2017-09-17.
 */
const config = {
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
///多客服相关地址
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
    SEMANTIC_API_URL: '/semantic/semproxy/search?' //语义理解
};

exports.config = config;