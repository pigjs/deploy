export interface YOpts {
    host:string, // 服务器地址
    port:string | number, // 端口
    username:string, // 服务器用户名
    password:string, // 服务器密码
    privateKey:string, // 服务器密钥
    passphrase:string, // 密钥密码
    distPath:string, // 本地打包文件目录
    webDir:string, // 服务器上部署的地址
    script:string, // 项目打包命令
    delDistFile:boolean, // 部署完成后是否删除打包文件
    config?:string, // 配置文件地址
    cwd:string,
    useUploadValidate?:(itemPath:string)=>boolean, // 上传过程中 过滤某些文件
    useUploadDone?:(command)=> Promise<void> | void, // 上传完成后允许用户自定义一些操作
}