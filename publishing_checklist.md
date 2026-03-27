# App 上架自检清单 (iOS & Android)

为了帮您的 "MiniTools" 应用顺利上架，这里整理了两个平台的关键要求和操作步骤。

## 1. Apple App Store (iOS)

- **Apple 开发者账号**：年费 99 美元（建议在 iPhone 上下载 **Apple Developer** App，可通过**支付宝**支付，约 688 元/年）。
- **App Store Connect**：管理 App 上架信息、价格和版本的后台。
- **素材准备**：
- - **App 图标**：1024x1024px（无圆角、不透明）。
- **屏幕截图**：至少需要 6.5 英寸和 5.5 英寸两种尺寸的演示截图。
- **隐私政策**：必须提供一个公开可访问的隐私政策网址 (URL)。
- **构建版本**：使用 `eas build -p ios` 生成 `.ipa` 文件。
- **审核时间**：初次审核通常需要 24-48 小时。.

## 2. 安卓商店 (Google Play & 国内主流商店)

### Google Play (全球)

- **Google Play Console**：一次性注册费 25 美元。
- **构建版本**：使用 `eas build -p android` 生成 `.aab` 文件。

### 中国大陆安卓商店 (华为、小米、OPPO、Vivo 等)

> [!IMPORTANT]
> 在中国大陆上架移动应用有额外的合规要求。

- **APP 备案**：国内所有 App 上架的**前置条件**，需通过云服务商或商店后台提交备案。
- **软著 (计算机软件著作权登记证书)**：国内主流商店（尤其是华为、小米）上架的基本准入要求。
- **隐私合规自测**：国内对 App 过度收集用户信息查得很严。检查 `app.json` 中的权限声明，确保护照等权限是必需的。  
2

## 3. Expo 专用工具 (EAS)

Expo 提供的 **EAS (Expo Application Services)** 可以极大简化打包和提交流程：

1. **EAS Build**：云端打包（不需要自己配置复杂的本地环境）。
  ```bash
   npm install -g eas-cli
   eas build --profile production
  ```
2. **EAS Submit**：将打包好的安装包自动上传到苹果或安卓后台。
  ```bash
   eas submit -p ios
   eas submit -p android
  ```

## 4. 提交前的最后打磨

- **版本号**：更新 `app.json` 中的 `version` 和 `buildNumber`。
- **权限检查**：删除 `app.json` 中一切不需要的权限，减少审核被拒概率。
- **启动页 (Splash Screen)**：确保在不同比例的屏幕上显示正常（不被压扁或拉伸）。
- **包名/Bundle ID**：确保 `ios.bundleIdentifier` 和 `android.package` 唯一且符合命名规范。  
  


