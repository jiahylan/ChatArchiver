# Firefox 扩展签名解决方案

## 问题描述

Firefox正式版会阻止安装未签名的扩展，显示错误：
"This add-on could not be installed because it has not been verified"

## 解决方案

### 方案1: 使用 Firefox Developer Edition (推荐)

1. 下载安装 [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)
2. 在地址栏输入 `about:config`
3. 搜索 `xpinstall.signatures.required`
4. 双击将其设置为 `false`
5. 打开 `about:debugging#/runtime/this-firefox`
6. 点击"临时载入附加组件"
7. 选择 `extension/firefox/manifest.json`

### 方案2: 使用 Firefox Nightly

1. 下载安装 [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/)
2. 同样在 `about:config` 中禁用签名检查
3. 按照上述步骤加载扩展

### 方案3: 使用 Firefox ESR

1. 下载安装 [Firefox ESR](https://www.mozilla.org/en-US/firefox/enterprise/)
2. 在 `about:config` 中设置 `xpinstall.signatures.required` 为 `false`
3. 按照上述步骤加载扩展

### 方案4: 提交到 AMO 进行签名 (正式发布)

1. 访问 [AMO Developer Hub](https://addons.mozilla.org/developers/)
2. 注册/登录 Mozilla 账号
3. 点击 "Submit a New Add-on"
4. 选择 "On your own" (仅签名不发布) 或 "On this site" (发布到AMO)
5. 上传 `build/chatarchiver-firefox.zip`
6. 等待审核通过后下载签名版本

## 快速测试步骤

### 使用 Firefox Developer Edition

```bash
# 1. 下载 Firefox Developer Edition
# https://www.mozilla.org/en-US/firefox/developer/

# 2. 打开 Firefox Developer Edition

# 3. 在地址栏输入:
about:config

# 4. 搜索并设置:
xpinstall.signatures.required = false

# 5. 打开:
about:debugging#/runtime/this-firefox

# 6. 点击 "临时载入附加组件"

# 7. 选择文件:
extension/firefox/manifest.json
```

## 验证扩展已安装

1. 打开 `about:addons`
2. 查看 "扩展" 部分
3. 应该能看到 "ChatArchiver" 扩展

## 常见问题

### Q: 为什么Firefox要求签名？

A: 为了保护用户免受恶意扩展的侵害，Mozilla要求所有扩展必须经过审核和签名。

### Q: 正式版Firefox可以禁用签名吗？

A: 不可以。正式版Firefox不允许禁用签名检查。必须使用Developer Edition、Nightly或ESR版本。

### Q: 如何在不发布的情况下获取签名版本？

A: 在AMO提交时选择 "On your own" 选项，扩展只会被签名但不会公开发布。

## 参考链接

- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [Add-on Signing](https://support.mozilla.org/en-US/kb/add-on-signing-introduction)
- [AMO Developer Hub](https://addons.mozilla.org/developers/)