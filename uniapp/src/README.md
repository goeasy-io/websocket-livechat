## GoEasy Websocket Uniapp Vue3 直播间弹幕和聊天室示例运行步骤

本示例，可以编译为H5、ios app和android ios和微信小程序，以及其他各种小程序

### 免费获取appkey
1. 访问[GoEasy官网](https://www.goeasy.io)进行注册
2. 登陆后，创建一个应用
3. 进入应用详情，即可看到自己的appkey

### 替换appkey
打开main.js，找到初始化GoEasy的地方，将appkey替换成您应用的common key


### 小程序注意事项
如果编译为微信小程序，需要登录到微信官方后台，将wx-hangzhou.goeasy.io加入到socket合法域名列表

### 体验
建议可以同时运行到多个终端（比如h5或app），体验多个客户端之间互动。
