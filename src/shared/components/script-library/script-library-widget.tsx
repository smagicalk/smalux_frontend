import { useState, useMemo, useRef } from "react";
import {
  Sparkles,
  Search,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  Code2,
  Tag,
  Loader2
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "sonner";
import type { ScriptItem, ScriptGroup } from "./types";
import {
  useScripts,
  useScriptGroups,
  useCreateScript,
  useUpdateScript,
  useDeleteScript,
  useSaveScriptGroups
} from "./api/use-script-api";

export interface ScriptLibraryWidgetProps {
  /** 点击“填入 / 使用”时的回调函数 */
  onSelectScript?: (command: string, scriptTitle: string) => void;
  /** 触发气泡浮动方位（默认屏幕右下方） */
  position?: "bottom-right" | "bottom-left";
  /** 自定义外层样式 */
  className?: string;
  /** 是否以嵌入模式而非悬浮气泡模式渲染 */
  embedded?: boolean;
}

export function ScriptLibraryWidget({
  onSelectScript,
  position = "bottom-right",
  className = "",
  embedded = false
}: ScriptLibraryWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── 纯 HTTP API 数据流 ──
  const { data: scripts = [], isLoading: scriptsLoading } = useScripts();
  const { data: groups = [] } = useScriptGroups();

  const createScript = useCreateScript();
  const updateScript = useUpdateScript();
  const deleteScript = useDeleteScript();
  const saveGroups = useSaveScriptGroups();

  // ── 编辑 / 新增脚本表单 ──
  const [editScriptModalOpen, setEditScriptModalOpen] = useState(false);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [scriptForm, setScriptForm] = useState({
    title: "",
    category: "",
    desc: "",
    command: ""
  });

  // ── 分组管理表单 ──
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editingGroupLabel, setEditingGroupLabel] = useState("");

  // 过滤后的脚本列表
  const filteredScripts = useMemo(() => {
    return scripts.filter((item) => {
      const matchCat =
        activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.desc && item.desc.toLowerCase().includes(q)) ||
        item.command.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [scripts, activeCategory, searchQuery]);

  const handleCopy = (e: React.MouseEvent, id: string, cmd: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    toast.success("指令已成功复制到剪贴板");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (cmd: string, title: string) => {
    if (onSelectScript) {
      onSelectScript(cmd, title);
    } else {
      navigator.clipboard.writeText(cmd);
      toast.success(`已复制 [${title}] 指令`);
    }
  };

  // 打开新建脚本
  const handleOpenCreate = () => {
    setEditingScriptId(null);
    setScriptForm({
      title: "",
      category: activeCategory !== "all" ? activeCategory : (groups[0]?.key || "system"),
      desc: "",
      command: ""
    });
    setEditScriptModalOpen(true);
  };

  // 打开编辑脚本
  const handleOpenEdit = (e: React.MouseEvent, item: ScriptItem) => {
    e.stopPropagation();
    setEditingScriptId(item.id);
    setScriptForm({
      title: item.title,
      category: item.category,
      desc: item.desc || "",
      command: item.command
    });
    setEditScriptModalOpen(true);
  };

  // 删除脚本（HTTP Mutation）
  const handleDeleteScript = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    try {
      await deleteScript.mutateAsync(id);
      toast.success(`已删除脚本: ${title}`);
    } catch {
      toast.error("删除脚本失败");
    }
  };

  // 保存脚本（HTTP Mutation）
  const handleSaveScript = async () => {
    if (!scriptForm.title.trim() || !scriptForm.command.trim()) {
      toast.error("请完整填写脚本标题与 Shell 执行指令");
      return;
    }

    const targetCategory = scriptForm.category || groups[0]?.key || "system";

    try {
      if (editingScriptId) {
        await updateScript.mutateAsync({
          id: editingScriptId,
          ...scriptForm,
          category: targetCategory
        });
        toast.success(`已更新脚本 [${scriptForm.title}]`);
      } else {
        await createScript.mutateAsync({
          ...scriptForm,
          category: targetCategory
        });
        toast.success(`已新建脚本 [${scriptForm.title}]`);
      }
      setEditScriptModalOpen(false);
    } catch {
      toast.error("保存脚本失败");
    }
  };

  // 添加自定义分组
  const handleAddGroup = async () => {
    const label = newGroupLabel.trim();
    if (!label) {
      toast.error("请输入分组名称");
      return;
    }
    const key = `grp_${Date.now()}`;
    if (groups.some((g) => g.label === label)) {
      toast.error("该分组名称已存在");
      return;
    }
    const nextGroups = [...groups, { key, label }];
    await saveGroups.mutateAsync(nextGroups);
    setNewGroupLabel("");
    toast.success(`已添加分组: ${label}`);
  };

  // 保存分组重命名
  const handleSaveEditGroup = async (key: string) => {
    const label = editingGroupLabel.trim();
    if (!label) {
      toast.error("分组名称不能为空");
      return;
    }
    const nextGroups = groups.map((g) => (g.key === key ? { ...g, label } : g));
    await saveGroups.mutateAsync(nextGroups);
    setEditingGroupKey(null);
    setEditingGroupLabel("");
    toast.success("分组名称已修改");
  };

  // 删除分组
  const handleDeleteGroup = async (key: string, label: string) => {
    const nextGroups = groups.filter((g) => g.key !== key);
    await saveGroups.mutateAsync(nextGroups);
    if (activeCategory === key) {
      setActiveCategory("all");
    }
    toast.success(`已删除分组 [${label}]`);
  };

  const posClass =
    position === "bottom-right"
      ? "bottom-6 right-6"
      : "bottom-6 left-6";

  const renderCardContent = () => (
    <div className="w-96 sm:w-[430px] max-h-[600px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150 text-xs">
      {/* 浮窗顶部 Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xs">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              运维脚本库
              <Badge variant="neutral" className="text-[9px] px-1 py-0 font-mono">
                {scripts.length}
              </Badge>
            </h3>
            <p className="text-[10px] text-muted-foreground">HTTP API 驱动 · 命令模板助手</p>
          </div>
        </div>

        {/* 顶部快捷操作 */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCreate}
            className="h-6.5 text-[10px] px-2 gap-1 cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
          >
            <Plus className="size-3" /> 新增脚本
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setGroupModalOpen(true)}
            className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="管理分组"
          >
            <FolderPlus className="size-3.5" />
          </Button>
          {!embedded && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="size-6.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* 搜索与可滑动的分组导航栏 */}
      <div className="p-3 space-y-2 border-b border-border/40 bg-muted/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索脚本名称、指令关键词..."
            className="w-full h-8 rounded-lg border border-border/80 bg-background/80 pl-8 pr-7 text-xs outline-none focus:border-primary text-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* 分组栏 */}
        <div className="relative flex items-center">
          <div
            ref={scrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY * 0.8;
              }
            }}
            className="flex items-center gap-1.5 overflow-x-auto text-[11px] w-full select-none no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-0.5"
          >
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-medium text-xs ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 bg-muted/20 border border-transparent"
              }`}
            >
              全部 ({scripts.length})
            </button>

            {groups.map((cat) => {
              const count = scripts.filter((s) => s.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer font-medium text-xs ${
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 bg-muted/20 border border-transparent"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 脚本列表区域 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[360px]">
        {scriptsLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span>加载脚本库中...</span>
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Search className="size-5 text-muted-foreground/50" />
            <span>未找到相关脚本</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenCreate}
              className="h-7 text-xs mt-1 cursor-pointer"
            >
              <Plus className="size-3 mr-1" /> 为此分类新建一条脚本
            </Button>
          </div>
        ) : (
          filteredScripts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleApply(item.command, item.title)}
              className="rounded-xl border border-border/60 bg-card/60 p-2.5 hover:bg-muted/40 hover:border-primary/40 transition-all cursor-pointer group shadow-2xs relative"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted/80 text-muted-foreground border border-border/40 shrink-0">
                    {groups.find((g) => g.key === item.category)?.label || item.category}
                  </span>
                </div>

                {/* 卡片右侧动作区 */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(e, item)}
                    title="编辑脚本"
                    className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Edit2 className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteScript(e, item.id, item.title)}
                    title="删除脚本"
                    className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, item.id, item.command)}
                    title="复制命令"
                    className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              </div>

              {item.desc && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {item.desc}
                </p>
              )}

              <div className="mt-1.5 font-mono text-[10px] text-zinc-300 truncate bg-zinc-950 p-1.5 rounded-md border border-zinc-900 flex items-center justify-between">
                <span className="truncate pr-2">{item.command}</span>
                <span className="text-[9px] text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity font-sans font-semibold">
                  点击填入 ↵
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部 Footer */}
      <div className="px-3.5 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>点击卡片填入，或右侧复制指令</span>
        <span className="font-mono text-zinc-500">Smalux Script Hub</span>
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        renderCardContent()
      ) : (
        <div className={`fixed ${posClass} z-50 select-none ${className}`}>
          {isOpen && (
            <div className="absolute bottom-full right-0 mb-3">
              {renderCardContent()}
            </div>
          )}

          {/* 悬浮主气泡按钮 */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`group relative flex items-center gap-1.5 rounded-full px-3 py-2 bg-primary text-primary-foreground shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-primary/20 shrink-0 ${
              isOpen ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
            }`}
            title="常用运维脚本库"
          >
            <Sparkles className={`size-3.5 transition-transform ${isOpen ? "rotate-45 text-purple-200" : "group-hover:rotate-12"}`} />
            <span className="text-xs font-bold whitespace-nowrap">
              脚本库
            </span>
          </button>
        </div>
      )}

      {/* ── 弹窗 1: 新建 / 编辑脚本弹窗 ── */}
      <Dialog open={editScriptModalOpen} onOpenChange={setEditScriptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Code2 className="size-4 text-primary" />
              {editingScriptId ? "编辑运维脚本" : "新建运维脚本"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              保存在云端脚本库中，随时在任何页面一键填入或复制执行
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">脚本标题</label>
              <input
                value={scriptForm.title}
                onChange={(e) => setScriptForm({ ...scriptForm, title: e.target.value })}
                placeholder="例如: 快速清理旧镜像"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">所属分组</label>
              <select
                value={scriptForm.category}
                onChange={(e) => setScriptForm({ ...scriptForm, category: e.target.value })}
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/40 px-2.5 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
              >
                {groups.length === 0 ? (
                  <option value="default">默认分组</option>
                ) : (
                  groups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">作用简述 (可选)</label>
              <input
                value={scriptForm.desc}
                onChange={(e) => setScriptForm({ ...scriptForm, desc: e.target.value })}
                placeholder="简要说明该脚本的用途"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Shell 执行指令</label>
              <textarea
                rows={4}
                value={scriptForm.command}
                onChange={(e) => setScriptForm({ ...scriptForm, command: e.target.value })}
                placeholder="例如: docker system prune -af"
                className="w-full rounded-lg border border-border/80 bg-muted/40 p-2 text-xs font-mono outline-none focus:border-primary text-foreground leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditScriptModalOpen(false)}
                className="cursor-pointer h-7 text-xs"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveScript}
                disabled={createScript.isPending || updateScript.isPending}
                className="cursor-pointer h-7 text-xs"
              >
                {createScript.isPending || updateScript.isPending ? "保存中..." : editingScriptId ? "保存修改" : "确认添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 弹窗 2: 分组管理弹窗 ── */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FolderPlus className="size-4 text-primary" />
              管理脚本分组
            </DialogTitle>
            <DialogDescription className="text-xs">
              自由新建、重命名或删除任意分组分类
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {/* 新建分组输入 */}
            <div className="flex items-center gap-1.5">
              <input
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                placeholder="输入新分组名称..."
                className="flex-1 h-8 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
              <Button
                size="sm"
                onClick={handleAddGroup}
                disabled={saveGroups.isPending}
                className="h-8 px-3 text-xs cursor-pointer"
              >
                <Plus className="size-3.5 mr-1" /> 添加
              </Button>
            </div>

            {/* 现有分组列表 */}
            <div className="divide-y divide-border/60 border border-border/60 rounded-lg max-h-56 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-xs">暂无分组，请添加</div>
              ) : (
                groups.map((g) => {
                  const isEditing = editingGroupKey === g.key;
                  const count = scripts.filter((s) => s.category === g.key).length;

                  return (
                    <div
                      key={g.key}
                      className="flex items-center justify-between p-2 hover:bg-muted/30 text-xs gap-2"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            value={editingGroupLabel}
                            onChange={(e) => setEditingGroupLabel(e.target.value)}
                            className="flex-1 h-6 rounded border border-primary px-2 text-xs bg-background outline-none text-foreground"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditGroup(g.key)}
                            className="text-emerald-400 hover:text-emerald-300 p-1 cursor-pointer"
                            title="保存"
                          >
                            <Check className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGroupKey(null)}
                            className="text-zinc-400 hover:text-zinc-300 p-1 cursor-pointer"
                            title="取消"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Tag className="size-3 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate">{g.label}</span>
                            <span className="text-[10px] text-muted-foreground">({count})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGroupKey(g.key);
                                setEditingGroupLabel(g.label);
                              }}
                              className="text-muted-foreground hover:text-primary p-1 cursor-pointer"
                              title="重命名分组"
                            >
                              <Edit2 className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(g.key, g.label)}
                              className="text-muted-foreground hover:text-rose-400 p-1 cursor-pointer"
                              title="删除分组"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setGroupModalOpen(false)}
                className="cursor-pointer h-7 text-xs"
              >
                完成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
