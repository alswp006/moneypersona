import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // CP-9: Android 7+ / iOS 16+ 지원. es2020보다 높은 타깃은 그 기기의 파서가
    // 못 읽어 JS가 한 줄도 실행되지 않는다 → 첫 화면부터 흰 화면(검수 반려).
    // 주의: esbuild는 **문법만** 다운레벨하고 빌트인은 폴리필하지 않는다.
    // .at()/structuredClone 같은 최신 빌트인은 scripts/verify-compliance.mjs가 막는다.
    target: 'es2020',
    // @apps-in-toss/web-framework는 절대 external 금지.
    // SDK는 importmap이 아닌 window.ReactNativeWebView 글로벌로 통신하므로
    // 번들에 포함해야 정상 동작. external 설정 시 bare specifier가 번들 첫 줄에
    // 남아 브라우저가 해석 불가 → JS 한 줄도 실행 안 됨 → 흰 화면.
    rollupOptions: {},
  },
});
