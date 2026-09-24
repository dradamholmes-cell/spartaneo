const CHANNEL='spartaneo-arcade';
const post=(type,payload={})=>{
  if(window.parent&&window.parent!==window) window.parent.postMessage({channel:CHANNEL,type,payload,sentAt:Date.now()},window.location.origin);
};
const button=id=>document.getElementById(id);
const clickIf=(id,predicate)=>{const el=button(id);if(el&&predicate(el))el.click()};
window.addEventListener('message',event=>{
  if(event.origin!==window.location.origin) return;
  const data=event.data;
  if(!data||data.channel!==CHANNEL) return;
  if(data.type==='shell-pause') clickIf('pause',el=>el.textContent.trim()==='PAUSE');
  if(data.type==='shell-resume') clickIf('pause',el=>el.textContent.trim()==='RESUME');
  if(data.type==='shell-sound'){
    const enabled=data.payload?.enabled!==false;
    for(const [id,value] of [['musicVolume',enabled ? 0.28 : 0],['sfxVolume',enabled ? 0.8 : 0]]){
      const el=button(id);if(!el)continue;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }
});
const announce=()=>post('game-ready',{id:'ring-riot',title:'RING RIOT',engine:'threejs'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',announce,{once:true});else announce();
const message=button('message');
if(message){
  new MutationObserver(()=>{
    if(!message.hidden){post('game-over',{result:button('result')?.textContent||'MATCH OVER'})}
  }).observe(message,{attributes:true,attributeFilter:['hidden']});
}
