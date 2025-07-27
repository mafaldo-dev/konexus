export {};

declare global {
  interface Window {
    __ORDER_NUMBER__: string | undefined;
    __HOT_RELOAD__: boolean | undefined;
  }
}