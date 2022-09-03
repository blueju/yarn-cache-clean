#!/usr/bin/env node

const fs = require("fs");
const del = require("del");
const path = require("path");
const glob = require("glob");
const execa = require("execa");
const { program } = require("commander");

program
  .name("ycc")
  .description("一个清理 yarn 指定依赖 cache 的小工具")
  .version(require("./package.json").version);

program
  .command("clean")
  .description("清理指定依赖包的 yarn cache")
  .argument("<packageName>", "依赖包的名字")
  .action(async (packageName) => {
    const { stdout: yarnCacheDir } = execa.commandSync("yarn cache dir");
    const allCacheDirPathList = fs.readdirSync(yarnCacheDir);
    /** 缓存的文件夹路径列表 */
    let cacheDirPathList = allCacheDirPathList
      // 过滤出文件夹名含 packageName 的文件夹路径
      .filter((item) => item.includes(`npm-${packageName}-`))
      // 转换为文件夹根路径
      .map((item) => path.join(yarnCacheDir, item, "/"));

    /** tmp 缓存的文件夹路径列表 */
    const tmpCacheDirPathList = glob
      .sync("./.tmp/*/package.json", {
        cwd: yarnCacheDir,
      })
      .map((item) => path.join(yarnCacheDir, item))
      .filter((item) => {
        const package = fs.readFileSync(item);
        const packageJson = JSON.parse(package);
        return packageJson.name === packageName;
      })
      .map((item) => {
        return path.join(item, "../");
      });
    if (tmpCacheDirPathList.length || cacheDirPathList.length) {
      del([].concat(tmpCacheDirPathList, cacheDirPathList), { force: true })
        .then(() => {
          console.log("success");
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("无需要清理的缓存");
    }
  });

program.parse();
