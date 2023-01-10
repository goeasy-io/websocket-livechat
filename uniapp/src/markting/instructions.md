
#快速实现聊天室和直播间互动

本示例是基于GoEasy Websocket实时通信服务开发的的聊天室示例，支持NVUE, 可以直接编译为安卓APP、iOS APP、各种小程序和H5.

GoEasy Websocket安全稳定，支持海量用户同时在线，每秒千万级消息实时送达。

参考本示例，几行代码，就可以快速的实现发送文字、图片、表情、点赞、弹幕、送礼物、打赏等聊天室互动功能。

[官方开发文档](https://www.goeasy.io/cn/developers/2.x.html)    [开源Demo下载](https://gitee.com/goeasy-io/GoEasyDemo-Uniapp-IM-Chat)


## 应用场景
* 网页聊天室
* 直播间互动聊天室
* 在线会议互动
* 在线课堂互动


##关于GoEasy Websocket实时通讯服务

GoEasy Websocket安全稳定，性能强悍，支持海量用户同时在线，每秒千万级消息实时送达， 服务过大量知名企业的重要线上活动。

支持所有主流Web技术框架和平台：
* VUE和NVUE   
* Web页面
* Uniapp  
* 各种小程序   
* Taro    

##成功案例

* 肯德基全国线上店长大会
* 德勤中国2020应届生线上双选会
* 一加手机线上发布会（2018年至今的所有新款手机线上发布会，均由GoEasy提供支持）
* ...



### 体验步骤
<span style="color: red; font-weight: bold"> 微信小程序特别提醒：</span>          
              
> 要打包为微信小程序，需要登录微信公众平台->微信小程序开发设置->服务器域名, 添加socket合法域名：wss://wx-hangzhou.goeasy.io


*  默认为vue, 可以在pages.json里，切换vue和nvue
*  在app.vue里将appkey替换为您自己的common Key，[获取appkey](https://www.goeasy.io/cn/docs/goeasy-2.x/common/account/developer-account.html).
```js
        globalData:{
                goEasy: GoEasy.getInstance({
                    host:"hangzhou.goeasy.io",//应用所在的区域地址: 【hangzhou.goeasy.io |singapore.goeasy.io】
                    appkey:"BC-xxxx",// common key,
                    modules: ['pubsub']
                })
            }
```
*  运行，即可体验，建议可以同时在浏览器和手机上运行，体验多个客户端之间互动