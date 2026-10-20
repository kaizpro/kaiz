import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
const native=createRequire(import.meta.url);
export function loadTypescript(overrides={}){
 const cache=new Map();
 const root=fileURLToPath(new URL('../..',import.meta.url));
 function load(file){
  const full=resolve(root,file); if(cache.has(full))return cache.get(full);
  const exports={};cache.set(full,exports);
  const source=readFileSync(full,'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(compiled,{exports,URL,URLSearchParams,FormData,Date,Uint8Array,Buffer,TextDecoder,require(name){
   if(name in overrides)return overrides[name];
   if(name==='server-only')return {};
   if(name.endsWith('.module.css'))return {default:new Proxy({},{get:(_,key)=>String(key)})};
   if(name==='next/link')return {default:({children,scroll,...props})=>{void scroll;return native('react').createElement('a',props,children);}};
   if(name.startsWith('@/')){
    if(name.endsWith('.json'))return {default:JSON.parse(readFileSync(resolve(root,name.slice(2)),'utf8'))};
    return load(name.slice(2)+(name.startsWith('@/components/')?'.tsx':'.ts'));
   }
   if(name.startsWith('./')||name.startsWith('../')){const base=resolve(dirname(full),name);return load(existsSync(base+'.ts')?base+'.ts':base+'.tsx');}
   return native(name);
  }});
  return exports;
 }
 return load;
}
