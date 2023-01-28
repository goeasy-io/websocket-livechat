// 运行 npm run serve --appkey=BC-xxxxxxx

let argv = process.argv;
if (argv) {
    const length = argv.length;
    if (!process.env.VUE_APP_APPKEY) {
        process.env.VUE_APP_APPKEY = argv[length - 1].split('--')[1];
    }
}
const config = require('./package.json');

const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    publicPath: `/show-livechat/${config.version}/web`,
    //只有Https才能使用录音
    devServer : {
        https : true,
        port : 8002
    }
})