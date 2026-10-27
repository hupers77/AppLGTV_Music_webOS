// 배포용 빌드: JS/CSS 를 압축하고 index.html 에 인라인해서 "파일 1개 요청"으로 만든다.
//   npm install && npm run build   ->   dist/ (index.html, config.xml, icon.png)
// 소스(index.html + js/ + css/)는 그대로도 TV 에서 실행되므로, 빌드는 선택 사항이다.
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = __dirname;
const out = path.join(root, 'dist');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const html = read('index.html');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const cssFile = html.match(/<link rel="stylesheet" href="([^"]+)">/)[1];

// 소스는 ES5 문법만 사용한다. target 'es5' 로 변환하면 ES5 가 아닌 문법이 있을 때 오류가 난다.
const js = esbuild.transformSync(scripts.map(read).join(';\n'), {minify: true, target: 'es5'}).code;
const css = esbuild.transformSync(read(cssFile), {loader: 'css', minify: true}).code;

const result = html
	.replace(/<link rel="stylesheet" href="[^"]+">/, () => '<style>' + css + '</style>')
	.replace(/\s*<script src="[^"]+"><\/script>/g, '')
	.replace('</body>', () => '<script>' + js.trim() + '</script></body>')
	.replace(/>\s+</g, '><')
	.trim();

fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'index.html'), result);
fs.copyFileSync(path.join(root, 'config.xml'), path.join(out, 'config.xml'));
fs.copyFileSync(path.join(root, 'icon.png'), path.join(out, 'icon.png'));

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log('dist/index.html', kb(Buffer.byteLength(result)), `(js ${kb(js.length)}, css ${kb(css.length)})`);
