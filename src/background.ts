import prepared from './background-prepared.json';
export type BackgroundMode='auto-contrast'|'auto-palette';
export type BackgroundInput={mode?:BackgroundMode;override?:string};
export function normalizeColor(color:string):string{
 if(!/^#[0-9a-f]{6}$/i.test(color))throw new Error('Background must be a six-digit hex color (#RRGGBB).');
 return color.toUpperCase();
}
export function luminance(color:string):number{
 const c=normalizeColor(color).slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
export function railColorFor(color:string):string{
 const l=luminance(color);return (l+.05)/.05>=1.05/(l+.05)?'#000000':'#FFFFFF';
}
export const defaultBackgroundInput=prepared.defaultInput as BackgroundInput;
export const availableBackgroundModes=Object.entries(prepared.decisions).filter(([,v])=>v!==null).map(([k])=>k as BackgroundMode);
export function withoutBackgroundOverride(input:BackgroundInput,available:BackgroundMode[]=availableBackgroundModes):BackgroundInput{
 const mode=input.mode??'auto-contrast';
 const next=available.includes(mode)?mode:available[0];
 if(!next)throw new Error('Prepare an automatic background before removing the override.');
 return {mode:next};
}

type Prepared={decisions:Record<string,{color:string}|null>};
export function resolveBackground(input:BackgroundInput=defaultBackgroundInput,data:Prepared=prepared){
 const mode=input.mode??'auto-contrast';
 if(!['auto-contrast','auto-palette'].includes(mode))throw new Error('Unknown background mode');
 const decision=data.decisions[mode];
 const color=input.override!==undefined?normalizeColor(input.override):decision?.color;
 if(!color)throw new Error(`Prepare a ${mode} background decision before preview/render.`);
 return {mode,color:normalizeColor(color),railColor:railColorFor(color),overridden:input.override!==undefined};
}
