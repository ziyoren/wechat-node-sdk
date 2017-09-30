# 客服消息

`0.2.0 新增`

## 方法清单：

### getCustomServiceList(callback) : void

* 作用：获取所有客服账号
* 参数：callback(err, data, wechat) < function >

> err 错误对象

> data 接口返回数据

> wechat 微信实例对象

* 返回：无


### KfText(message, toUser) : wechat

* 作用：设置待发送的文本消息
* 参数：
> message < string > 需要发送的文本内容

> toUser < string > OpenID

* 返回：微信实例对象


### KfImage(mediaId, toUser) : wechat

* 作用：设置待发送的图片消息
* 参数：
> mediaId < string > 图片媒体ID

> toUser < string > OpenID

* 返回：微信实例对象


### KfVoice(mediaId, toUser) : wechat

* 作用：设置待发送的语音消息
* 参数：
> mediaId < string > 语音媒体ID

> toUser < string > OpenID

* 返回：微信实例对象


### KfVideo(mediaId, thumb_id, title, description, toUser) : wechat
 
 * 作用：设置待发送的视频消息
 * 参数：
 > mediaId < string > 视频媒体ID `仅支持调用上传API生成ID`
 
 > thumb_id < string > 缩略图的媒体ID
 
 > title < string > 标题
 
 > description < string > 描述
 
 > toUser < string > OpenID
 
 * 返回：微信实例对象
 
 
### KfNews(newsList, toUser) : wechat

* 作用：设置待发送图文消息（外部链接），不得大于8条
* 参数：
> toUser < string > OpenID

> newsList < Array > 图文列表
```
//newsList格式如下：
[
    {
        "title":"Happy Day 1",
        "description":"Is Really A Happy Day",
        "url":"URL",
        "picurl":"PIC_URL"
    },
    {
        "title":"Happy Day 2",
        "description":"Is Really A Happy Day",
        "url":"URL",
        "picurl":"PIC_URL"
    }
]
```
 
* 返回：微信实例对象


### KfMpNews(newsList, toUser) : wechat

* 作用：设置待发送图文消息（微信图文），不得大于8条
* 参数：`待测试`
* 返回：微信实例对象

### kfWxcard(cardid, toUser) : wechat

* 作用：设置待发送卡劵消息
* 参数：`待测试`
* 返回：微信实例对象


### sendMessage(callback, message) : void

* 作用：真正的发送消息方法
* 参数：
> callback(err, data, wechat) < function > 回调方法

> message < JsonObject > 可选参数，待发送的消息体

* 返回：void