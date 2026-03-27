// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 解决外接卷（如 /Volumes/...）上 Watchman 无法正常监控文件的问题
// 使用 node 原生的文件监控，绕过依赖外接卷的 Watchman
config.watchFolders = [__dirname];

// 部分环境下 Watchman 在「建立监听 / 首次 crawl」阶段会长时间阻塞，Metro 一直停在
// “Starting Metro Bundler”。关闭 Watchman、改用 Node 文件系统 API 可恢复（仍支持热重载）。
config.resolver = {
  ...config.resolver,
  useWatchman: false,
};

// 注意：`--localhost` 时 Metro 的 listen 地址由 @expo/cli 决定（不用这里的 server.host）。
// 若 curl http://127.0.0.1:8081/status 为 000，需使用 patches/@expo+cli*.patch 将 bind 改为 127.0.0.1。

module.exports = config;
