/** Selected at build time from the content module, never from a save file. */
interface AppConfig {
  id:string; database:string; preferencesKey:string;
  features:{id:string;title:string;description:string}[];
  externalLinks?:{label:string;url:string}[];
}
declare const __GAME_APP__:AppConfig;
export const appConfig=__GAME_APP__;
