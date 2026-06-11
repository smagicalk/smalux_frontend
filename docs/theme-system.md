# 主题系统

## 主题类型

`smalux` 主题系统分为两类。

### 后台主题

后台主题只允许配置 UI token，不允许上传可执行代码。

可配置：

- 主色。
- 强调色。
- 状态色。
- 图表色。
- 圆角。
- 密度。
- 字体。
- 深色/浅色模式。

### 公开主页主题

公开主页主题允许上传 zip 包，因此必须视为高风险功能。

用途：

- 自定义公开状态页。
- 自定义服务器卡片布局。
- 自定义图表样式。
- 自定义品牌展示。

## 主题包结构

建议结构：

```txt
theme.zip
  smalux-theme.json
  dist/
    index.html
    assets/
  preview.png
```

## manifest

`smalux-theme.json` 示例：

```json
{
  "name": "Modern Status",
  "short": "modern-status",
  "version": "1.0.0",
  "author": "smalux",
  "description": "A modern public status theme",
  "entry": "dist/index.html",
  "preview": "preview.png",
  "configuration": [
    {
      "key": "brandName",
      "label": "品牌名称",
      "type": "string",
      "default": "smalux",
      "required": true,
      "group": "基础"
    },
    {
      "key": "primaryColor",
      "label": "主色",
      "type": "color",
      "default": "#00967d",
      "required": true,
      "group": "颜色"
    },
    {
      "key": "showOfflineNodes",
      "label": "展示离线服务器",
      "type": "boolean",
      "default": true,
      "required": false,
      "group": "展示"
    }
  ]
}
```

## configuration 参数类型

支持类型：

- `string`
- `number`
- `boolean`
- `color`
- `select`
- `textarea`
- `image`

通用字段：

| 字段 | 说明 |
| --- | --- |
| `key` | 参数键，只允许字母、数字、短横线、下划线 |
| `label` | 后台显示名称 |
| `type` | 参数类型 |
| `default` | 默认值 |
| `required` | 是否必填 |
| `group` | 表单分组 |
| `description` | 参数说明 |
| `options` | select 可选项 |
| `min` / `max` | number 范围 |
| `pattern` | string 校验 |

## 上传设置参数

系统设置中需要提供：

```json
{
  "themeUpload": {
    "enabled": true,
    "maxZipSizeMb": 20,
    "maxExtractedSizeMb": 80,
    "allowedFileExtensions": [".html", ".css", ".js", ".json", ".png", ".jpg", ".webp", ".svg", ".woff2"],
    "requirePreview": false,
    "allowThemeScripts": true,
    "isolatePublicThemeCookies": true,
    "maxThemeCount": 20
  }
}
```

说明：

- `allowThemeScripts` 如果为 true，公开主题必须与后台 Cookie 隔离。
- `isolatePublicThemeCookies` 必须默认为 true。
- `maxExtractedSizeMb` 用于防止 zip bomb。
- 文件扩展名必须服务端校验。

## 上传安全校验

服务端必须：

- 限制 zip 大小。
- 限制解压后总大小。
- 限制文件数量。
- 禁止 `../` 路径穿越。
- 禁止绝对路径。
- 校验 manifest。
- 校验 entry 是否存在。
- 解压到独立目录。
- 支持预览后启用。
- 支持回滚。

## 公开主题隔离

公开主题页面：

- 不携带后台 Cookie。
- 只能访问公开 API。
- 使用独立 CSP。
- 不能调用后台 `/api/admin/*`。
- 不展示敏感运行时配置。

推荐公开 API：

```txt
GET /api/public/status
GET /api/public/nodes
GET /api/public/metrics
```

## 后台主题变量

后台主题继续使用 CSS variables：

```txt
--background
--foreground
--card
--primary
--accent
--success
--warning
--danger
--chart-1
--chart-2
--chart-3
--chart-4
```

后台主题不允许执行脚本，只能保存变量值。
