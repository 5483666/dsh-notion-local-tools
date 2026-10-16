# dsh-notion-local-tools

把你自己的 **notion2api 请求地址 + API key** 接入 DSH，让模型通过 DSH 的本地工具读写当前电脑的文件。

默认提供 **Sonnet 5.5** 与 **Opus 5.5**。插件不包含任何人的服务器地址、API key、Notion cookie、私人会话或测试文件。它也不会在远程服务器上安装服务。

## 复制以下内容给 agent 安装

将下面整段复制给你电脑上的编程 agent。请求地址和 API key 留到本机启动向导中输入，不需要写进这段提示词或发到聊天里。

```text
请帮我在当前电脑安装并验收这个 DSH 插件：
https://github.com/5483666/dsh-notion-local-tools

先阅读仓库最新 README，再检查本机系统、Node.js、DSH 版本和实际使用的 profile。本版要求 Node.js 22.22+、DSH 0.2.0-rc.2；不兼容时先说明，不要绕过版本检查或擅自升级现有 DSH。profile 无法确定时再问我。

保留现有模型、默认选择、工作区权限和其他插件。修改配置前备份，不覆盖整个配置文件。若已有旧手工版 notion-local-tools-adapter，避免重复注册；不要中断正在进行的任务。

通过 DSH 插件管理器安装预打包 Release。以下以 web profile 为例，请按实际 profile 替换：
dsh plugin --profile web add "https://github.com/5483666/dsh-notion-local-tools/releases/download/v0.1.0/dsh-notion-local-tools-0.1.0.tgz"

安装后检查插件加载及依赖情况，准备好本机交互式终端，让我自行输入请求地址和 API key：
dsh plugin --profile web exec dsh-notion-local-tools
如果使用 custom profile，完整启动命令是：
dsh plugin --profile custom exec dsh-notion-local-tools --dsh-profile custom

同一 profile 的旧 Web 服务需要协调停止后再启动，避免端口冲突。不要让我把请求地址或 API key 发到聊天里，不要将它们写入仓库、日志、截图、命令参数或提交记录。密钥输入不回显，向导每次启动都需重新输入地址和密钥。不要在 DSH 当前第三方模型只读设置表单里反复尝试填写。

启动后确认可选择“Notion · 本地工具”的 Sonnet 5.5 / Opus 5.5。用独立测试目录生成含随机文字的 input.txt，让 Sonnet 5.5 通过真实 DSH 工具执行 read → write → read，生成 output.txt，保留末尾换行；模型不得使用 shell 或操作其他文件。最后独立比较两个文件的实际字节，不要仅凭模型声称成功。

最后告诉我安装到哪个 profile、如何再次启动、验收结果与尚未验证的部分。若无法完成真实调用，明确说明卡在哪里，不把安装成功当作读写通过。不连接或修改远程 VPS，不安装 NewAPI/Sub2API，不修改 443。
```

## 安装

本版已按 **DSH 0.2.0-rc.2 / Node.js 22.22+** 制作；先运行 `dsh --version` 检查版本。不兼容时请使用匹配版本，不要绕过 DSH 的版本检查。

在已安装 DSH 的电脑终端执行：

```bash
dsh plugin --profile web add "https://github.com/5483666/dsh-notion-local-tools/releases/download/v0.1.0/dsh-notion-local-tools-0.1.0.tgz"
```

这条命令安装预打包插件并启用其 DSH bundle，不需要运行本项目构建脚本。使用其他 DSH profile 时，将 `web` 换成实际名称；桌面版请使用其自带的插件安装入口或终端。

也可以从源码安装：

```bash
git clone https://github.com/5483666/dsh-notion-local-tools.git
cd dsh-notion-local-tools
dsh plugin --profile web add .
```

若你以前装过手工路径版 `notion-local-tools-adapter`，先停用该旧条目，避免同一个提供方重复注册。不要覆盖整个 DSH 配置文件。

## 填地址和密钥并启动

本版随包提供交互式启动向导。先关闭正在使用同一 profile 的 DSH Web 服务，再运行：

```bash
dsh plugin --profile web exec dsh-notion-local-tools
```

按提示依次输入 **notion2api 请求地址** 和 **API key**。地址例如 `https://your-gateway.example/v1`，完整的 `/v1/chat/completions` 地址也可以。密钥输入不回显，不放在命令参数或终端历史中。然后浏览器会打开 DSH：选择自己的工作区，在模型菜单选择 **Notion · 本地工具 → Sonnet 5.5 / Opus 5.5** 即可。

**每次启动都使用这条向导命令并重新输入地址和密钥。** 密钥仅用于本次 DSH 进程的环境，不持久写入凭据文件。地址只存于权限受限的临时 overlay，向导在退出时尝试清理；插件管理器中断、强退或断电可能留下只含地址的临时文件（系统临时目录中的 `dsh-notion-local-tools-*`），可在停止服务后删除。使用其他 profile 时，内外两处名称都要替换，例如 `dsh plugin --profile custom exec dsh-notion-local-tools --dsh-profile custom`。需要改端口时，在命令末尾添加 `--port 3085`。不要一边运行旧服务，一边启动同端口的新服务。`dsh plugin exec` 在运行期间会持有该 profile 的插件管理锁；安装、升级或卸载其他插件前，先按 Ctrl+C 停止向导服务。

DSH 0.2.0-rc.2 的“设置 → 模型”能显示第三方提供商，但其编辑表单只支持内置提供商；因此本版通过向导配置，不要求在该表单填写密钥。插件不会替你切换默认模型、放开文件权限或取消审批。工作目录、文件权限与审批仍由 DSH 管理。旧手工路径版需要先停用，避免同名提供方重复注册。

如果 CLI 安装位置特殊、向导找不到 DSH，可将 `DSH_CLI_ENTRY` 指向已安装 DSH 的 `lib/bin.js` 再启动。该入口使用本机 Node 启动 DSH，不通过 shell 拼接命令。

**分享方式：**可以把这个 GitHub 链接直接给朋友；请求地址和 API key 通过你们自己的私密渠道分别告知，不要提交到 Issue、截图或公开仓库。HTTPS 地址会加密传输；如果你们使用已有 HTTP 地址，密钥和提交的文件内容会以明文经过该连接。

## 自己验收一次

在工作区新建一个只含测试文字的 `input.txt`，例如自己生成的随机词，然后对 DSH 说：

> 只操作这个工作区的 input.txt 和新的 output.txt。先使用 read 读取 input.txt，再使用 write 将读取到的内容写入 output.txt（保留原文件的末尾换行），最后用 read 回读确认。不要用 shell，不要操作 Notion 页面或其他文件。

检查 DSH 出现真实的 `read → write → read` 轨迹，并在本机打开 `output.txt` 核对。不要只凭模型说“已保存”就判断成功。

模型与工具结果会通过你配置的 notion2api 发给其上游 Notion；只选你愿意经该服务处理的文件。插件没有直接执行文件或 shell 的代码，执行者是本机 DSH。

## 工作原理和限制

DSH 的工具定义、文本历史和实际工具结果被编码为文本，发送到配置的 notion2api。模型返回结构化 JSON 工具决策，插件将其转换为 DSH 原生工具调用。只接受完整 JSON 与本轮已声明的工具名，不从普通回复中猜测操作。

- 针对文本文件与兼容 `createAgentThread` 文字桥接的 notion2api 制作；不是通用的原生 function calling 网关。
- 默认两个模型已在原适配中验证；其他模型即使出现在服务列表里，也需要单独验证结构化输出和工具循环。
- 不支持图片输入。文件操作不是逐 token 输出；每轮携带工具说明和必要历史，会增加输入与延迟。
- 上游认证失效、502、轮询超时仍可能失败。插件保留 DSH 的错误分类与取消，不承诺所有服务或模型长期稳定。
- 源码使用跨平台 Node.js API；实际 DSH 集成验收以发行说明列出的系统为准，不能把单元测试等同于另一台电脑的现场验证。

## 停用 / 卸载

```bash
dsh plugin --profile web remove dsh-notion-local-tools
```

不会删除你的业务文件。需要继续使用的旧会话先切到其他模型。凭据由 DSH 单独管理，如不再使用，请通过原先保存该凭据的入口移除相应凭据；本向导不保存密钥。

## 开发

```bash
npm ci --ignore-scripts --legacy-peer-deps
npm run check
npm pack --ignore-scripts
```

`--legacy-peer-deps` 仅用于本项目独立开发测试；正常用户通过 DSH 安装，不要用它绕过 DSH 的运行时版本检查。本项目不提供安装或构建生命周期脚本。MIT License。
