// Follow the same two-level navigation as a player; never reveal hidden controls.
export async function clickMenu(page,selector){
  let local=page.locator('#game-modal[open]').locator(selector).filter({visible:true});
  let visible=page.locator(selector).filter({visible:true});
  if(!await local.count()&&!await visible.count()){
    const more=page.locator('[data-action="more"]').filter({visible:true}).first();
    if(await more.count())await more.click();
    local=page.locator('#game-modal[open]').locator(selector).filter({visible:true});
    visible=page.locator(selector).filter({visible:true});
  }
  await (await local.count()?local.first():visible.first()).click();
}
