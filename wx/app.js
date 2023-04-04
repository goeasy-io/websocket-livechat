//app.js
import GoEasy from "./static/lib/goeasy-2.6.4.esm.min";
App({
  onLaunch: function () {
    console.log("App onLaunch");
  },
  globalData: {
    goEasy: GoEasy.getInstance({
      host:"hangzhou.goeasy.io",//应用所在的区域地址: 【hangzhou.goeasy.io |singapore.goeasy.io】
      appkey:"BC-xxxxxx",// common key
      modules: ['pubsub']
    })
  }
});
