import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
  // Compatibilidade com as configurações públicas existentes. Nunca expor
  // process.env inteiro: segredos do build não pertencem ao renderer.
  const env=loadEnv(mode,process.cwd(),'REACT_APP_');
  const keys=['REACT_APP_API_URL','REACT_APP_HEARTBEAT_MS','REACT_APP_SOCKET_URL','REACT_APP_SOCKET_URL_LOCAL'];
  return {
    plugins:[react()],
    base:'./',
    define:Object.fromEntries(keys.map(key=>[`process.env.${key}`,JSON.stringify(process.env[key]??env[key]??'')])),
    build:{outDir:'build',assetsDir:'static',emptyOutDir:true},
    server:{host:'localhost',port:3000,strictPort:true,cors:false},
  };
});
