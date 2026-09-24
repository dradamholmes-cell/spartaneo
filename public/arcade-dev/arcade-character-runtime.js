(()=>{
  const params=new URL(location.href).searchParams;
  function readLaunch(){
    const character=params.get('character')||'';
    const characterName=params.get('characterName')||'';
    const modelUrl=params.get('characterModel')||'';
    const custom=character.startsWith('custom:');
    return {
      version:1,
      custom,
      character,
      characterId:custom?character.slice(7):character,
      characterName:characterName||character.replace(/^custom:/,''),
      modelUrl:custom?modelUrl:'',
      party:params.get('party')||'',
      arcade:params.get('arcade')==='1',
    };
  }
  async function loadGLB(GLTFLoader){
    const launch=readLaunch();
    if(!launch.custom) return {launch,gltf:null};
    if(!launch.modelUrl) throw new Error('CUSTOM_CHARACTER_MODEL_URL_MISSING');
    if(!GLTFLoader) throw new Error('GLTF_LOADER_REQUIRED');
    const loader=typeof GLTFLoader==='function'?new GLTFLoader():GLTFLoader;
    const gltf=await loader.loadAsync(launch.modelUrl);
    window.dispatchEvent(new CustomEvent('spartaneo:character-ready',{detail:{launch,gltf}}));
    return {launch,gltf};
  }
  window.SpartaneoArcadeCharacter={version:'20260924.07c',readLaunch,loadGLB};
  window.dispatchEvent(new CustomEvent('spartaneo:character-handoff',{detail:readLaunch()}));
})();
