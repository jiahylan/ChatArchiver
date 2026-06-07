# Firefox 扩展开发指南

## 签名要求

Firefox正式版要求所有扩展必须经过Mozilla签名才能安装。这是为了保护用户免受恶意扩展的侵害。

## 开发和测试选项

### 选项1: 使用 Firefox Developer Edition (推荐)

1. 下载安装 [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)
2. 在地址栏输入 `about:config`
3. 搜索 `xpinstall.signatures.required`
4. 将其设置为 `false`
5. 打开 `about:debugging#/runtime/this-firefox`
6. 点击"临时载入附加组件"，选择 `manifest.json`

### 选项2: 使用 Firefox Nightly

1. 下载安装 [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/)
2. 同样可以禁用签名检查
3. 适合测试最新特性

### 选项3: 使用 Firefox ESR

1. 下载安装 [Firefox ESR](https://www.mozilla.org/en-US/firefox/enterprise/)
2. 同样可以禁用签名检查
3. 适合企业环境

## 提交到 AMO 进行签名

### 步骤

1. 访问 [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. 注册/登录 Mozilla 账号
3. 点击 "Submit a New Add-on"
4. 选择 "On this site" (发布到AMO) 或 "On your own" (仅签名不发布)
5. 上传 `build/chatarchiver-firefox.zip`
6. 填写扩展信息：
   - 名称: ChatArchiver
   - 描述: AI对话归档管理器
   - 类别: 需选择合适类别
7. 提交审核

### 审核时间

- 自动审核: 通常几分钟到几小时
- 人工审核: 如果需要，可能需要几天

### 审核要求

确保扩展符合 [Mozilla Add-on Policies](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/AMO/Policy):

1. **代码质量**: 代码清晰、有注释
2. **隐私政策**: 如收集数据需提供隐私政策
3. **功能描述**: 准确描述扩展功能
4. **无恶意行为**: 不收集敏感信息、不注入广告

## 本地开发技巧

### 快速重载

在 `about:debugging` 页面，点击扩展的 "Reload" 按钮即可快速重载。

### 查看日志

1. 打开 `about:debugging#/runtime/this-firefox`
2. 找到你的扩展
3. 点击 "Inspect" 打开开发者工具
4. 查看 Console 日志

### 测试权限

在扩展的 `manifest.json` 中，只请求必要的权限：

```json
{
  "permissions": [
    "activeTab",      // 只在用户点击时访问当前标签
    "storage"         // 本地存储
  ]
}
```

## 常见问题

### Q: 为什么我的扩展被禁用？

A: Firefox正式版会自动禁用未签名的扩展。请使用 Developer Edition 或提交签名。

### Q: 如何在不发布的情况下测试签名？

A: 在提交时选择 "On your own" 选项，扩展只会被签名但不会发布到AMO。

### Q: 签名后的扩展如何安装？

A: 签名后会收到邮件，包含 `.xpi` 文件下载链接，双击即可安装。

## 参考资源

- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [MDN WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Add-on Policies](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/AMO/Policy)