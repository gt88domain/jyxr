import {assetUrl} from './content';

/** UI artwork belongs to the presentation layer, independent of content IDs. */
export const originalMenuArt: Record<string,string> = {
  character:'button_zhuangtai.png',inventory:'button_wupin.png',
  cultivation:'button_jineng.png',quests:'button_rizhi.png',settings:'button_xitong.png',
};
export const originalInterfaceAsset=(name:string)=>assetUrl('art/legacy-interface/'+name);

export function interfaceReferenceView():string {
  return `<button class="button outline full-width" data-action="late-reference">查看 X1.1.0.6 旧版场景复原与具体差异</button><p class="panel-intro">当前复原对照目标是后期1.1.0.6，上方入口提供原场景的只读预览。下面仅是汉家松鼠官方 Silverlight 0.6.x 源码中自带的早期教学截图和原始界面图片，作为辅助参考；不是1.1.0.6截图。截图上的红色教学标记也是原文件的一部分；这不是浏览器重制版的运行截图。</p>
    <div class="interface-choice" role="group" aria-label="界面风格"><button class="button outline" data-action="interface-style" data-id="modern">现代界面</button><button class="button outline" data-action="interface-style" data-id="classic">原版风格</button></div><p class="panel-notice">当前：<strong data-interface-label></strong>。人物、装备与修炼已用后期原图接入真实人物、换装和培养操作；地图与战斗仍沿用参考布局。手机保留大按钮、滚动和战斗确认。两种界面共用人物、道具、剧情、战斗和存档。当前是参考复原，尚非 Unity 1.0／1.1 的逐像素重现。</p>
    <div class="interface-reference-gallery"><figure><a href="${originalInterfaceAsset('help0.jpg')}" target="_blank" rel="noopener noreferrer"><img src="${originalInterfaceAsset('help0.jpg')}" width="800" height="600" alt="官方早期原版教学截图：左上人物信息、大地图地点、右下图标菜单；保留原教学标记"></a><figcaption>官方早期原版 · 800×600 教学截图，点击查看原图。</figcaption></figure><div class="interface-reference-parts"><figure><img src="${originalInterfaceAsset('UI-kuang8.png')}" width="432" height="449" alt="官方原始人物面板边框素材"><figcaption>原始人物面板框图；中间空白由游戏动态填入。</figcaption></figure><figure><img src="${originalInterfaceAsset('skillbox.png')}" width="420" height="260" alt="官方原始技能选择面板底图"><figcaption>原始技能选择底图；文字列表由游戏动态填入。</figcaption></figure></div></div><p class="panel-intro">来源：<a href="https://github.com/hansquirrel/JyGameSilverlight/tree/3fa22b12126bd1e7a3cc2645a4cb200216643175/JyGameSilverlight/JyGame/Resource/ui" target="_blank" rel="noopener noreferrer">官方源码中的 UI 资源</a>；保留<a href="${assetUrl('notices/jygame-silverlight-README.md')}" target="_blank" rel="noopener noreferrer">原项目署名与说明</a>和<a href="${assetUrl('notices/jygame-silverlight-LICENSE.txt')}" target="_blank" rel="noopener noreferrer">GPL 许可全文</a>。上传的 X1.0.0.1 地图、人物、动作仍由当前内容包加载；未运行旧版 EXE 或 DLL。</p>`;
}
