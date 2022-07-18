## ye-deploy

ye-deploy 是非常轻量级前端部署工具

<img src='https://s3.bmp.ovh/imgs/2022/07/18/6ab805121564a77f.gif'>

## 安装
```js
npm i ye-deploy -g
// or
yarn add ye-deploy -g
// 也可以安装到项目中，建议安装全局
npm i ye-deploy -save
```

## 使用
```js
// .ye-deploy.js
module.exports = {
    host:'xxx',
    port:27,
    username:'root',
    privateKey:'~/.ssh/id_rsa',
    distPath:'dist',
    webDir:'/opt/xxx',
    script:'npm run build'
}

// package.json
script:{
    deploy:"ye-deploy",
    deploy2:"ye-deploy --config ./config/deploy"
}

```
你可以在项目根目录下创建 .ye-deploy.js 文件 或者在package.json 中 --config 指定配置文件

## options

|属性|说明|类型|默认值|版本|
|:-:|:-:|:-:|:-:|:-:|
|host|服务器地址|string|-|1.0.1|
|port|端口|string \| number |22|1.0.1|
|username|服务器用户名|string|-|1.0.1|
|password|服务器密码|string|-|1.0.1|
|privateKey|服务器密钥|string|-|1.0.1|
|passphrase|密钥密码|string|-|1.0.1|
|distPath|本地打包文件目录|string|-|1.0.1|
|webDir|服务器上部署的地址|string|-|1.0.1|
|script|项目打包命令|string|-|1.0.1|
|delDistFile|部署完成后是否删除打包文件|boolean|false|1.0.1|
|config|配置文件地址|string|-|1.0.1|
|useUploadValidate|上传过程中 过滤某些文件|(itemPath:string)=>boolean|-|1.0.1|
|useUploadDone|上传完成后允许用户自定义一些操作|(command:YCommand)=> Promise<void> \| void|-|1.0.1|

### YCommand
|属性|说明|类型|默认值|1.0.1|
|:-:|:-:|:-:|:-:|:-:|
|command|需要执行的命令|string|-|1.0.1|
|cwd|运行目录|string|webDir|1.0.1|
|log|是否需要输出日志|boolean|true|1.0.1|


