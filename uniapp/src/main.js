import App from './App'
import GoEasy from './lib/goeasy-2.5.20.esm.min.js'

const goEasy = GoEasy.getInstance({
    host: "hangzhou.goeasy.io",//应用所在的区域地址: 【hangzhou.goeasy.io |singapore.goeasy.io】
    appkey: "BC-xxxxxx",// common key,
    modules: ['pubsub']
});

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
    const app = createSSRApp(App)

    app.provide('goEasy', goEasy);

    return {
        app
    }
}
// #endif

