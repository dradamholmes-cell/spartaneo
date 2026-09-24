/* Owner-supplied Dance Game soundtrack; Kenney CC0 impact/footstep samples. */
(function(global){
  const tracks=[['streepy_shuffle','The Streepy Shuffle'],['three_halves_at_the_grill','Three Halves at the Grill'],['kings_of_the_concrete','Kings of the Concrete'],['the_pentagon_penguin','The Pentagon Penguin'],['so_many_tears','2Pac — So Many Tears'],['opie_taylor','Yelawolf — Opie Taylor'],['four_beautiful_idiots','Four Beautiful Idiots']];
  const musicBase='https://game.spartaneo.com/highscool-musical/assets/music/';
  const files={punch:'impactPunch_medium_000',heavy:'impactPunch_heavy_000',slam:'impactPlank_medium_000',block:'impactSoft_medium_000',step:'footstep_carpet_000'};
  class Sound{
    constructor({AudioClass=global.Audio,onTrack=()=>{},onError=()=>{}}={}){
      this.supported=!!AudioClass;this.onTrack=onTrack;this.onError=onError;this.index=0;this.musicVolume=.28;this.sfxVolume=.8;this.active=false;this.paused=false;this.last={};this.pools={};
      if(!this.supported)return;
      this.music=new AudioClass();this.music.preload='none';this.music.volume=this.musicVolume;
      this.music.addEventListener('ended',()=>this.next());this.music.addEventListener('error',()=>onError('Song unavailable — choose Next.'));
      for(const [kind,file] of Object.entries(files))this.pools[kind]=Array.from({length:3},()=>{const a=new AudioClass('https://game.spartaneo.com/games/ogb-wrestling/audio/sfx/'+file+'.ogg');a.preload='auto';return a});
    }
    play(a){try{const p=a.play();p?.catch(()=>this.onError('Tap Sound to enable audio.'))}catch{this.onError('Audio unavailable')}}
    start(){if(!this.supported)return;this.last={};this.active=true;this.paused=false;this.select(this.index)}
    select(index){this.index=(index+tracks.length)%tracks.length;if(!this.supported)return;this.music.src=musicBase+tracks[this.index][0]+'.mp3';this.music.volume=this.musicVolume;this.onTrack(tracks[this.index][1]);if(this.active&&!this.paused&&this.musicVolume)this.play(this.music)}
    next(){this.select(this.index+1)}
    volume(kind,value){value=Math.max(0,Math.min(1,Number(value)||0));if(kind==='music'){this.musicVolume=value;if(this.music){this.music.volume=value;if(!value)this.music.pause();else if(this.active&&!this.paused)this.play(this.music)}}else this.sfxVolume=value}
    pause(on){this.paused=on;if(!this.supported)return;if(on){this.music.pause();for(const pool of Object.values(this.pools))for(const a of pool)a.pause()}else if(this.active&&this.musicVolume)this.play(this.music)}
    effect(kind,time=0){
      if(!this.supported||!this.active||this.paused||!this.sfxVolume)return;
      kind=kind==='reversal'?'heavy':kind==='ko'?'slam':kind;
      const pool=this.pools[kind];if(!pool||time-(this.last[kind]??-99)<(kind==='step'?.16:.05))return;
      this.last[kind]=time;const a=pool.find(a=>a.paused)||pool[0];a.currentTime=0;a.volume=this.sfxVolume*(kind==='step'?.3:1);this.play(a);
    }
  }
  global.OGBAudio={Sound,tracks,files,musicBase};
})(globalThis);
