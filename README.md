# wechat-node-sdk
微信公众平台NodeJS开发包, weixin developer SDK for NodeJS.

## 微信官方技术文档

微信公众平台： http://mp.weixin.qq.com/wiki/

微信企业平台： http://qydev.weixin.qq.com/wiki/

微信支付接入文档：
https://mp.weixin.qq.com/cgi-bin/readtemplate?t=business/course2_tmpl&lang=zh_CN

微信多客服：https://mpkf.weixin.qq.com/

##	参考文档
参考 Wechat-php-sdk(https://github.com/dodgepudding/wechat-php-sdk)

## 安装
```
npm install wechat-node-sdk
```

## 初始化基本代码
```
var options = {
      'token':'tokenaccesskey',           //填写你设定的Token
      'encodingaeskey':'encodingaeskey',  //填写加密用的EncodingAESKey
      'appid':'wxappid',                  //填写高级调用功能的appid
      'appsecret':'xxxxxxxxxxxxxxxxxxx'   //填写高级调用功能的密钥
    };

var wechat = require('wechat-node-sdk');

var wx = new wechat(options);
//TODO：调用wx各实例方法
```

##  Using with Express 3/4
```
var app = require('express')();
var server = require('http').Server(app);
var wechat = require('wechat-node-sdk');

server.listen(6658, '127.0.0.1');

app.use('/wechat', _handler );


var options = {
    'token':'tokenaccesskey',           //填写你设定的Token
    'encodingaeskey':'encodingaeskey',  //填写加密用的EncodingAESKey
    'appid':'wxappid',                  //填写高级调用功能的appid
    'appsecret':'xxxxxxxxxxxxxxxxxxx'   //填写高级调用功能的密钥
};
    
var wx = new wechat(options);    
wx.on('ready', function (_wechat, req, res) {
    var data = _wechat.getRevData();
    console.log('收到的内容：',data);
    data = JSON.stringify(data);
    _wechat.text('你好！' + data).reply();
});  
  
  
function _handler(req, res){
    wx.run(req, res);
}

```

## Using with Node http server
```
var http = require("http");
var url = require("url");
var qs = require("querystring");
var wechat = require("wechat-node-sdk");


//微信公众号相关配置参数
var options = {
    'token':'tokenaccesskey',           //填写你设定的Token
    'encodingaeskey':'encodingaeskey',  //填写加密用的EncodingAESKey
    'appid':'wxappid',                  //填写高级调用功能的appid
    'appsecret':'xxxxxxxxxxxxxxxxxxx'   //填写高级调用功能的密钥
};


//实例化微信类
var wx = new wechat(options);

//监听ready事件，将回复消息的业务逻辑写在这里的回调方法里
wx.on('ready', function (_wechat, req, res) {
    console.log('我收到的数据是：', _wechat.getRevData() );
    //todo some thing
});


http.createServer(function (req, res) {
    var _url = url.parse(req.url);
    var _query = qs.parse(_url.query);
    var originalUrl = _url.pathname;

    if (originalUrl == '/wechat') {
        wx.run(req, res); 
    } else {
        res.writeHead(200, {
            "content-type": "text/plain"
        });
        res.write("hello wechat!");
        res.end();
    }
}).listen(3000);
```