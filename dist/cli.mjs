#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// ... 复制 src/server.ts 的全部内容到这里 ...
// 你可以直接将 server.ts 的内容粘贴到这里，确保所有工具注册和逻辑都在。
// 只需将文件名改为 cli.ts，并加上上面的 shebang。
// 下面是最后的启动部分：
const server = new Server({
    name: 'paper-reproduction-assistant',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// ...注册 ListToolsRequestSchema、CallToolRequestSchema 的 handler ...
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=cli.mjs.map